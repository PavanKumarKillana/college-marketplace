const chatModel = require("../models/chatModel");

function verifyChatAccess(orderId, userId, callback) {
    if (!userId) {
        return callback(null, false, null, false, false, false);
    }

    chatModel.getOrderDetailsForChat(orderId, (err, rows) => {
        if (err || !rows || rows.length === 0) {
            return callback(err, false, null, false, false, false);
        }

        const order = rows[0];
        const isBuyer = order.buyer_id === userId;
        const isSeller = order.seller_user_id === userId;
        const isAdmin = false; // Add admin check if req user role is admin

        if (isBuyer || isSeller || isAdmin) {
            return callback(null, true, order, isBuyer, isSeller, isAdmin);
        } else {
            return callback(null, false, order, false, false, false);
        }
    });
}

function getOrderMessages(req, res) {
    const orderId = req.params.id;
    const userId = req.userId;

    verifyChatAccess(orderId, userId, (err, canAccess, order, isBuyer, isSeller, isAdmin) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Database error" });
        }
        if (!canAccess || !order) {
            return res.status(403).json({ success: false, message: "You are not authorized to view this order chat." });
        }

        chatModel.getOrderItemsForChat(orderId, (itemErr, items) => {
            if (itemErr) {
                return res.status(500).json({ success: false, message: "Failed to load order items." });
            }

            chatModel.getMessagesByOrderId(orderId, (msgErr, messages) => {
                if (msgErr) {
                    return res.status(500).json({ success: false, message: "Failed to load chat messages." });
                }

                chatModel.getOffersByOrderId(orderId, (offErr, offers) => {
                    if (offErr) {
                        return res.status(500).json({ success: false, message: "Failed to load offers." });
                    }

                    // Mask sensitive location data based on fulfillment type and role
                    let sellerLocation = null;
                    let buyerLocation = null;

                    if (order.fulfillment_type === "delivery") {
                        if (isSeller || isAdmin) {
                            buyerLocation = {
                                year: order.buyer_year,
                                hostel_name: order.buyer_hostel_name,
                                room_number: order.buyer_room
                            };
                        }
                        sellerLocation = {
                            hostel_name: order.seller_hostel_name
                        };
                    } else if (order.fulfillment_type === "pickup") {
                        sellerLocation = {
                            hostel_name: order.seller_hostel_name,
                            room_number: order.seller_room
                        };
                    }

                    const isReadOnly = order.order_status === "completed" || order.order_status === "cancelled";

                    res.json({
                        success: true,
                        is_buyer: isBuyer,
                        is_seller: isSeller,
                        order: {
                            id: order.id,
                            fulfillment_type: order.fulfillment_type,
                            status: order.order_status,
                            payment_status: order.payment_status,
                            items_total: order.items_total,
                            delivery_charge: order.delivery_charge,
                            grand_total: order.grand_total,
                            store_name: order.store_name,
                            seller_location: sellerLocation,
                            buyer_location: buyerLocation
                        },
                        items: items || [],
                        is_read_only: isReadOnly,
                        messages: messages || [],
                        offers: offers || []
                    });
                });
            });
        });
    });
}

function postOrderMessage(req, res) {
    const orderId = req.params.id;
    const userId = req.userId;
    const message = (req.body.message || "").trim();

    if (!message) {
        return res.status(400).json({ success: false, message: "Message content cannot be empty." });
    }

    verifyChatAccess(orderId, userId, (err, canAccess, order) => {
        if (!canAccess || !order) {
            return res.status(403).json({ success: false, message: "You are not authorized to message in this order." });
        }

        if (order.order_status === "completed" || order.order_status === "cancelled") {
            return res.status(400).json({ success: false, message: "This order is finalized. Chat is read-only." });
        }

        chatModel.addOrderMessage(orderId, userId, message, (msgErr, result) => {
            if (msgErr) {
                return res.status(500).json({ success: false, message: "Failed to send message." });
            }
            res.json({ success: true, message: "Message sent successfully." });
        });
    });
}

