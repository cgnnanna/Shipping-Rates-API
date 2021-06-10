const express = require("express");

const {fetchFare} = require("../controller/rateController");

const router = express.Router();

router.post("/", fetchFare);



module.exports = router;