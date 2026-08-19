const cartModel=require("../models/cartModel")

function addToCart(req,res){
    const product_id=req.body.product_id
    const user_id=req.userId
    cartModel.findCartItem(user_id,product_id,(err,rows)=>{
        if(err){
            return res.json({
                success:false,
                message:"not added to cart!"
            })
        }
        if(rows.length>0){
            cartModel.increaseQuantity(rows[0].id,(incErr)=>{
                if(incErr){
                    return res.json({success:false,message:"not added to cart!"})
                }
                res.json({success:true,message:"quantity increased"})
            })
        }
        else{
            cartModel.addToCart(user_id,product_id,(addErr)=>{
                if(addErr){
                    res.json({
                        success:false,
                        message:"not added to cart!"
                    })
                }
                else{
                    res.json({
                        success:true,
                        message:"added to cart"
                    })
                }
            })
        }
    })
}

function getCart(req,res){
    const user_id=req.userId
    cartModel.getCart(user_id,(err,result)=>{
        if(err){
            res.json({
                message:"cannot get cart. Run schema.sql"
            })
        }
        else{
            res.json(result)
        }
    })
}

function removeFromCart(req,res){
    const cart_id=req.params.id
    const user_id=req.userId
    cartModel.removeFromCart(cart_id,user_id,(err,result)=>{
        if(err){
            res.json({
                success:false,
                message:"Cannot remove item"
            })
        }
        else{
            res.json({
                success:true,
                message:"Item removed from cart!"
            })
        }
    })
}

module.exports={
    addToCart,
    getCart,
    removeFromCart
}
