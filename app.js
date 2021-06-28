//var admin = require('firebase-admin');
const express = require('express');
const rateRoutes = require("./routes/rateRoutes");
const initDb = require('./config/firebaseConfig');
const app = express();

app.use(express.json());
app.use("/rates", rateRoutes);

app.use((req, res) => {  
    res.status(404).json({
         message: "The route that you want to access does not exist"
       });
})

initDb();


// app.listen(2000, ()=>{console.log("Server started on port 2000");})
// initDb();
let port = process.env.PORT || 8000;
app.listen(port, () => { console.log(`Server started on port ${port}`); })


