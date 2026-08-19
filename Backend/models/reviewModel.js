const db=require("../config/db")

function addProductReview(productId,userId,rating,comment,callback){
    db.query(
        "INSERT INTO product_reviews (product_id, user_id, rating, comment) VALUES (?,?,?,?)",
        [productId,userId,rating,comment],
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

function getProductReviews(productId,callback){
    db.query(
        "SELECT product_reviews.*, users.name FROM product_reviews JOIN users ON product_reviews.user_id = users.id WHERE product_id=? ORDER BY product_reviews.id DESC",
        [productId],
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

function addSellerReview(sellerId,userId,rating,comment,callback){
    db.query(
        "INSERT INTO seller_reviews (seller_id, user_id, rating, comment) VALUES (?,?,?,?)",
        [sellerId,userId,rating,comment],
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

function getSellerReviews(sellerId,callback){
    db.query(
        "SELECT seller_reviews.*, users.name FROM seller_reviews JOIN users ON seller_reviews.user_id = users.id WHERE seller_id=? ORDER BY seller_reviews.id DESC",
        [sellerId],
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
    addProductReview,
    getProductReviews,
    addSellerReview,
    getSellerReviews
}
