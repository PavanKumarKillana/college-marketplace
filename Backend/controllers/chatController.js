const chatModel = require("../models/chatModel");
const userModel = require("../models/userModel");

function verifyChatAccess(orderId, userId, callback) {
    userModel.getUserById(userId, (uErr, users) => {
        if (uErr || users.length === 0) {
            return callback(null, false);
        }
        const user = users[0];
        if (user.role === "admin") {
            return callback(null, true);
        }

        chatModel.getOrderDetailsForChat(orderId, (oErr, orders) => {
            if (oErr || orders.length === 0) {
                return callback(null, false);
            }
            const order = orders[0];
            const isAuthorized = order.buyer_id === userId || order.seller_user_id === userId;
            callback(null, isAuthorized);
        });
    });
}

function getOrderMessages(req, res) {
    const orderId = req.params.id;
    const userId = req.userId;

    verifyChatAccess(orderId, userId, (err, canAccess) => {
        if (!canAccess) {
            return res.json({ success: false, message: "You are not authorized to view messages for this order." });
        }

        chatModel.getMessagesByOrderId(orderId, (mErr, messages) => {
            if (mErr) res.json({ success: false, message: "Could not retrieve messages." });
            else res.json(messages);
        });
    });
}

function postOrderMessage(req, res) {
    const orderId = req.params.id;
    const userId = req.userId;
    const message = (req.body.message || "").trim();

    if (!message) {
        return res.json({ success: false, message: "Message text cannot be empty." });
    }

    verifyChatAccess(orderId, userId, (err, canAccess) => {
        if (!canAccess) {
            return res.json({ success: false, message: "You are not authorized to post messages for this order." });
        }

        chatModel.addOrderMessage(orderId, userId, message, (insErr) => {
            if (insErr) res.json({ success: false, message: "Failed to send message." });
            else res.json({ success: true, message: "Message sent!" });
        });
    });
}

module.exports = {
    getOrderMessages,
    postOrderMessage
};
