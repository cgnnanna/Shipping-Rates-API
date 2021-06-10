const express = require('express');
const rateRoutes = require("./routes/rateRoutes");
const app = express();

app.use(express.json());
app.use("/rates", rateRoutes);

app.listen(2000, ()=>{console.log("Server started on port 2000");})

