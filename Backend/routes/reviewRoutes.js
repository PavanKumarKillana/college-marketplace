const express=require("express")
const {verifyToken}=require("../middleware/authMiddleware")
const reviewController=require("../controllers/reviewController")
const router=express.Router()
router.get("/products/:id",reviewController.getProductReviews)
router.post("/products/:id",verifyToken,reviewController.addProductReview)
router.get("/sellers/:id",reviewController.getSellerReviews)
router.post("/sellers/:id",verifyToken,reviewController.addSellerReview)
module.exports=router
