const db=require("../config/db")

function createOrder(data,callback){
    db.query(
        `INSERT INTO orders
        (checkout_id, buyer_id, seller_id, fulfillment_type, buyer_room_number, items_total, delivery_charge, grand_total, status, payment_status)
        VALUES (?,?,?,?,?,?,?,?, 'pending', 'pending')`,
        [
            data.checkout_id,
            data.buyer_id,
            data.seller_id,
            data.fulfillment_type,
            data.buyer_room_number,
            data.items_total,
            data.delivery_charge,
            data.grand_total
        ],
        (err,result)=>{
            if(err){
                callback(err,null)
            }
            else{
                callback(null,result)
            }
        }
    )
}

function addOrderItem(orderId,item,callback){
    db.query(
        "INSERT INTO order_items (order_id, product_id, name, price, quantity) VALUES (?,?,?,?,?)",
        [orderId,item.product_id,item.name,item.price,item.quantity],
        (err,result)=>{
            if(err){
                callback(err,null)
            }
            else{
                callback(null,result)
            }
        }
    )
}

function getOrdersByBuyer(buyerId,callback){
    const query=`
        SELECT orders.*, sellers.store_name, sellers.room_number AS seller_room,
            sellers.upi_id, sellers.upi_qr_url
        FROM orders
        JOIN sellers ON orders.seller_id = sellers.id
        WHERE orders.buyer_id=?
        ORDER BY orders.id DESC
    `
    db.query(query,[buyerId],(err,result)=>{
        if(err){
            callback(err,null)
        }
        else{
            callback(null,result)
        }
    })
}

function getOrdersBySeller(sellerId,callback){
    const query=`
        SELECT orders.*, users.name AS buyer_name, users.email AS buyer_email
        FROM orders
        JOIN users ON orders.buyer_id = users.id
        WHERE orders.seller_id=?
        ORDER BY orders.id DESC
    `
    db.query(query,[sellerId],(err,result)=>{
        if(err){
            callback(err,null)
        }
        else{
            callback(null,result)
        }
    })
}

function getOrderById(id,callback){
    db.query("SELECT * FROM orders WHERE id=?",[id],(err,result)=>{
        if(err){
            callback(err,null)
        }
        else{
            callback(null,result)
        }
    })
}

function getOrderItems(orderId,callback){
    db.query("SELECT * FROM order_items WHERE order_id=?",[orderId],(err,result)=>{
        if(err){
            callback(err,null)
        }
        else{
            callback(null,result)
        }
    })
}

function getAllOrders(callback){
    const query=`
        SELECT orders.*, sellers.store_name, users.email AS buyer_email
        FROM orders
        JOIN sellers ON orders.seller_id = sellers.id
        JOIN users ON orders.buyer_id = users.id
        ORDER BY orders.id DESC
    `
    db.query(query,(err,result)=>{
        if(err){
            callback(err,null)
        }
        else{
            callback(null,result)
        }
    })
}

function markPaid(orderId,buyerId,utr,screenshotUrl,callback){
    db.query(
        `UPDATE orders SET payment_status='submitted', payment_utr=?, payment_screenshot_url=?
         WHERE id=? AND buyer_id=? AND payment_status IN ('pending','rejected')`,
        [utr,screenshotUrl,orderId,buyerId],
        (err,result)=>{
            if(err){
                callback(err,null)
            }
            else{
                callback(null,result)
            }
        }
    )
}

function verifyPayment(orderId,sellerId,callback){
    db.query(
        `UPDATE orders SET payment_status='verified'
         WHERE id=? AND seller_id=? AND payment_status='submitted'`,
        [orderId,sellerId],
        (err,result)=>{
            if(err){
                callback(err,null)
            }
            else{
                callback(null,result)
            }
        }
    )
}

function rejectPayment(orderId,sellerId,callback){
    db.query(
        `UPDATE orders SET payment_status='rejected'
         WHERE id=? AND seller_id=? AND payment_status='submitted'`,
        [orderId,sellerId],
        (err,result)=>{
            if(err){
                callback(err,null)
            }
            else{
                callback(null,result)
            }
        }
    )
}

function updateOrderStatus(orderId,sellerId,status,callback){
    db.query(
        "UPDATE orders SET status=? WHERE id=? AND seller_id=?",
        [status,orderId,sellerId],
        (err,result)=>{
            if(err){
                callback(err,null)
            }
            else{
                callback(null,result)
            }
        }
    )
}

module.exports={
    createOrder,
    addOrderItem,
    getOrdersByBuyer,
    getOrdersBySeller,
    getOrderById,
    getOrderItems,
    getAllOrders,
    markPaid,
    verifyPayment,
    rejectPayment,
    updateOrderStatus
}