function createOffer(req, res) {
    const orderId = parseInt(req.params.id);
    const orderItemId = parseInt(req.body.order_item_id);
    const userId = req.userId;
    const offeredPrice = parseFloat(req.body.offered_price);
    const message = (req.body.message || "").trim();

    // 1. Strict server-side price validation
    if (typeof offeredPrice !== "number" || isNaN(offeredPrice) || !isFinite(offeredPrice) || offeredPrice <= 0 || offeredPrice > 100000) {
        return res.status(400).json({ success: false, message: "Please enter a valid numeric price offer." });
    }

    if (isNaN(orderItemId) || orderItemId <= 0) {
        return res.status(400).json({ success: false, message: "Please select an order item to negotiate." });
    }

    verifyChatAccess(orderId, userId, (err, canAccess, order, isBuyer, isSeller) => {
        if (!canAccess || !order) {
            return res.status(403).json({ success: false, message: "You are not authorized to negotiate for this order." });
        }

        if (!isSeller) {
            return res.status(403).json({ success: false, message: "Only the seller can create custom price offers." });
        }

        if (order.order_status === "completed" || order.order_status === "cancelled") {
            return res.status(400).json({ success: false, message: "Cannot negotiate a finalized order." });
        }

        if (order.payment_status === "submitted" || order.payment_status === "verified") {
            return res.status(400).json({ success: false, message: "Cannot negotiate after payment has been submitted or verified." });
        }

        // 2. Validate order_item_id belongs to orderId
        chatModel.getOrderItemById(orderItemId, orderId, (itemErr, items) => {
            if (itemErr || !items || items.length === 0) {
                return res.status(404).json({ success: false, message: "The specified item does not belong to this order." });
            }

            const item = items[0];
            const originalPrice = parseFloat(item.price);

            chatModel.createOffer(orderId, orderItemId, order.seller_id, order.buyer_id, offeredPrice, originalPrice, message, (offErr, result) => {
                if (offErr) {
                    return res.status(500).json({ success: false, message: "Failed to create offer." });
                }

                const offerMsg = `🏷️ SPECIAL OFFER: Seller offered new price ₹${offeredPrice} for "${item.name}" (Original: ₹${originalPrice})${message ? ` - "${message}"` : ""}`;
                chatModel.addOrderMessage(orderId, userId, offerMsg, () => {
                    res.json({ success: true, message: "Offer created successfully!" });
                });
            });
        });
    });
}

function acceptOffer(req, res) {
    const orderId = parseInt(req.params.id);
    const offerId = parseInt(req.params.offerId);
    const userId = req.userId;

    verifyChatAccess(orderId, userId, (err, canAccess, order, isBuyer) => {
        if (!canAccess || !order) {
            return res.status(403).json({ success: false, message: "You are not authorized." });
        }

        if (!isBuyer) {
            return res.status(403).json({ success: false, message: "Only the buyer can accept this offer." });
        }

        chatModel.acceptOfferAtomic(orderId, offerId, userId, (acceptErr, result) => {
            if (acceptErr) {
                return res.status(400).json({ success: false, message: acceptErr.message || "Failed to accept offer." });
            }

            const acceptMsg = `✅ OFFER ACCEPTED: Agreed unit price ₹${result.newUnitPrice} for "${result.itemName}". New items total: ₹${result.newItemsTotal}, Grand Total: ₹${result.newGrandTotal}`;
            chatModel.addOrderMessage(orderId, userId, acceptMsg, () => {
                res.json({ success: true, message: "Offer accepted! Order price updated." });
            });
        });
    });
}

function rejectOffer(req, res) {
    const orderId = parseInt(req.params.id);
    const offerId = parseInt(req.params.offerId);
    const userId = req.userId;

    verifyChatAccess(orderId, userId, (err, canAccess, order, isBuyer) => {
        if (!canAccess || !order) {
            return res.status(403).json({ success: false, message: "You are not authorized." });
        }

        if (!isBuyer) {
            return res.status(403).json({ success: false, message: "Only the buyer can reject this offer." });
        }

        chatModel.rejectOfferVerified(offerId, orderId, userId, (uErr, result) => {
            if (uErr || !result || result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: "Pending offer not found or unauthorized." });
            }

            const rejectMsg = `❌ OFFER REJECTED: Buyer declined the price offer.`;
            chatModel.addOrderMessage(orderId, userId, rejectMsg, () => {
                res.json({ success: true, message: "Offer rejected." });
            });
        });
    });
}

module.exports = {
    getOrderMessages,
    postOrderMessage,
    createOffer,
    acceptOffer,
    rejectOffer
};
