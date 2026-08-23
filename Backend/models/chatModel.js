const db = require("../config/db");

function getOrderDetailsForChat(orderId, callback) {
    const query = `
        SELECT o.id, o.user_id AS buyer_id, o.seller_id, s.user_id AS seller_user_id
        FROM orders o
        LEFT JOIN sellers s ON o.seller_id = s.id
        WHERE o.id = ?
    `;
    db.query(query, [orderId], (err, result) => {
        if (err) callback(err, null);
        else callback(null, result);
    });
}

function getMessagesByOrderId(orderId, callback) {
    const query = `
        SELECT om.*, u.name AS sender_name, u.role AS sender_role
        FROM order_messages om
        LEFT JOIN users u ON om.sender_id = u.id
        WHERE om.order_id = ?
        ORDER BY om.id ASC
    `;
    db.query(query, [orderId], (err, result) => {
        if (err) callback(err, null);
        else callback(null, result);
    });
}

function addOrderMessage(orderId, senderId, message, callback) {
    const query = `
        INSERT INTO order_messages (order_id, sender_id, message)
        VALUES (?, ?, ?)
    `;
    db.query(query, [orderId, senderId, message], (err, result) => {
        if (err) callback(err, null);
        else callback(null, result);
    });
}

module.exports = {
    getOrderDetailsForChat,
    getMessagesByOrderId,
    addOrderMessage
};
