const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3")
require("./config/db")
const express=require('express')
const cors=require("cors")
const path=require("path")
const productRoutes=require("./routes/productRoutes")
const userRoutes=require("./routes/userRoutes")
const cartRoutes=require("./routes/cartRoutes")
const sellerRoutes=require("./routes/sellerRoutes")
const orderRoutes=require("./routes/orderRoutes")
const reviewRoutes=require("./routes/reviewRoutes")
const adminRoutes=require("./routes/adminRoutes")
const hostelRoutes=require("./routes/hostelRoutes")
const reportRoutes=require("./routes/reportRoutes")
const chatRoutes=require("./routes/chatRoutes")
const app=express()
app.use(cors())
app.use(express.json())
const s3 = new S3Client({
    region: process.env.AWS_REGION || "ap-south-1"
})

const S3_BUCKET = process.env.S3_BUCKET || "college-marketplace-assets-523109312493"

app.get(/^\/uploads\/(.+)$/, async (req, res) => {
    try {
        const key = "uploads/" + req.params[0]

        const result = await s3.send(new GetObjectCommand({
            Bucket: S3_BUCKET,
            Key: key
        }))

        if (result.ContentType) {
            res.setHeader("Content-Type", result.ContentType)
        }

        if (result.ContentLength !== undefined) {
            res.setHeader("Content-Length", result.ContentLength)
        }

        result.Body.pipe(res)
    } catch (err) {
        console.error("S3 download failed:", err.message)
        res.status(404).json({ success: false, message: "File not found" })
    }
})
app.get('/',(req,res)=>{
    res.send("E-commerce API is running!")
})
app.use('/api/products',productRoutes)
app.use('/api/users',userRoutes)
app.use('/api/cart',cartRoutes)
app.use('/api/sellers',sellerRoutes)
app.use('/api/orders',orderRoutes)
app.use('/api/orders',chatRoutes)
app.use('/api/reviews',reviewRoutes)
app.use('/api/admin',adminRoutes)
app.use('/api/hostels',hostelRoutes)
app.use('/api/reports',reportRoutes)
app.use((err,req,res,next)=>{
    if(err && err.name==="MulterError"){
        return res.json({success:false,message:"Screenshot upload failed: "+err.message})
    }
    if(err){
        return res.json({success:false,message:err.message || "Request failed"})
    }
    next()
})
const PORT = process.env.PORT || 3000
app.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`)
})
