const express = require("express");

const {sendFare, getRates} = require("../controller/rateController");

const router = express.Router();

router.post("/", sendFare);
router.get("/:rateId", getRates);



module.exports = router;