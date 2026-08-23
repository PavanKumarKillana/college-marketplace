const db=require("../config/db")

function getAllUsers(callback){
    const query = `
        SELECT u.id, u.email, u.name, u.role, u.room_number, u.is_blocked, u.hostel_id, u.year,
               h.name AS hostel_name, h.code AS hostel_code,
               s.id AS seller_id, s.store_name,
               (SELECT COUNT(*) FROM seller_strikes WHERE seller_id = s.id) AS strike_count
        FROM users u
        LEFT JOIN hostels h ON u.hostel_id = h.id
        LEFT JOIN sellers s ON u.id = s.user_id
        ORDER BY u.id DESC
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

function getAllProductsAdmin(callback){
    const query=`
        SELECT products.*, sellers.store_name, sellers.room_number AS seller_room, users.email AS seller_email
        FROM products
        LEFT JOIN sellers ON products.seller_id = sellers.id
        LEFT JOIN users ON sellers.user_id = users.id
        ORDER BY products.id DESC
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

function deleteProductAdmin(id,callback){
    db.query("DELETE FROM products WHERE id=?",[id],(err,result)=>{
        if(err){
            callback(err,null)
        }
        else{
            callback(null,result)
        }
    })
}

function addSellerStrike(sellerId, adminId, reason, callback){
    db.query(
        "INSERT INTO seller_strikes (seller_id, admin_id, reason) VALUES (?, ?, ?)",
        [sellerId, adminId, reason],
        (err, result) => {
            if (err) callback(err, null)
            else callback(null, result)
        }
    )
}

function getSellerStrikesBySellerId(sellerId, callback){
    db.query(
        "SELECT ss.*, u.email AS admin_email FROM seller_strikes ss LEFT JOIN users u ON ss.admin_id = u.id WHERE ss.seller_id = ? ORDER BY ss.id DESC",
        [sellerId],
        (err, result) => {
            if (err) callback(err, null)
            else callback(null, result)
        }
    )
}

module.exports={
    getAllUsers,
    getAllProductsAdmin,
    deleteProductAdmin,
    addSellerStrike,
    getSellerStrikesBySellerId
}


