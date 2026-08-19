const db=require("../config/db")

function getAllProducts(search,category,callback){
    let query=`
        SELECT products.*, sellers.store_name, sellers.room_number AS seller_room,
        (SELECT AVG(rating) FROM product_reviews WHERE product_id = products.id) AS avg_rating
        FROM products
        LEFT JOIN sellers ON products.seller_id = sellers.id
        WHERE (products.is_active = 1 OR products.is_active IS NULL)
    `
    const params=[]
    if(search){
        query += " AND products.name LIKE ?"
        params.push("%"+search+"%")
    }
    if(category){
        query += " AND products.category = ?"
        params.push(category)
    }
    db.query(query,params,(err,result)=>{
        if(err){
            callback(err,null)
        }
        else{
            callback(null,result)
        }
    })
}

function getCategories(callback){
    db.query(
        "SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != ''",
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

function getProductById(id,callback){
    const query=`
        SELECT products.*, sellers.store_name, sellers.room_number AS seller_room, sellers.id AS shop_id,
        (SELECT AVG(rating) FROM product_reviews WHERE product_id = products.id) AS avg_rating
        FROM products
        LEFT JOIN sellers ON products.seller_id = sellers.id
        WHERE products.id=?
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

function getProductsBySeller(sellerId,callback){
    db.query(
        "SELECT * FROM products WHERE seller_id=? AND (is_active = 1 OR is_active IS NULL)",
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

function getMyProducts(sellerId,callback){
    db.query("SELECT * FROM products WHERE seller_id=?",[sellerId],(err,result)=>{
        if(err){
            callback(err,null)
        }
        else{
            callback(null,result)
        }
    })
}

function addProduct(data,callback){
    db.query(
        `INSERT INTO products
        (name, price, seller_id, description, category, stock, image_url, pickup_available, delivery_available, delivery_charge, is_active)
        VALUES (?,?,?,?,?,?,?,?,?,?,1)`,
        [
            data.name,
            data.price,
            data.sellerId,
            data.description,
            data.category,
            data.stock,
            data.image_url,
            data.pickup_available,
            data.delivery_available,
            data.delivery_charge
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

function deleteProduct(id,sellerId,callback){
    db.query("DELETE FROM products WHERE id=? AND seller_id=?",[id,sellerId],(err,result)=>{
        if(err){
            callback(err,null)
        }
        else{
            callback(null,result)
        }
    })
}

function updateProduct(id,sellerId,data,callback){
    db.query(
        `UPDATE products SET name=?, price=?, description=?, category=?, stock=?, image_url=COALESCE(?, image_url),
        pickup_available=?, delivery_available=?, delivery_charge=?
        WHERE id=? AND seller_id=?`,
        [
            data.name,
            data.price,
            data.description,
            data.category,
            data.stock,
            data.image_url,
            data.pickup_available,
            data.delivery_available,
            data.delivery_charge,
            id,
            sellerId
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

function decreaseStock(productId,quantity,callback){
    db.query(
        "UPDATE products SET stock = stock - ? WHERE id=? AND stock >= ?",
        [quantity,productId,quantity],
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

function setProductActive(id,isActive,callback){
    db.query("UPDATE products SET is_active=? WHERE id=?",[isActive,id],(err,result)=>{
        if(err){
            callback(err,null)
        }
        else{
            callback(null,result)
        }
    })
}

module.exports={
    getAllProducts,
    getCategories,
    getProductById,
    getProductsBySeller,
    getMyProducts,
    addProduct,
    deleteProduct,
    updateProduct,
    decreaseStock,
    setProductActive
}
