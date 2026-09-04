const db = require("../config/db");

function getOrderDetailsForChat(orderId, callback) {
    const query = `
        SELECT o.id, o.buyer_id, o.seller_id, s.user_id AS seller_user_id,
               o.fulfillment_type, o.status AS order_status, o.payment_status,
               o.grand_total, o.items_total, o.delivery_charge,
               s.store_name,
               bu.name AS buyer_name, bu.year AS buyer_year, bu.email AS buyer_email,
               bh.name AS buyer_hostel_name, bu.room_number AS buyer_room,
               sh.name AS seller_hostel_name, s.room_number AS seller_room,
               su.email AS seller_email
        FROM orders o
        LEFT JOIN sellers s ON o.seller_id = s.id
        LEFT JOIN users bu ON o.buyer_id = bu.id
        LEFT JOIN users su ON s.user_id = su.id
        LEFT JOIN hostels bh ON bu.hostel_id = bh.id
        LEFT JOIN hostels sh ON s.hostel_id = sh.id
        WHERE o.id = ?
    `;
    db.query(query, [orderId], (err, result) => {
        if (err) callback(err, null);
        else callback(null, result);
    });
}

function getOrderItemsForChat(orderId, callback) {
    const query = `
        SELECT id, order_id, product_id, name, price, quantity
        FROM order_items
        WHERE order_id = ?
    `;
    db.query(query, [orderId], (err, result) => {
        if (err) callback(err, null);
        else callback(null, result);
    });
}

