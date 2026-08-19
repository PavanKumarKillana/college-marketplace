const express=require("express")
const userController=require("../controllers/userController")
const {verifyToken}=require("../middleware/authMiddleware")
const router=express.Router()
router.post("/register",userController.registerUser)
router.post("/login",userController.loginUser)
router.get("/me",verifyToken,userController.getMe)
router.post("/become-seller",verifyToken,userController.becomeSeller)
module.exports=router
