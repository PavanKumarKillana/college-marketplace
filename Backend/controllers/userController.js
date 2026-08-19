const userModel=require("../models/userModel")
const sellerModel=require("../models/sellerModel")
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")
const {getJwtSecret}=require("../middleware/authMiddleware")

function sendLoginResponse(res,user){
    const secret=getJwtSecret()
    sellerModel.getSellerByUserId(user.id,(err,sellers)=>{
        const isSeller=!err && sellers.length>0
        const role=isSeller ? "seller" : (user.role || "buyer")
        const token=jwt.sign({id:user.id,role:role},secret,{expiresIn:"1h"})
        res.json({
            success:true,
            token:token,
            role:role,
            is_seller:isSeller,
            name:user.name || "",
            room_number:user.room_number || ""
        })
    })
}

async function registerUser (req,res){
    const email=req.body.email
    const password=req.body.password
    const name=req.body.name || null
    const roomNumber=req.body.room_number || null
    if(!email || !password){
        return res.json({
            success:false,
            message:"Email and password are required"
        })
    }
    const hashedPassword=await bcrypt.hash(password,10)
    userModel.createUser(email,hashedPassword,name,"buyer",roomNumber,(err,result)=>{
        if(err){
            return res.json({
                success:false,
                message:"user not created"
            })
        }
        res.json({
            success:true,
            message:"Account created! You can shop now. Become a seller anytime from Home."
        })
    })
}

async function loginUser(req,res){
    const email=req.body.email
    const password=req.body.password
    const secret=getJwtSecret()
    if(!secret){
        return res.json({success:false,message:"JWT_SECRET is missing in .env"})
    }
    userModel.getUserByEmail(email,async(err,result)=>{
        if(err){
            return res.json({success:false,message:"database error"})
        }
        if(result.length===0){
            return res.json({success:false,message:"User not found!"})
        }
        const user=result[0]
        const match=await bcrypt.compare(password,user.password)
        if(!match){
            return res.json({success:false,message:"Invalid password!"})
        }
        sendLoginResponse(res,user)
    })
}

function getMe(req,res){
    userModel.getUserById(req.userId,(err,result)=>{
        if(err || result.length===0){
            return res.json({success:false,message:"User not found"})
        }
        const user=result[0]
        sellerModel.getSellerByUserId(req.userId,(sErr,sellers)=>{
            const isSeller=!sErr && sellers.length>0
            res.json({
                id:user.id,
                email:user.email,
                name:user.name,
                role:isSeller ? "seller" : user.role,
                room_number:user.room_number,
                is_seller:isSeller,
                seller:sellers[0] || null
            })
        })
    })
}

function becomeSeller(req,res){
    const storeName=req.body.store_name
    const roomNumber=req.body.room_number || null
    if(!storeName){
        return res.json({success:false,message:"Store name is required"})
    }
    sellerModel.getSellerByUserId(req.userId,(err,sellers)=>{
        if(!err && sellers.length>0){
            return res.json({success:false,message:"You already have a seller shop"})
        }
        sellerModel.createSeller(req.userId,storeName,roomNumber,(createErr)=>{
            if(createErr){
                return res.json({success:false,message:"Could not create shop. Run schema.sql"})
            }
            userModel.updateUserRole(req.userId,"seller",(roleErr)=>{
                if(roleErr){
                    return res.json({success:false,message:"Shop created but role update failed"})
                }
                userModel.getUserById(req.userId,(uErr,users)=>{
                    if(uErr || users.length===0){
                        return res.json({success:true,message:"You are now a seller! Please login again."})
                    }
                    sendLoginResponse(res,users[0])
                })
            })
        })
    })
}

module.exports={
    registerUser,
    loginUser,
    getMe,
    becomeSeller
}
