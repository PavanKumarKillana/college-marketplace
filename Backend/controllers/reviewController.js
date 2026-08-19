const reviewModel=require("../models/reviewModel")

function addProductReview(req,res){
    const rating=Number(req.body.rating)
    if(rating<1 || rating>5){
        return res.json({success:false,message:"Rating must be 1 to 5"})
    }
    reviewModel.addProductReview(req.params.id,req.userId,rating,req.body.comment || "",(err)=>{
        if(err){
            return res.json({success:false,message:"Review not saved. You may have already reviewed this product."})
        }
        res.json({success:true,message:"Review added"})
    })
}

function getProductReviews(req,res){
    reviewModel.getProductReviews(req.params.id,(err,result)=>{
        if(err){
            res.json([])
        }
        else{
            res.json(result)
        }
    })
}

function addSellerReview(req,res){
    const rating=Number(req.body.rating)
    if(rating<1 || rating>5){
        return res.json({success:false,message:"Rating must be 1 to 5"})
    }
    reviewModel.addSellerReview(req.params.id,req.userId,rating,req.body.comment || "",(err)=>{
        if(err){
            return res.json({success:false,message:"Review not saved. You may have already reviewed this seller."})
        }
        res.json({success:true,message:"Review added"})
    })
}

function getSellerReviews(req,res){
    reviewModel.getSellerReviews(req.params.id,(err,result)=>{
        if(err){
            res.json([])
        }
        else{
            res.json(result)
        }
    })
}

module.exports={
    addProductReview,
    getProductReviews,
    addSellerReview,
    getSellerReviews
}
