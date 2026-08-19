const jwt=require("jsonwebtoken")
const userModel=require("../models/userModel")
const sellerModel=require("../models/sellerModel")

function getJwtSecret(){
    return process.env.JWT_SECRET
}

function verifyToken(req,res,next){
    const token= req.headers["authorization"]
    const secret=getJwtSecret()
    if(!token){
        return res.json({
            success:false,
            message:"No token provided"
        })
    }
    if(!secret){
        return res.json({
            success:false,
            message:"JWT_SECRET is missing in .env"
        })
    }
    jwt.verify(token,secret,(err,decoded)=>{
        if(err){
            return res.json({
                success:false,
                message:"invalid Token"
            })
        }
        req.userId=decoded.id
        req.userRole=decoded.role
        next()
    })
}

function requireSeller(req,res,next){
    userModel.getUserById(req.userId,(err,result)=>{
        if(err || result.length===0){
            return res.json({
                success:false,
                message:"User not found"
            })
        }
        const user=result[0]
        if(user.role!=="seller"){
            return res.json({
                success:false,
                message:"Only sellers can do this"
            })
        }
        sellerModel.getSellerByUserId(req.userId,(sellerErr,sellers)=>{
            if(sellerErr || sellers.length===0){
                return res.json({
                    success:false,
                    message:"Seller profile not found"
                })
            }
            req.sellerId=sellers[0].id
            next()
        })
    })
}

function requireAdmin(req,res,next){
    userModel.getUserById(req.userId,(err,result)=>{
        if(err || result.length===0){
            return res.json({
                success:false,
                message:"User not found"
            })
        }
        if(result[0].role!=="admin"){
            return res.json({
                success:false,
                message:"Only admin can do this"
            })
        }
        next()
    })
}

module.exports={
    verifyToken,
    requireSeller,
    requireAdmin,
    getJwtSecret
}
