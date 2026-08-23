const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const chatController = require("../controllers/chatController");
const router = express.Router();

router.get("/:id/messages", verifyToken, chatController.getOrderMessages);
router.post("/:id/messages", verifyToken, chatController.postOrderMessage);

module.exports = router;
