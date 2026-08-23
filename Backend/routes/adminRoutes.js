const express=require("express")
const {verifyToken,requireAdmin}=require("../middleware/authMiddleware")
const adminController=require("../controllers/adminController")
const router=express.Router()
router.get("/users",verifyToken,requireAdmin,adminController.getUsers)
router.put("/users/:id/block",verifyToken,requireAdmin,adminController.toggleUserBlock)
router.put("/users/:id/hostel",verifyToken,requireAdmin,adminController.updateUserHostelAdmin)
router.get("/products",verifyToken,requireAdmin,adminController.getAllProducts)
router.put("/products/:id",verifyToken,requireAdmin,adminController.hideProduct)
router.delete("/products/:id",verifyToken,requireAdmin,adminController.deleteProduct)
const hostelController = require("../controllers/hostelController")
const reportController = require("../controllers/reportController")
router.get("/orders",verifyToken,requireAdmin,adminController.getOrders)
router.post("/sellers/:id/strike",verifyToken,requireAdmin,adminController.issueSellerStrike)
router.get("/sellers/:id/strikes",verifyToken,requireAdmin,adminController.getSellerStrikes)

router.get("/hostels",verifyToken,requireAdmin,hostelController.getAllHostelsAdmin)
router.post("/hostels",verifyToken,requireAdmin,hostelController.addHostel)
router.put("/hostels/:id",verifyToken,requireAdmin,hostelController.toggleHostelStatus)

router.get("/reports",verifyToken,requireAdmin,reportController.getReportsAdmin)
router.put("/reports/:id",verifyToken,requireAdmin,reportController.resolveReport)

module.exports=router
