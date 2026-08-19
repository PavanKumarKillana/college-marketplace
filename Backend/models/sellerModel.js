const db=require("../config/db")

function createSeller(userId,storeName,roomNumber,callback){
    db.query(
        "INSERT INTO sellers(user_id,store_name,room_number) VALUES(?,?,?)",
        [userId,storeName,roomNumber],
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

function getSellerByUserId(userId,callback){
    db.query("SELECT * FROM sellers WHERE user_id=?",[userId],(err,result)=>{
        if(err){
            callback(err,null)
        }
        else{
            callback(null,result)
        }
    })
}

function getSellerById(id,callback){
    const query=`
        SELECT sellers.*,
        (SELECT AVG(rating) FROM seller_reviews WHERE seller_id = sellers.id) AS avg_rating
        FROM sellers WHERE id=?
    `
    db.query(query,[id],(err,result)=>{
        if(err){
            callback(err,null)
        }
        else{
            callback(null,result)
        }
    })
}

function updateSeller(userId,storeName,roomNumber,upiId,upiQrUrl,callback){
    db.query(
        "UPDATE sellers SET store_name=?, room_number=?, upi_id=?, upi_qr_url=COALESCE(?, upi_qr_url) WHERE user_id=?",
        [storeName,roomNumber,upiId,upiQrUrl,userId],
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
    createSeller,
    getSellerByUserId,
    getSellerById,
    updateSeller
}
