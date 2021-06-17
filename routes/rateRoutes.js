const express = require("express");

const {sendFare} = require("../controller/rateController");

const router = express.Router();

router.post("/", sendFare);



module.exports = router;