const express = require("express");

const {createRate, getRate, updateRate, deleteRate} = require("../controller/rateController");

const router = express.Router();

router.post("/", createRate);
router.get("/:rateId", getRate);
router.put("/:rateId", updateRate);
router.delete("/:rateId", deleteRate);



module.exports = router;