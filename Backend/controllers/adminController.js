const adminModel=require("../models/adminModel")
const productModel=require("../models/productsModel")
const orderModel=require("../models/orderModel")

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

function hideProduct(req,res){
    const isActive=req.body.is_active ? 1 : 0
    productModel.setProductActive(req.params.id,isActive,(err)=>{
        if(err){
            res.json({success:false,message:"cannot update product"})
        }
        else{
            res.json({success:true,message:"Product updated"})
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

module.exports={
    getUsers,
    hideProduct,
    getOrders
}
