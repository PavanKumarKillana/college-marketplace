const multer = require("multer")
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3")

const s3 = new S3Client({
    region: process.env.AWS_REGION || "ap-south-1"
})

const BUCKET = process.env.S3_BUCKET || "college-marketplace-assets-523109312493"

function createImageUpload(folderName, filePrefix) {
    const upload = multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, callback) => {
            const allowed = ["image/jpeg", "image/png", "image/webp"]
            if (!allowed.includes(file.mimetype)) {
                return callback(new Error("Only JPG, PNG, or WEBP images are allowed"))
            }
            callback(null, true)
        }
    })

    return {
        single(fieldName) {
            const parse = upload.single(fieldName)

            return async (req, res, next) => {
                parse(req, res, async (err) => {
                    if (err) return next(err)
                    if (!req.file) return next()

                    try {
                        const extension = {
                            "image/jpeg": ".jpg",
                            "image/png": ".png",
                            "image/webp": ".webp"
                        }[req.file.mimetype]

                        const filename =
                            filePrefix + "-" +
                            Date.now() + "-" +
                            Math.round(Math.random() * 1000000) +
                            extension

                        const key = `uploads/${folderName}/${filename}`

                        await s3.send(new PutObjectCommand({
                            Bucket: BUCKET,
                            Key: key,
                            Body: req.file.buffer,
                            ContentType: req.file.mimetype
                        }))

                        req.file.filename = filename
                        req.file.s3Key = key

                        next()
                    } catch (error) {
                        console.error("S3 upload failed:", error)
                        next(error)
                    }
                })
            }
        }
    }
}

const uploadPaymentScreenshot =
    createImageUpload("payment-proofs", "payment")

const uploadProductImage =
    createImageUpload("products", "product")

const uploadUpiQrImage =
    createImageUpload("upi-qr", "upi-qr")

module.exports = {
    uploadPaymentScreenshot,
    uploadProductImage,
    uploadUpiQrImage
}
