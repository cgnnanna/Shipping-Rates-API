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
    try {
        console.log("fetching fare for...", req.body);
        const deliveryAddress = await getGeolocation(req.body.deliveryAddress);
        const pickupAddress = await getGeolocation(req.body.pickupAddress);
        const delivery = deliveryAddress.results[0].geometry.location;
        const pickup = pickupAddress.results[0].geometry.location;
        const url = process.env.GOKADA_API_MOCK;
        const body = {
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
            body: body
        });
        if(response.status!==200){
            const error = await response.json();
            console.error("Error response ", error);
            throw Error(error.message)
        }
        response = await response.json();
        console.log("Response from HTTP request", response);
        res.json({
            success: true,
            data: response
        });
    }
    catch (error) {
        console.log(error.message);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
    // .then(response=>{
    //     if(response.status!==200){
    //         console.log(response.json());
    //         throw Error(response.json())
    //     }
    //     return response.json();
    // })
    // .then(body=>{
    //     return res.json({
    //         success: true,
    //         data: body
    //     });
    // })
    // .catch(err=>{
    //     console.log(err.message);
    //     res.status(400).json({
    //         success: false,
    //         message: err.message
    //     });
    // });

}


module.exports = {
    fetchFare
}