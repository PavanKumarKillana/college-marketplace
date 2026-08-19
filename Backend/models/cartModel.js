const db=require("../config/db")

function findCartItem(user_id,product_id,callback){
    db.query(
        "SELECT * FROM cart WHERE user_id=? AND product_id=?",
        [user_id,product_id],
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

function addToCart(user_id,product_id,callback){
    db.query("INSERT INTO cart(user_id,product_id,quantity) VALUES(?,?,1)",[user_id,product_id],(err,result)=>{
        if(err){
            callback(err,null)
        }
        else{
            callback(null,result)
        }
    })
}

function increaseQuantity(cart_id,callback){
    db.query("UPDATE cart SET quantity = quantity + 1 WHERE id=?",[cart_id],(err,result)=>{
        if(err){
            callback(err,null)
        }
        else{
            callback(null,result)
        }
    })
}

function getCart(user_id,callback){
    const query = `
        SELECT cart.id, cart.quantity, cart.product_id,
            products.name, products.price, products.image_url, products.seller_id,
            products.stock, products.pickup_available, products.delivery_available, products.delivery_charge,
            sellers.store_name, sellers.room_number AS seller_room, sellers.upi_id, sellers.upi_qr_url
        FROM cart
        JOIN products ON cart.product_id = products.id
        LEFT JOIN sellers ON products.seller_id = sellers.id
        WHERE cart.user_id = ?
    `
    db.query(query,[user_id],(err,result)=>{
        if(err){
            callback(err,null)
        }
        else{
            callback(null,result)
        }
    })
}

function removeFromCart(cart_id, user_id, callback){
    db.query("DELETE FROM cart WHERE id = ? AND user_id = ?",[cart_id, user_id],(err,result)=>{
        if(err){
            callback(err,null)
        }
        else{
            callback(null,result)
        }
    })
}

function clearCart(user_id,callback){
    db.query("DELETE FROM cart WHERE user_id=?",[user_id],(err,result)=>{
        if(err){
            callback(err,null)
        }
        else{
            callback(null,result)
        }
    })
}

module.exports={
    findCartItem,
    addToCart,
    increaseQuantity,
    getCart,
    removeFromCart,
    clearCart
}
