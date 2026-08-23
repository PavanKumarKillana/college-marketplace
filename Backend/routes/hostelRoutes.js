const express = require("express");
const hostelController = require("../controllers/hostelController");
const router = express.Router();

router.get("/", hostelController.getPublicHostels);

module.exports = router;
