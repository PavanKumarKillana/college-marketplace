const adminModel=require("../models/adminModel")
const productModel=require("../models/productsModel")
const orderModel=require("../models/orderModel")
const userModel=require("../models/userModel")

function getUsers(req,res){
    adminModel.getAllUsers((err,result)=>{
        if(err){
            res.json({success:false,message:"cannot get users"})
        }
        else{
            res.json(result)
        }
    })
}

function getAllProducts(req,res){
    adminModel.getAllProductsAdmin((err,result)=>{
        if(err){
            res.json({success:false,message:"cannot get products"})
        }
        else{
            res.json(result)
        }
    })
}

function hideProduct(req,res){
    const isActive=req.body.is_active ? 1 : 0
    productModel.setProductActive(req.params.id,isActive,(err)=>{
        if(err){
            res.json({success:false,message:"cannot update product"})
        }
        else{
            res.json({success:true,message:isActive ? "Product restored successfully!" : "Product hidden from store!"})
        }
    })
}

function deleteProduct(req,res){
    const productId=req.params.id
    adminModel.deleteProductAdmin(productId,(err,result)=>{
        if(err){
            res.json({success:false,message:"Cannot delete product"})
        }
        else if(result.affectedRows===0){
            res.json({success:false,message:"Product not found"})
        }
        else{
            res.json({success:true,message:"Product deleted permanently from database!"})
        }
    })
}

function toggleUserBlock(req,res){
    const userId=req.params.id
    const isBlocked=req.body.is_blocked ? 1 : 0
    userModel.setUserBlockStatus(userId,isBlocked,(err,result)=>{
        if(err){
            res.json({success:false,message:"Cannot update user status"})
        }
        else{
            res.json({
                success:true,
                message:isBlocked ? "User account suspended!" : "User account activated!"
            })
        }
    })
}

function getOrders(req,res){
    orderModel.getAllOrders((err,result)=>{
        if(err){
            res.json({success:false,message:"cannot get orders"})
        }
        else{
            res.json(result)
        }
    })
}

function issueSellerStrike(req, res) {
    const sellerId = req.params.id
    const reason = (req.body.reason || "").trim()
    const adminId = req.userId

    if (!sellerId || !reason) {
        return res.json({ success: false, message: "Seller ID and reason are required" })
    }

    const db = require("../config/db")
    adminModel.addSellerStrike(sellerId, adminId, reason, (err) => {
        if (err) {
            return res.json({ success: false, message: "Failed to record strike" })
        }

        // Count total strikes for this seller
        adminModel.getSellerStrikesBySellerId(sellerId, (sErr, strikes) => {
            if (sErr) {
                return res.json({ success: true, message: "Strike recorded successfully." })
            }

            const totalStrikes = strikes.length
            if (totalStrikes >= 3) {
                // Auto-block seller account and hide products
                const blockSql = `
                    UPDATE users 
                    SET is_blocked = 1 
                    WHERE id = (SELECT user_id FROM sellers WHERE id = ?)
                `
                db.query(blockSql, [sellerId], () => {
                    db.query("UPDATE products SET is_active = 0 WHERE seller_id = ?", [sellerId], () => {
                        res.json({
                            success: true,
                            message: `Strike #${totalStrikes} issued! Seller has reached 3 strikes and has been AUTOMATICALLY SUSPENDED!`
                        })
                    })
                })
            } else {
                res.json({
                    success: true,
                    message: `Strike #${totalStrikes} issued successfully for seller.`
                })
            }
        })
    })
}

function getSellerStrikes(req, res) {
    const sellerId = req.params.id
    adminModel.getSellerStrikesBySellerId(sellerId, (err, result) => {
        if (err) {
            res.json({ success: false, message: "Cannot get strike history" })
        } else {
            res.json(result)
        }
    })
}

module.exports={
    getUsers,
    getAllProducts,
    hideProduct,
    deleteProduct,
    toggleUserBlock,
    getOrders,
    issueSellerStrike,
    getSellerStrikes
}


