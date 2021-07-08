require("dotenv").config();
const fetch = require("node-fetch");
const sgMail = require("@sendgrid/mail");
const { saveToFireBase, getById, updateOnFireBase, deleteOnFirebase } = require("./../db/firebaseDb");
/*
retrieves the geographic coordinates for human addresses
*/
const getGeolocation = async (address) => {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.GOOGLE_API_KEY}`;
    let response = await fetch(url);
    response = await response.json();
    if (response.status !== "OK") {
        const errMessage = response.error_message || "An error occurred while getting the geolocation";
        throw Error(errMessage);
    }
    return response;
}
/*
retrieves the amount for a pick-up and delivery services from gokada logistics
*/
const fetchFareRate = async (body) => {
    console.log("fetching fare for...", body);
    const deliveryAddress = await getGeolocation(body.deliveryAddress);
    const pickupAddress = await getGeolocation(body.pickupAddress);
    const delivery = deliveryAddress.results[0].geometry.location;
    const pickup = pickupAddress.results[0].geometry.location;
    const url = process.env.GOKADA_API_MOCK;
    const mainBody = {
        api_key: process.env.GOKADA_API_KEY,
        pickup_latitude: pickup.lat.toString(),
        pickup_longitude: pickup.lng.toString(),
        delivery_latitude: delivery.lat.toString(),
        delivery_longitude: delivery.lng.toString()
    };
    console.log(`HTTP request to ${url} with body`, body);
    let response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: mainBody
    });
    if (response.status !== 200) {
        const error = await response.json();
        console.error("Error response ", error);
        throw Error(error.message)
    }
    response = await response.json();
    console.log("Response from HTTP request", response);
    return response;

}
// validates request body parameters to ensure they are valid and complete
const validate = (body) => {
    let errorMessage = [];
    if (!body.pickupAddress) {
        errorMessage.push({
            "fieldName": "pickupAddress",
            "message": "pickupAddress is required"
        });
    };
    if (!body.deliveryAddress) {
        errorMessage.push({
            "fieldName": "deliveryAddress",
            "message": "deliveryAddress is required"
        });
    }
    if (!body.recipientEmail) {
        errorMessage.push({
            "fieldName": "recipientEmail",
            "message": "recipientEmail is required"
        });
    }
    return errorMessage;
}
// writes and overrides data in the database
const writeRate = async (req, res, id, callback) => {
    let fareResponse = await fetchFareRate(req.body);
    const data = {
        ...fareResponse,
        email: req.body.recipientEmail,
        pickupAddress: req.body.pickupAddress,
        deliveryAddress: req.body.deliveryAddress,
        createdAt: new Date().toUTCString()
    }
    /* Saves/Updates data in the database*/
    await callback(id, data);
    return sendFare(req, res, id, fareResponse);
}
// handles catch for server errors
const handleCatch = (req, res, error) => {
    console.error(error);
    if (error.response) {
        return res.status(400).json({
            success: false,
            message: error.message,
            data: error.response.body
        });
    }
    return res.status(400).json({
        success: false,
        message: error.message
    });
}

/*Sends a mail containing the fare details to the requester's email address */
const sendFare = async (req, res, id, fareResponse) => {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
        to: `${req.body.recipientEmail}`,
        from: `${process.env.EMAIL}`,
        subject: "Your requested shipment rate from Gokada",
        html: getEmailBody(req, id, fareResponse)
    };

    let response = await sgMail.send(msg);
    if (response[0].statusCode !== 202) {
        throw Error("There was an error sending the mail, please try again later.");
    }
    return {
        success: true,
        message: "Your requested shipment rate from Gokada has been forwarded to your email"
    };
}
// body for email parameters that will be sent to the requester
const getEmailBody = (req, id, fareResponse) => {
    const url = `http://${req.get("host")}/rates/${id}`
    const emailBody = `
    <h2>Here are your requested shipment details:</h2>
    <p>Pickup address - ${req.body.pickupAddress}</p>
    <p>Delivery address - ${req.body.deliveryAddress}</p>
    <p>Fare - # ${fareResponse.fare}</p>
    <p>
        <a href='${url}'>Click here</a> to view your shipment details 
        or copy the url below and paste on your browser.
    </p>
    <p>${url}</p>`
    return emailBody;
}

/*Fetch data from the database with a specified request parameter, the rate id of the data stored */
const getRate = async (req, res) => {
    try {
        const rate = await getById(req.params.rateId);
        if (rate) {
            return res.json(rate);
        } else {
            return res.status(404).json({
                success: false,
                message: "The rate you are trying to get does not exist"
            });
        }
    }
    catch (error) {
        handleCatch(error);
    }

}
// Saves rate in the database
const createRate = async (req, res) => {
    const arr = validate(req.body);
    if (arr.length > 0) {
        console.log(arr);
        return res.status(400).json({
            success: false,
            error: arr
        });
    }
    try {
        const id = Math.random().toString(20).substr(2, 15);
        const obj = await writeRate(req, res, id, saveToFireBase);
        return res.json(obj);
    }
    catch (error) {
        return handleCatch(req, res, error);
    }
}
// updates rate with specific rate id in the database
const updateRate = async (req, res) => {
    const arr = validate(req.body);
    if (arr.length > 0) {
        console.log(arr);
        return res.status(400).json({
            success: false,
            error: arr
        });
    }
    try {
        let response = await writeRate(req, res, req.params.rateId, updateOnFireBase);
        return res.json({ ...response, message: "The rate was successfully updated and details sent to your mail" });
    }
    catch (error) {
        return handleCatch(req, res, error);
    }
}
// deletes rate with specific rate id in the database
const deleteRate = async (req, res) => {
    try {
        const deletedRate = await deleteOnFirebase(req.params.rateId);
        return res.json({
            success: true,
            message: `The rate with the id ${req.params.rateId}, has been deleted`
        })
    }
    catch (error) {
        handleCatch(error);
    }


}
// exports middleware functions and others
module.exports = {
    createRate,
    getRate,
    updateRate,
    deleteRate
}