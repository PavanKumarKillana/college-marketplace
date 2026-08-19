const express=require("express")
const {verifyToken,requireSeller}=require("../middleware/authMiddleware")
const {uploadUpiQrImage}=require("../middleware/uploadMiddleware")
const sellerController=require("../controllers/sellerController")
const router=express.Router()
router.get("/me",verifyToken,requireSeller,sellerController.getMyShop)
router.put("/me",verifyToken,requireSeller,uploadUpiQrImage.single("upi_qr_image"),sellerController.updateMyShop)
router.get("/:id",sellerController.getStore)
module.exports=router
