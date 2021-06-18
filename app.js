const express = require('express');
const rateRoutes = require("./routes/rateRoutes");
const app = express();

app.use(express.json());
app.use("/rates", rateRoutes);

app.use((req, res) => {  
    res.status(404).json({
         message: "The route that you want to access does not exist"
       });
})


// app.listen(2000, ()=>{console.log("Server started on port 2000");})

let port = process.env.PORT || 8000;
app.listen(port, () => { console.log(`Server started on port ${port}`); })


