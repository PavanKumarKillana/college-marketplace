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
const app=express()
app.use(cors())
app.use(express.json())
app.use("/uploads",express.static(path.join(__dirname,"uploads")))
app.get('/',(req,res)=>{
    res.send("E-commerce API is running!")
})
app.use('/api/products',productRoutes)
app.use('/api/users',userRoutes)
app.use('/api/cart',cartRoutes)
app.use('/api/sellers',sellerRoutes)
app.use('/api/orders',orderRoutes)
app.use('/api/reviews',reviewRoutes)
app.use('/api/admin',adminRoutes)
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
