const multer=require("multer")
const fs=require("fs")
const path=require("path")

function createImageUpload(folderName,filePrefix){
    const folder=path.join(__dirname,"..","uploads",folderName)
    fs.mkdirSync(folder,{recursive:true})
    const storage=multer.diskStorage({
        destination:(req,file,callback)=>{
            callback(null,folder)
        },
        filename:(req,file,callback)=>{
            const extension={
                "image/jpeg":".jpg",
                "image/png":".png",
                "image/webp":".webp"
            }[file.mimetype]
            callback(null,filePrefix+"-"+Date.now()+"-"+Math.round(Math.random()*1000000)+extension)
        }
    })
    return multer({
        storage:storage,
        limits:{fileSize:5*1024*1024},
        fileFilter:(req,file,callback)=>{
            const allowed=["image/jpeg","image/png","image/webp"]
            if(allowed.indexOf(file.mimetype)===-1){
                return callback(new Error("Only JPG, PNG, or WEBP images are allowed"))
            }
            callback(null,true)
        }
    })
}

const uploadPaymentScreenshot=createImageUpload("payment-proofs","payment")
const uploadProductImage=createImageUpload("products","product")
const uploadUpiQrImage=createImageUpload("upi-qr","upi-qr")

module.exports={
    uploadPaymentScreenshot,
    uploadProductImage,
    uploadUpiQrImage
}