function getOrderItemById(orderItemId, orderId, callback) {
    const query = `SELECT * FROM order_items WHERE id = ? AND order_id = ?`;
    db.query(query, [orderItemId, orderId], (err, result) => {
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

function createOffer(orderId, orderItemId, sellerId, buyerId, offeredPrice, originalPrice, message, callback) {
    const query = `
        INSERT INTO order_offers (order_id, order_item_id, seller_id, buyer_id, offered_price, original_price, message, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `;
    db.query(query, [orderId, orderItemId, sellerId, buyerId, offeredPrice, originalPrice, message || null], (err, result) => {
        if (err) callback(err, null);
        else callback(null, result);
    });
}

function getOffersByOrderId(orderId, callback) {
    const query = `
        SELECT oo.*, oi.name AS item_name
        FROM order_offers oo
        LEFT JOIN order_items oi ON oo.order_item_id = oi.id
        WHERE oo.order_id = ?
        ORDER BY oo.id DESC
    `;
    db.query(query, [orderId], (err, result) => {
        if (err) callback(err, null);
        else callback(null, result);
    });
}

function getPendingOfferForBuyer(offerId, orderId, buyerId, callback) {
    const query = `
        SELECT * FROM order_offers
        WHERE id = ? AND order_id = ? AND buyer_id = ? AND status = 'pending'
    `;
    db.query(query, [offerId, orderId, buyerId], (err, result) => {
        if (err) callback(err, null);
        else callback(null, result);
    });
}

function rejectOfferVerified(offerId, orderId, buyerId, callback) {
    const query = `
        UPDATE order_offers
        SET status = 'rejected'
        WHERE id = ? AND order_id = ? AND buyer_id = ? AND status = 'pending'
    `;
    db.query(query, [offerId, orderId, buyerId], (err, result) => {
        if (err) callback(err, null);
        else callback(null, result);
    });
}

// Atomic Transactional Offer Acceptance
function acceptOfferAtomic(orderId, offerId, buyerId, callback) {
    db.beginTransaction((txErr) => {
        if (txErr) return callback(txErr, null);

        // 1. Fetch & verify offer
        db.query(
            `SELECT * FROM order_offers WHERE id = ? AND order_id = ? AND buyer_id = ? AND status = 'pending'`,
            [offerId, orderId, buyerId],
            (offErr, offers) => {
                if (offErr || !offers || offers.length === 0) {
                    return db.rollback(() => callback(new Error("Pending offer not found or unauthorized buyer.")));
                }

                const offer = offers[0];

                // 2. Fetch & verify order status
                db.query(`SELECT * FROM orders WHERE id = ? AND buyer_id = ?`, [orderId, buyerId], (ordErr, orders) => {
                    if (ordErr || !orders || orders.length === 0) {
                        return db.rollback(() => callback(new Error("Order not found or unauthorized buyer.")));
                    }

                    const order = orders[0];
                    if (order.status === "completed" || order.status === "cancelled") {
                        return db.rollback(() => callback(new Error("Order is finalized. Cannot accept offers.")));
                    }
                    if (order.payment_status === "submitted" || order.payment_status === "verified") {
                        return db.rollback(() => callback(new Error("Payment already submitted or verified. Offer locked.")));
                    }

                    // 3. Fetch & verify order item
                    db.query(`SELECT * FROM order_items WHERE id = ? AND order_id = ?`, [offer.order_item_id, orderId], (itemErr, items) => {
                        if (itemErr || !items || items.length === 0) {
                            return db.rollback(() => callback(new Error("Order item not found for this order.")));
                        }

                        const orderItem = items[0];
                        const newUnitPrice = parseFloat(offer.offered_price);

                        // 4. Mark target offer accepted
                        db.query(`UPDATE order_offers SET status = 'accepted' WHERE id = ?`, [offerId], (uOffErr) => {
                            if (uOffErr) return db.rollback(() => callback(uOffErr));

                            // 5. Reject competing pending offers for the SAME item
                            db.query(
                                `UPDATE order_offers SET status = 'rejected' WHERE order_item_id = ? AND id != ? AND status = 'pending'`,
                                [offer.order_item_id, offerId],
                                (uOtherErr) => {
                                    if (uOtherErr) return db.rollback(() => callback(uOtherErr));

                                    // 6. Update ONLY the target order item price
                                    db.query(
                                        `UPDATE order_items SET price = ? WHERE id = ? AND order_id = ?`,
                                        [newUnitPrice, offer.order_item_id, orderId],
                                        (uItemErr) => {
                                            if (uItemErr) return db.rollback(() => callback(uItemErr));

                                            // 7. Recalculate order items_total from ALL order_items
                                            db.query(
                                                `SELECT SUM(price * quantity) AS new_items_total FROM order_items WHERE order_id = ?`,
                                                [orderId],
                                                (sumErr, sumRes) => {
                                                    if (sumErr || !sumRes || sumRes[0].new_items_total === null) {
                                                        return db.rollback(() => callback(sumErr || new Error("Failed to calculate items total.")));
                                                    }

                                                    const newItemsTotal = parseFloat(sumRes[0].new_items_total);
                                                    const deliveryCharge = parseFloat(order.delivery_charge);
                                                    const newGrandTotal = newItemsTotal + deliveryCharge;

                                                    // 8. Update orders items_total & grand_total
                                                    db.query(
                                                        `UPDATE orders SET items_total = ?, grand_total = ? WHERE id = ?`,
                                                        [newItemsTotal, newGrandTotal, orderId],
                                                        (uOrdErr) => {
                                                            if (uOrdErr) return db.rollback(() => callback(uOrdErr));

                                                            db.commit((cErr) => {
                                                                if (cErr) return db.rollback(() => callback(cErr));
                                                                callback(null, {
                                                                    itemName: orderItem.name,
                                                                    newUnitPrice: newUnitPrice,
                                                                    newItemsTotal: newItemsTotal,
                                                                    newGrandTotal: newGrandTotal,
                                                                    deliveryCharge: deliveryCharge
                                                                });
                                                            });
                                                        }
                                                    );
                                                }
                                            );
                                        }
                                    );
                                }
                            );
                        });
                    });
                });
            });
    });
}

module.exports = {
    getOrderDetailsForChat,
    getOrderItemsForChat,
    getOrderItemById,
    getMessagesByOrderId,
    addOrderMessage,
    createOffer,
    getOffersByOrderId,
    getPendingOfferForBuyer,
    rejectOfferVerified,
    acceptOfferAtomic
};
