require("dotenv").config();
const fetch = require("node-fetch");
/*
retrieves the geographic coordinates for human addresses
*/
const getGeolocation = async (address) => {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.GOOGLE_API_KEY}`;
    const response = await fetch(url);
    return await response.json();
}
/*
retrieves the amount for a pick-up and delivery services from gokada logistics
*/
const fetchFare = async (req, res) => {
    console.log(req.body);
    const deliveryAddress = await getGeolocation(req.body.deliveryAddress);
    const pickupAddress = await getGeolocation(req.body.pickupAddress);
    const delivery = deliveryAddress.results[0].geometry.location;
    const pickup = pickupAddress.results[0].geometry.location;
    fetch("https://private-10941a-gokada2.apiary-mock.com/api/developer/order_estimate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: {
            api_key: process.env.GOKADA_API_KEY,
            pickup_latitude: pickup.lat.toString(),
            pickup_longitude: pickup.lng.toString(),
            delivery_latitude: delivery.lat.toString(),
            delivery_longitude: delivery.lng.toString()
        }
    })
    .then(response=>{
        return response.json();
    })
    .then(body=>{
        return res.json({
            success: true,
            data: body
        });
    })
    .catch(err=>{
        console.log(err.message);
        res.status(400).json({
            success: false,
            message: err.message
        })
    });

}


module.exports = {
    fetchFare
}