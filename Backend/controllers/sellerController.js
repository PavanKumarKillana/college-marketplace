const sellerModel=require("../models/sellerModel")
const productModel=require("../models/productsModel")
const reviewModel=require("../models/reviewModel")

function getStore(req,res){
    sellerModel.getSellerById(req.params.id,(err,sellers)=>{
        if(err || sellers.length===0){
            return res.json({success:false,message:"Seller not found"})
        }
        const seller = { ...sellers[0] }
        delete seller.room_number
        productModel.getProductsBySeller(req.params.id,(pErr,products)=>{
            const sanitizedProducts = (products || []).map(p => {
                const item = { ...p }
                delete item.seller_room
                return item
            })
            reviewModel.getSellerReviews(req.params.id,(rErr,reviews)=>{
                res.json({
                    seller:seller,
                    products:sanitizedProducts,
                    reviews:reviews || []
                })
            })
        })
    })
}

function getMyShop(req,res){
    sellerModel.getSellerByUserId(req.userId,(err,result)=>{
        if(err || result.length===0){
            return res.json({success:false,message:"Seller profile not found"})
        }
        res.json(result[0])
    })
}

function updateMyShop(req,res){
    const upiQrUrl=req.file ? "/uploads/upi-qr/"+req.file.filename : null
    sellerModel.updateSeller(
        req.userId,
        req.body.store_name,
        req.body.room_number,
        req.body.upi_id,
        upiQrUrl,
        (err,result)=>{
            if(err){
                res.json({success:false,message:"could not update shop. Run schema.sql"})
            }
            else{
                res.json({success:true,message:"Shop updated"})
            }
        }
    )
}

module.exports={
    getStore,
    getMyShop,
    updateMyShop
}
