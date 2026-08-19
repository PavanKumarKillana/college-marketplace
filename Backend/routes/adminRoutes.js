const express=require("express")
const {verifyToken,requireAdmin}=require("../middleware/authMiddleware")
const adminController=require("../controllers/adminController")
const router=express.Router()
router.get("/users",verifyToken,requireAdmin,adminController.getUsers)
router.get("/orders",verifyToken,requireAdmin,adminController.getOrders)
router.put("/products/:id",verifyToken,requireAdmin,adminController.hideProduct)
module.exports=router
