const userModel=require("../models/userModel")
const sellerModel=require("../models/sellerModel")
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")
const crypto=require("crypto")
const db=require("../config/db")
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
    const hostelId=req.body.hostel_id || null
    if(!email || !password){
        return res.json({
            success:false,
            message:"Email and password are required"
        })
    }
    const hashedPassword=await bcrypt.hash(password,10)
    userModel.createUser(email,hashedPassword,name,"buyer",roomNumber,hostelId,(err,result)=>{
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

        if(user.is_blocked === 1){
            return res.json({success:false,message:"Your account has been suspended by an administrator."})
        }

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

        if(user.is_blocked === 1){
            return res.json({success:false,message:"Your account has been suspended by an administrator."})
        }

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

/* =====================================
   FORGOT PASSWORD & OTP WORKFLOW
===================================== */

function forgotPassword(req, res) {
    const email = (req.body.email || "").trim().toLowerCase()
    if (!email) {
        return res.json({ success: false, message: "Please enter your email address." })
    }

    userModel.getUserByEmail(email, (err, users) => {
        if (err || !users || users.length === 0) {
            return res.json({ success: false, message: "No account found with this email address." })
        }
        const user = users[0]
        if (user.is_blocked === 1) {
            return res.json({ success: false, message: "Your account is suspended. Contact administrator." })
        }

        // Check 60-second cooldown
        const checkCooldown = `
            SELECT * FROM password_resets 
            WHERE email = ? AND resend_available_at > NOW() 
            ORDER BY id DESC LIMIT 1
        `
        db.query(checkCooldown, [email], (cdErr, cdRows) => {
            if (!cdErr && cdRows.length > 0) {
                return res.json({
                    success: false,
                    message: "Please wait 60 seconds before requesting another OTP."
                })
            }

            // Generate 6-digit OTP
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString()

            const insertSql = `
                INSERT INTO password_resets 
                (email, otp_code, attempts, expires_at, resend_available_at, is_verified) 
                VALUES (?, ?, 0, DATE_ADD(NOW(), INTERVAL 10 MINUTE), DATE_ADD(NOW(), INTERVAL 60 SECOND), 0)
            `
            db.query(insertSql, [email, otpCode], async (insErr) => {
                if (insErr) {
                    return res.json({ success: false, message: "Could not generate OTP. Please try again." })
                }

                // Send OTP via email using mailer utility
                const { sendOtpEmail } = require("../config/mailer")
                const mailResult = await sendOtpEmail(email, otpCode)

                if (mailResult.sent) {
                    return res.json({
                        success: true,
                        message: `OTP sent to ${email}! Please check your email inbox.`
                    })
                } else if (mailResult.dev_mode) {
                    return res.json({
                        success: true,
                        message: `OTP generated! Code: ${otpCode} (Valid for 10 mins)`,
                        otp_demo: otpCode
                    })
                } else {
                    return res.json({
                        success: false,
                        message: "Failed to deliver OTP email. Please contact administrator."
                    })
                }
            })
        })
    })
}

function verifyOtp(req, res) {
    const email = (req.body.email || "").trim().toLowerCase()
    const otp = (req.body.otp || "").trim()

    if (!email || !otp) {
        return res.json({ success: false, message: "Email and OTP are required." })
    }

    const selectSql = `
        SELECT * FROM password_resets 
        WHERE email = ? AND is_verified = 0 
        ORDER BY id DESC LIMIT 1
    `
    db.query(selectSql, [email], (err, rows) => {
        if (err || rows.length === 0) {
            return res.json({ success: false, message: "No active OTP request found. Please request a new OTP." })
        }

        const record = rows[0]
        const now = new Date()
        const expiresAt = new Date(record.expires_at)

        if (now > expiresAt) {
            return res.json({ success: false, message: "OTP has expired. Please request a new OTP." })
        }

        if (record.attempts >= 3) {
            return res.json({ success: false, message: "Maximum failed attempts reached. Please request a new OTP." })
        }

        if (record.otp_code !== otp) {
            // Increment attempts
            db.query("UPDATE password_resets SET attempts = attempts + 1 WHERE id = ?", [record.id])
            const remaining = 2 - record.attempts
            return res.json({
                success: false,
                message: `Invalid OTP code. ${remaining > 0 ? remaining + " attempt(s) remaining." : "Please request a new OTP."}`
            })
        }

        // OTP Valid! Create single-use reset token
        const resetToken = crypto.randomBytes(24).toString("hex")
        const updateSql = `
            UPDATE password_resets 
            SET is_verified = 1, reset_token = ? 
            WHERE id = ?
        `
        db.query(updateSql, [resetToken, record.id], (uErr) => {
            if (uErr) {
                return res.json({ success: false, message: "Failed to verify OTP. Please try again." })
            }
            res.json({
                success: true,
                message: "OTP verified successfully!",
                reset_token: resetToken
            })
        })
    })
}

async function resetPassword(req, res) {
    const email = (req.body.email || "").trim().toLowerCase()
    const resetToken = (req.body.reset_token || "").trim()
    const newPassword = req.body.new_password

    if (!email || !resetToken || !newPassword) {
        return res.json({ success: false, message: "Missing required fields." })
    }

    if (newPassword.length < 6) {
        return res.json({ success: false, message: "Password must be at least 6 characters long." })
    }

    const checkSql = `
        SELECT * FROM password_resets 
        WHERE email = ? AND reset_token = ? AND is_verified = 1 AND expires_at > NOW() 
        ORDER BY id DESC LIMIT 1
    `
    db.query(checkSql, [email, resetToken], async (err, rows) => {
        if (err || rows.length === 0) {
            return res.json({ success: false, message: "Invalid or expired reset token. Please restart password reset." })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)
        userModel.updateUserPassword(email, hashedPassword, (updateErr) => {
            if (updateErr) {
                return res.json({ success: false, message: "Failed to update password." })
            }

            // Invalidate all reset tokens for this email
            db.query("DELETE FROM password_resets WHERE email = ?", [email])

            res.json({
                success: true,
                message: "Password reset successfully! You can now log in with your new password."
            })
        })
    })
}

module.exports={
    registerUser,
    loginUser,
    getMe,
    becomeSeller,
    forgotPassword,
    verifyOtp,
    resetPassword
}

