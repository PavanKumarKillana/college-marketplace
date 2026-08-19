const productModel=require("../models/productsModel")

function available(value){
    return value===0 || value==="0" || value===false || value==="false" ? 0 : 1
}

function getProducts(req,res){
    const search=req.query.search || ""
    const category=req.query.category || ""
    productModel.getAllProducts(search,category,(err,result)=>{
        if(err){
            res.json({success:false,message:"cannot get products. Run schema.sql"})
        }
        else{
            res.json(result)
        }
    })
}

function getCategories(req,res){
    productModel.getCategories((err,result)=>{
        if(err){
            res.json([])
        }
        else{
            res.json(result)
        }
    })
}

function getSingleProduct(req,res){
    const id=req.params.id
    productModel.getProductById(id,(err,result)=>{
        if(err){
            res.json(err)
        }
        else{
            res.json(result)
        }
    })
}

function addProduct(req,res){
    productModel.addProduct({
        name:req.body.name,
        price:req.body.price,
        sellerId:req.sellerId,
        description:req.body.description || "",
        category:req.body.category || "",
        stock:req.body.stock || 0,
        image_url:req.file ? "/uploads/products/"+req.file.filename : "",
        pickup_available:available(req.body.pickup_available),
        delivery_available:available(req.body.delivery_available),
        delivery_charge:req.body.delivery_charge || 0
    },(err,result)=>{
        if(err){
            res.json({
                success:false,
                message:"Product not Added. Did you run schema.sql?"
            })
        }
        else{
            res.json({
                success:true,
                message:"Product Added"
            })
        }
    })
}

function deleteProduct(req,res){
    const id=req.params.id
    const sellerId=req.sellerId
    productModel.deleteProduct(id,sellerId,(err,result)=>{
        if(err){
            res.json({
                success:false,
                message:"product not delete"
            })
        }
        else if(result.affectedRows===0){
            res.json({
                success:false,
                message:"You can only delete your own products"
            })
        }
        else{
            res.json({
                success:true,
                message:"product delete"
            })
        }
    })
}

function updateProduct(req,res){
    const id=req.params.id
    productModel.updateProduct(id,req.sellerId,{
        name:req.body.name,
        price:req.body.price,
        description:req.body.description || "",
        category:req.body.category || "",
        stock:req.body.stock || 0,
        image_url:req.file ? "/uploads/products/"+req.file.filename : null,
        pickup_available:available(req.body.pickup_available),
        delivery_available:available(req.body.delivery_available),
        delivery_charge:req.body.delivery_charge || 0
    },(err,result)=>{
        if(err){
            res.json({
                success:false,
                message:"not update"
            })
        }
        else if(result.affectedRows===0){
            res.json({
                success:false,
                message:"You can only update your own products"
            })
        }
        else{
            res.json({
                success:true,
                message:"updated"
            })
        }
    })
}

function getMyProducts(req,res){
    productModel.getMyProducts(req.sellerId,(err,result)=>{
        if(err){
            res.json({success:false,message:"cannot get products"})
        }
        else{
            res.json(result)
        }
    })
}

module.exports={
    getProducts,
    getCategories,
    getSingleProduct,
    addProduct,
    deleteProduct,
    updateProduct,
    getMyProducts
}
