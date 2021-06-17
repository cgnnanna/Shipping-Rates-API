require("dotenv").config();
const fetch = require("node-fetch");
const sgMail = require('@sendgrid/mail');
const { response } = require("express");
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
    // res.json({
    //     success: true,
    //     data: response
    // });
    return response;

}

// const sendFare = async(req, res) =>{
//     try{
//     const getFare = await fetchFare(req.body.fare);
//     const url = "https://api.sendgrid.com/api/rates.get.json"
//     const body = {
//         emailAddress: req.body.emailAddress,
//         pickupAddress: req.body.pickupAdress,
//         deliveryAddress: req.body.deliveryAddress,
//         totalFare : getFare
//     }
//     let response = await fetch(url, {
//         method: "GET",
//         headers: {
//             "Content-Type": "application/json",
//             "Authorisation": "bearer <process.env.SENDGRID_API_KEY>"
//         },
//         body: body
//     });
//     console.log(response.json);
//     if(response.status!==200){
//         const error = await response.json();
//         console.error("Error response ", error);
//         throw Error(error.message)
//     }
//     response = await response.json();
//     console.log("Your requested shipment rate from Gokada", response);
//     res.json({
//         success: true,
//         data: response
//     });
// }
// catch (error) {
//     console.log(error.message);
//     res.status(400).json({
//         success: false,
//         message: error.message
//     });
// } 


// }
/*Sends a mail containing the fare details to the requester's email address */
const sendFare = async (req, res) => {
    try {
        let fareResponse = await fetchFare(req.body);
        const emailBody = `Here are your requested shipment details:
    Pickup address - ${req.body.pickupAddress}
    Delivery address - ${req.body.deliveryAddress}
    Fare - ${fareResponse.fare}`
        console.log(emailBody);
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = {
            to: `${req.body.recipientEmail}`,
            from: `${process.env.EMAIL}`,
            subject: "Your requested shipment rate from Gokada",
            text: emailBody
        };
        let response = await sgMail.send(msg);
        // console.log("Your requested shipment rate from Gokada", response);
        console.log(response);
        if (response[0].statusCode === 202){
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
module.exports = {
    sendFare
}