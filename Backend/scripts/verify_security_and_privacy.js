/* verify_security_and_privacy.js — Comprehensive local security, privacy & multi-item regression test suite */
require("dotenv").config();
const db = require("../config/db");
const chatModel = require("../models/chatModel");
const chatController = require("../controllers/chatController");
const productController = require("../controllers/productController");
const sellerController = require("../controllers/sellerController");

function mockReqRes(params = {}, query = {}, body = {}, headers = {}, userId = null, sellerId = null) {
    const req = { params, query, body, headers, userId, sellerId };
    const res = {
        statusCode: 200,
        headers: {},
        data: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.data = payload;
            return this;
        },
        setHeader(k, v) {
            this.headers[k] = v;
        }
    };
    return { req, res };
}

async function runVerificationSuite() {
    console.log("=================================================");
    console.log("🔒 RUNNING ADVANCED SECURITY, PRIVACY & MULTI-ITEM REGRESSION SUITE");
    console.log("=================================================\n");

    const results = [];

    function recordResult(testName, passed, details = "") {
        results.push({ testName, passed, details });
        const icon = passed ? "✅ [PASS]" : "❌ [FAIL]";
        console.log(`${icon} ${testName}`);
        if (details) console.log(`   └─ Details: ${details}`);
    }

    try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Setup Test Data in DB
        const [hostels] = await db.promise().query("SELECT id FROM hostels LIMIT 2");
        const hostelId1 = hostels[0] ? hostels[0].id : 1;
        const hostelId2 = hostels[1] ? hostels[1].id : hostelId1;

        const timeHex = Date.now().toString(16);
        const buyerAEmail = `buyerA_${timeHex}@amrita.edu`;
        const buyerBEmail = `buyerB_${timeHex}@amrita.edu`;
        const sellerAUserEmail = `sellerA_${timeHex}@amrita.edu`;
        const sellerBUserEmail = `sellerB_${timeHex}@amrita.edu`;

        await db.promise().query(
            `INSERT INTO users (name, email, password, role, hostel_id, room_number, year) VALUES
            ('Buyer A', ?, 'hash', 'buyer', ?, 'A-101', '1st Year'),
            ('Buyer B', ?, 'hash', 'buyer', ?, 'B-202', '2nd Year'),
            ('Seller A User', ?, 'hash', 'seller', ?, 'S-301', '3rd Year'),
            ('Seller B User', ?, 'hash', 'seller', ?, 'S-401', '4th Year')`,
            [buyerAEmail, hostelId1, buyerBEmail, hostelId2, sellerAUserEmail, hostelId1, sellerBUserEmail, hostelId2]
        );

        const [uBuyerA] = await db.promise().query("SELECT id FROM users WHERE email = ?", [buyerAEmail]);
        const [uBuyerB] = await db.promise().query("SELECT id FROM users WHERE email = ?", [buyerBEmail]);
        const [uSellerA] = await db.promise().query("SELECT id FROM users WHERE email = ?", [sellerAUserEmail]);
        const [uSellerB] = await db.promise().query("SELECT id FROM users WHERE email = ?", [sellerBUserEmail]);

        const buyerAId = uBuyerA[0].id;
        const buyerBId = uBuyerB[0].id;
        const sellerAUserId = uSellerA[0].id;
        const sellerBUserId = uSellerB[0].id;

        await db.promise().query(
            `INSERT INTO sellers (user_id, store_name, hostel_id, room_number, upi_id) VALUES
            (?, 'Seller A Store', ?, 'S-301', 'sellerA@upi'),
            (?, 'Seller B Store', ?, 'S-401', 'sellerB@upi')`,
            [sellerAUserId, hostelId1, sellerBUserId, hostelId2]
        );

        const [sA] = await db.promise().query("SELECT id FROM sellers WHERE user_id = ?", [sellerAUserId]);
        const [sB] = await db.promise().query("SELECT id FROM sellers WHERE user_id = ?", [sellerBUserId]);

        const sellerAId = sA[0].id;
        const sellerBId = sB[0].id;

        await db.promise().query(
            `INSERT INTO products (name, price, description, category, stock, seller_id, pickup_available, delivery_available, delivery_charge) VALUES
            ('Chips A', 100.00, 'Crispy chips', 'Snacks', 10, ?, 1, 1, 10.00),
            ('Soda A', 50.00, 'Cold soda', 'Drinks', 10, ?, 1, 1, 10.00),
            ('Candy B', 20.00, 'Sweet candy', 'Snacks', 5, ?, 1, 1, 5.00)`,
            [sellerAId, sellerAId, sellerBId]
        );

        const [prodA] = await db.promise().query("SELECT id, price FROM products WHERE name = 'Chips A' AND seller_id = ?", [sellerAId]);
        const [prodA2] = await db.promise().query("SELECT id, price FROM products WHERE name = 'Soda A' AND seller_id = ?", [sellerAId]);
        const [prodB] = await db.promise().query("SELECT id, price FROM products WHERE name = 'Candy B' AND seller_id = ?", [sellerBId]);

        const productIdA = prodA[0].id;
        const productIdA2 = prodA2[0].id;
        const productIdB = prodB[0].id;

        // Order 1: Multi-Item Delivery Order (Buyer A -> Seller A) (Chips A x 1 = 100, Soda A x 2 = 100 -> items_total = 200, delivery = 10 -> grand_total = 210)
        await db.promise().query(
            `INSERT INTO orders (checkout_id, buyer_id, seller_id, items_total, delivery_charge, grand_total, status, payment_status, fulfillment_type)
            VALUES ('CHK_TEST_1', ?, ?, 200.00, 10.00, 210.00, 'pending', 'pending', 'delivery')`,
            [buyerAId, sellerAId]
        );
        const [ord1] = await db.promise().query("SELECT LAST_INSERT_ID() as id");
        const order1Id = ord1[0].id;

        await db.promise().query(
            `INSERT INTO order_items (order_id, product_id, name, price, quantity) VALUES
            (?, ?, 'Chips A', 100.00, 1),
            (?, ?, 'Soda A', 50.00, 2)`,
            [order1Id, productIdA, order1Id, productIdA2]
        );

        const [oItems1] = await db.promise().query("SELECT id, name FROM order_items WHERE order_id = ?", [order1Id]);
        const order1Item1Id = oItems1.find(i => i.name === 'Chips A').id;
        const order1Item2Id = oItems1.find(i => i.name === 'Soda A').id;

        // Order 2: Pickup Order (Buyer A -> Seller B)
        await db.promise().query(
            `INSERT INTO orders (checkout_id, buyer_id, seller_id, items_total, delivery_charge, grand_total, status, payment_status, fulfillment_type)
            VALUES ('CHK_TEST_2', ?, ?, 20.00, 0.00, 20.00, 'pending', 'pending', 'pickup')`,
            [buyerAId, sellerBId]
        );
        const [ord2] = await db.promise().query("SELECT LAST_INSERT_ID() as id");
        const order2Id = ord2[0].id;

        await db.promise().query(
            `INSERT INTO order_items (order_id, product_id, name, price, quantity) VALUES (?, ?, 'Candy B', 20.00, 1)`,
            [order2Id, productIdB]
        );
        const [oItems2] = await db.promise().query("SELECT id FROM order_items WHERE order_id = ?", [order2Id]);
        const order2Item1Id = oItems2[0].id;

        // Order 3: Order with Submitted Payment
        await db.promise().query(
            `INSERT INTO orders (checkout_id, buyer_id, seller_id, items_total, delivery_charge, grand_total, status, payment_status, fulfillment_type)
            VALUES ('CHK_TEST_3', ?, ?, 100.00, 10.00, 110.00, 'pending', 'submitted', 'delivery')`,
            [buyerAId, sellerAId]
        );
        const [ord3] = await db.promise().query("SELECT LAST_INSERT_ID() as id");
        const order3Id = ord3[0].id;

        await db.promise().query(
            `INSERT INTO order_items (order_id, product_id, name, price, quantity) VALUES (?, ?, 'Chips A', 100.00, 1)`,
            [order3Id, productIdA]
        );
        const [oItems3] = await db.promise().query("SELECT id FROM order_items WHERE order_id = ?", [order3Id]);
        const order3Item1Id = oItems3[0].id;

        /* -------------------------------------------------------------
         * TEST PASSES
         * ------------------------------------------------------------- */

        // 1. Buyer A cannot access Buyer B order chat
        {
            const { req, res } = mockReqRes({ id: order1Id }, {}, {}, {}, buyerBId);
            chatController.getOrderMessages(req, res);
            setTimeout(() => {
                const passed = res.statusCode === 403 && res.data.success === false;
                recordResult("Buyer A cannot access Buyer B order chat", passed, `HTTP Status: ${res.statusCode}`);
            }, 100);
        }

        // 2. Seller B cannot access Seller A order chat
        {
            const { req, res } = mockReqRes({ id: order1Id }, {}, {}, {}, sellerBUserId);
            chatController.getOrderMessages(req, res);
            setTimeout(() => {
                const passed = res.statusCode === 403 && res.data.success === false;
                recordResult("Seller B cannot access Seller A order chat", passed, `HTTP Status: ${res.statusCode}`);
            }, 100);
        }

        // 3. Seller B attempts to create offer against Seller A order item -> 403
        {
            const { req, res } = mockReqRes({ id: order1Id }, {}, { order_item_id: order1Item1Id, offered_price: 80 }, {}, sellerBUserId);
            chatController.createOffer(req, res);
            setTimeout(() => {
                const passed = res.statusCode === 403 && res.data.success === false;
                recordResult("Seller B cannot create offer on Seller A order", passed, `HTTP Status: ${res.statusCode}`);
            }, 100);
        }

        // 4. Seller A attempts to create offer for order_item_id belonging to Order 2 -> 404/400
        {
            const { req, res } = mockReqRes({ id: order1Id }, {}, { order_item_id: order2Item1Id, offered_price: 80 }, {}, sellerAUserId);
            chatController.createOffer(req, res);
            setTimeout(() => {
                const passed = (res.statusCode === 404 || res.statusCode === 400) && res.data.success === false;
                recordResult("Wrong-item attack rejected when creating offer", passed, `Response: ${JSON.stringify(res.data)}`);
            }, 100);
        }

        // 5. Offer price validation (negative or non-numeric price) -> 400
        {
            const { req, res } = mockReqRes({ id: order1Id }, {}, { order_item_id: order1Item1Id, offered_price: -50 }, {}, sellerAUserId);
            chatController.createOffer(req, res);
            setTimeout(() => {
                const passed = res.statusCode === 400 && res.data.success === false;
                recordResult("Negative or invalid offer price rejected", passed, `Response: ${JSON.stringify(res.data)}`);
            }, 100);
        }

        // 6. Public APIs mask room numbers
        {
            const { req, res } = mockReqRes({}, { search: "Chips" });
            productController.getProducts(req, res);
            setTimeout(() => {
                const item = (res.data || [])[0];
                const passed = item && item.seller_room === undefined && item.room_number === undefined;
                recordResult("Public product list API masks seller room number", passed);
            }, 100);
        }

        // 7. Pickup order masks buyer room number
        {
            const { req, res } = mockReqRes({ id: order2Id }, {}, {}, {}, buyerAId);
            chatController.getOrderMessages(req, res);
            setTimeout(() => {
                const orderInfo = (res.data || {}).order || {};
                const passed = !orderInfo.buyer_location;
                recordResult("Pickup order masks buyer room number", passed);
            }, 100);
        }

        // 8. Cannot create offer after payment proof submitted
        {
            const { req, res } = mockReqRes({ id: order3Id }, {}, { order_item_id: order3Item1Id, offered_price: 80 }, {}, sellerAUserId);
            chatController.createOffer(req, res);
            setTimeout(() => {
                const passed = res.statusCode === 400 && res.data.success === false;
                recordResult("Cannot create offer after payment proof submitted", passed, `Response: ${JSON.stringify(res.data)}`);
            }, 100);
        }

        // 9. Item-Level Negotiation & Recalculation Test (Multi-Item Order)
        {
            // Seller A creates Offer 1 for Chips A (Item 1) -> ₹80 (Original ₹100)
            const [off1Res] = await db.promise().query(
                `INSERT INTO order_offers (order_id, order_item_id, seller_id, buyer_id, offered_price, original_price, status)
                VALUES (?, ?, ?, ?, 80.00, 100.00, 'pending')`,
                [order1Id, order1Item1Id, sellerAId, buyerAId]
            );
            const offer1Id = off1Res.insertId;

            // Seller A creates competing Offer 2 for Chips A (Item 1) -> ₹75
            const [off2Res] = await db.promise().query(
                `INSERT INTO order_offers (order_id, order_item_id, seller_id, buyer_id, offered_price, original_price, status)
                VALUES (?, ?, ?, ?, 75.00, 100.00, 'pending')`,
                [order1Id, order1Item1Id, sellerAId, buyerAId]
            );
            const offer2Id = off2Res.insertId;

            // Buyer B attempts to reject Buyer A's offer -> 403
            {
                const { req, res } = mockReqRes({ id: order1Id, offerId: offer2Id }, {}, {}, {}, buyerBId);
                chatController.rejectOffer(req, res);
                setTimeout(() => {
                    const passed = res.statusCode === 403;
                    recordResult("Wrong-buyer rejection blocked", passed, `HTTP Status: ${res.statusCode}`);
                }, 100);
            }

            // Buyer A attempts to reject Offer 2 via wrong Order 2 URL -> 404
            {
                const { req, res } = mockReqRes({ id: order2Id, offerId: offer2Id }, {}, {}, {}, buyerAId);
                chatController.rejectOffer(req, res);
                setTimeout(() => {
                    const passed = res.statusCode === 404;
                    recordResult("Wrong-order offer rejection blocked", passed, `HTTP Status: ${res.statusCode}`);
                }, 100);
            }

            // Buyer A accepts Offer 2 (Chips A @ ₹75)
            setTimeout(() => {
                const { req, res } = mockReqRes({ id: order1Id, offerId: offer2Id }, {}, {}, {}, buyerAId);
                chatController.acceptOffer(req, res);

                setTimeout(async () => {
                    const [ordAfter] = await db.promise().query("SELECT items_total, grand_total FROM orders WHERE id = ?", [order1Id]);
                    const [item1After] = await db.promise().query("SELECT price FROM order_items WHERE id = ?", [order1Item1Id]);
                    const [item2After] = await db.promise().query("SELECT price FROM order_items WHERE id = ?", [order1Item2Id]);
                    const [off1After] = await db.promise().query("SELECT status FROM order_offers WHERE id = ?", [offer1Id]);
                    const [off2After] = await db.promise().query("SELECT status FROM order_offers WHERE id = ?", [offer2Id]);
                    const [prodAfter] = await db.promise().query("SELECT price FROM products WHERE id = ?", [productIdA]);

                    // Expected calculation:
                    // Chips A (Item 1): 1 x ₹75 = ₹75
                    // Soda A (Item 2): 2 x ₹50 = ₹100
                    // New items_total = ₹175
                    // Delivery charge = ₹10
                    // New grand_total = ₹185
                    const item1Updated = parseFloat(item1After[0].price) === 75.00;
                    const item2Unchanged = parseFloat(item2After[0].price) === 50.00;
                    const itemsTotalCorrect = parseFloat(ordAfter[0].items_total) === 175.00;
                    const grandTotalCorrect = parseFloat(ordAfter[0].grand_total) === 185.00;
                    const off2Accepted = off2After[0].status === "accepted";
                    const off1Rejected = off1After[0].status === "rejected";
                    const publicProductUnchanged = parseFloat(prodAfter[0].price) === 100.00;

                    const passed = item1Updated && item2Unchanged && itemsTotalCorrect && grandTotalCorrect && off2Accepted && off1Rejected && publicProductUnchanged;

                    recordResult(
                        "Multi-item offer acceptance updates ONLY targeted item unit price, correctly recalculates order items_total & grand_total, rejects competing item offer, and leaves public product price immutable",
                        passed,
                        `Item 1 Price: ₹${item1After[0].price}, Item 2 Price: ₹${item2After[0].price}, Items Total: ₹${ordAfter[0].items_total}, Grand Total: ₹${ordAfter[0].grand_total}, Offer 2: ${off2After[0].status}, Offer 1: ${off1After[0].status}, Public Catalog Price: ₹${prodAfter[0].price}`
                    );
                }, 300);
            }, 300);
        }

        // Cleanup test data after 1.5 seconds
        setTimeout(async () => {
            await db.promise().query("DELETE FROM order_offers WHERE buyer_id IN (?, ?)", [buyerAId, buyerBId]);
            await db.promise().query("DELETE FROM order_messages WHERE order_id IN (?, ?, ?)", [order1Id, order2Id, order3Id]);
            await db.promise().query("DELETE FROM order_items WHERE order_id IN (?, ?, ?)", [order1Id, order2Id, order3Id]);
            await db.promise().query("DELETE FROM orders WHERE buyer_id IN (?, ?)", [buyerAId, buyerBId]);
            await db.promise().query("DELETE FROM products WHERE seller_id IN (?, ?)", [sellerAId, sellerBId]);
            await db.promise().query("DELETE FROM sellers WHERE id IN (?, ?)", [sellerAId, sellerBId]);
            await db.promise().query("DELETE FROM users WHERE id IN (?, ?, ?, ?)", [buyerAId, buyerBId, sellerAUserId, sellerBUserId]);

            console.log("\n=================================================");
            console.log("🎯 VERIFICATION SUITE COMPLETE");
            console.log("=================================================\n");
            process.exit(0);
        }, 1800);

    } catch (err) {
        console.error("Verification suite error:", err);
        process.exit(1);
    }
}

runVerificationSuite();
