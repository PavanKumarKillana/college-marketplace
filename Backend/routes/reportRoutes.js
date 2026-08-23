const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const reportController = require("../controllers/reportController");
const router = express.Router();

router.post("/", verifyToken, reportController.submitReport);

module.exports = router;
