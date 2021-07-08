const express = require("express");

const {sendFare, getRates, updateRates, deleteRates} = require("../controller/rateController");

const router = express.Router();

router.post("/", sendFare);
router.get("/:rateId", getRates);
router.put("/:rateId", updateRates);
router.delete("/:rateId", deleteRates);



module.exports = router;