const express=require('express')
const {verifyToken,requireSeller}=require("../middleware/authMiddleware")
const {uploadProductImage}=require("../middleware/uploadMiddleware")
const {getProducts,
    getCategories,
    getSingleProduct,
    addProduct,
    deleteProduct,
    updateProduct,
    getMyProducts
}=require("../controllers/productController")
const router=express.Router()
router.get("/",getProducts)
router.get("/categories/list",getCategories)
router.get("/mine/list",verifyToken,requireSeller,getMyProducts)
router.get("/:id",getSingleProduct)
router.post("/",verifyToken,requireSeller,uploadProductImage.single("product_image"),addProduct)
router.delete("/:id",verifyToken,requireSeller,deleteProduct)
router.put("/:id",verifyToken,requireSeller,uploadProductImage.single("product_image"),updateProduct)
module.exports=router
