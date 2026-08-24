const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const chatController = require("../controllers/chatController");
const router = express.Router();

router.get("/:id/messages", verifyToken, chatController.getOrderMessages);
router.post("/:id/messages", verifyToken, chatController.postOrderMessage);

router.post("/:id/offers", verifyToken, chatController.createOffer);
router.put("/:id/offers/:offerId/accept", verifyToken, chatController.acceptOffer);
router.put("/:id/offers/:offerId/reject", verifyToken, chatController.rejectOffer);

module.exports = router;
