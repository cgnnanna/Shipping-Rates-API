require("dotenv").config();
const fetch = require("node-fetch");
const sgMail = require("@sendgrid/mail");
const { saveRate, getRate } = require("./../db/firebaseDb");
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
const fetchFare = async (body) => {
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



/*Sends a mail containing the fare details to the requester's email address */

const sendFare = async (req, res) => {
    try {
        let errorMessage = "";
        if (!req.body.pickupAddress) {
            errorMessage = "Pickup Address must be provided";
            console.log(errorMessage);
            throw Error(errorMessage);
        }
        if (!req.body.deliveryAddress) {
            errorMessage = "Delivery Address must be provided"
            throw Error(errorMessage);
        }
    }
    catch (errorMessage) {
        res.status(404).json({
            success: false,
            message: "you excluded an important detail"
        });
        return;
    }

    try {

        const id = Math.random().toString(20).substr(2, 15)
        let fareResponse = await fetchFare(req.body);
        const emailBody = `Here are your requested shipment details:
    Pickup address - ${req.body.pickupAddress}
    Delivery address - ${req.body.deliveryAddress}
    Fare - # ${fareResponse.fare}
    websiteAddress - ${process.env.HEROKU_URL}/${id}`
        console.log(emailBody);
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = {
            to: `${req.body.recipientEmail}`,
            from: `${process.env.EMAIL}`,
            subject: "Your requested shipment rate from Gokada",
            text: emailBody
        };
        const data = {
            ...fareResponse,
            email: req.body.recipientEmail,
            pickupAddress: req.body.pickupAddress,
            deliveryAddress: req.body.deliveryAddress,
            createdAt: Date.now()
        }
        /* Saves data in the database*/
        await saveRate(id, data);
        let response = await sgMail.send(msg);
        // console.log("Your requested shipment rate from Gokada", response);
        console.log(response);
        if (response[0].statusCode === 202) {
            res.json({
                success: true,
                // data: response,
                message: "Your requested shipment rate from Gokada has been forwarded to your email"
            });
        }
    }
    catch (error) {
        console.error(error);

        if (error.response) {
            res.status(400).json({
                success: false,
                message: error.message,
                data: error.response.body
            });
            return;
        }
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}
/*Fetch data from the database with a specified request parameter, the rate id of the data stored */
const getRates = async (req, res) => {
    try {
        const rate = await getRate(req.params.rateId);
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
        console.log(error);
        return res.status(400).json({
            success: false,
            message: "An error occured while trying to fetch the rate"
        });
    }

}
module.exports = {
    sendFare,
    getRates
}