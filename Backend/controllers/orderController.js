const db=require("../config/db")
const cartModel=require("../models/cartModel")
const orderModel=require("../models/orderModel")
const productModel=require("../models/productsModel")

function placeOrder(req,res){
    const fulfillment=req.body.fulfillment_type
    const room=req.body.buyer_room_number || null
    if(fulfillment!=="pickup" && fulfillment!=="delivery"){
        return res.json({success:false,message:"Choose pickup or delivery"})
    }
    if(fulfillment==="delivery" && !room){
        return res.json({success:false,message:"Room number is required for delivery"})
    }
    cartModel.getCart(req.userId,(err,items)=>{
        if(err){
            return res.json({success:false,message:"cannot read cart. Run schema.sql"})
        }
        if(!items || items.length===0){
            return res.json({success:false,message:"Cart is empty"})
        }
        const groups={}
        for(let i=0;i<items.length;i++){
            const item=items[i]
            if(!item.seller_id){
                return res.json({success:false,message:item.name+" has no seller"})
            }
            if(fulfillment==="delivery" && !item.delivery_available){
                return res.json({success:false,message:item.name+" is pickup only"})
            }
            if(fulfillment==="pickup" && !item.pickup_available){
                return res.json({success:false,message:item.name+" is delivery only"})
            }
            if(item.stock < item.quantity){
                return res.json({success:false,message:"Not enough stock for "+item.name})
            }
            if(!groups[item.seller_id]){
                groups[item.seller_id]=[]
            }
            groups[item.seller_id].push(item)
        }
        const checkoutId=Date.now()+"-"+req.userId
        const sellerIds=Object.keys(groups)
        const createdOrderIds = []
        db.beginTransaction((tErr)=>{
            if(tErr){
                return res.json({success:false,message:"could not start order"})
            }
            function insertSeller(index){
                if(index>=sellerIds.length){
                    return cartModel.clearCart(req.userId,(clearErr)=>{
                        if(clearErr){
                            return db.rollback(()=>{
                                res.json({success:false,message:"order failed"})
                            })
                        }
                        db.commit((cErr)=>{
                            if(cErr){
                                return db.rollback(()=>{
                                    res.json({success:false,message:"order failed"})
                                })
                            }
                            
                            // Send emails asynchronously
                            const { sendOrderNotificationEmail } = require("../config/mailer")
                            createdOrderIds.forEach(id => {
                                db.query(`
                                    SELECT o.id, o.grand_total, u.email as seller_email, b.name as buyer_name 
                                    FROM orders o
                                    JOIN sellers s ON o.seller_id = s.id
                                    JOIN users u ON s.user_id = u.id
                                    JOIN users b ON o.buyer_id = b.id
                                    WHERE o.id = ?
                                `, [id], (err, queryRes) => {
                                    if(!err && queryRes.length > 0) {
                                        sendOrderNotificationEmail(queryRes[0].seller_email, queryRes[0].id, queryRes[0].buyer_name || 'A Student', queryRes[0].grand_total)
                                    }
                                })
                            })

                            res.json({
                                success:true,
                                message:"Order placed. Pay each seller with UPI.",
                                checkout_id:checkoutId
                            })
                        })
                    })
                }
                const sellerId=sellerIds[index]
                const lines=groups[sellerId]
                let itemsTotal=0
                let maxDeliveryCharge=0
                for(let j=0;j<lines.length;j++){
                    itemsTotal += Number(lines[j].price) * Number(lines[j].quantity)
                    const charge = Number(lines[j].delivery_charge || 0)
                    if(charge > maxDeliveryCharge) maxDeliveryCharge = charge
                }
                const deliveryCharge=fulfillment==="delivery" ? maxDeliveryCharge : 0
                orderModel.createOrder({
                    checkout_id:checkoutId,
                    buyer_id:req.userId,
                    seller_id:sellerId,
                    fulfillment_type:fulfillment,
                    buyer_room_number:fulfillment==="delivery" ? room : null,
                    items_total:itemsTotal,
                    delivery_charge:deliveryCharge,
                    grand_total:itemsTotal+deliveryCharge
                },(orderErr,orderResult)=>{
                    if(orderErr){
                        return db.rollback(()=>{
                            res.json({success:false,message:"order failed. Run schema.sql"})
                        })
                    }
                    createdOrderIds.push(orderResult.insertId)
                    insertItems(orderResult.insertId,lines,0,index)
                })
            }
            function insertItems(orderId,lines,lineIndex,sellerIndex){
                if(lineIndex>=lines.length){
                    return insertSeller(sellerIndex+1)
                }
                const line=lines[lineIndex]
                orderModel.addOrderItem(orderId,line,(itemErr)=>{
                    if(itemErr){
                        return db.rollback(()=>{
                            res.json({success:false,message:"order item failed"})
                        })
                    }
                    productModel.decreaseStock(line.product_id,line.quantity,(stockErr,stockResult)=>{
                        if(stockErr || stockResult.affectedRows===0){
                            return db.rollback(()=>{
                                res.json({success:false,message:"stock update failed for "+line.name})
                            })
                        }
                        insertItems(orderId,lines,lineIndex+1,sellerIndex)
                    })
                })
            }
            insertSeller(0)
        })
    })
}

function myOrders(req,res){
    orderModel.getOrdersByBuyer(req.userId,(err,orders)=>{
        if(err){
            return res.json({success:false,message:"cannot get orders"})
        }
        attachItems(orders,0,res)
    })
}

function sellerOrders(req,res){
    orderModel.getOrdersBySeller(req.sellerId,(err,orders)=>{
        if(err){
            return res.json({success:false,message:"cannot get orders"})
        }
        attachItems(orders,0,res)
    })
}

function attachItems(orders,index,res){
    if(index>=orders.length){
        return res.json(orders)
    }
    orderModel.getOrderItems(orders[index].id,(err,items)=>{
        orders[index].items=items || []
        attachItems(orders,index+1,res)
    })
}

function confirmPayment(req,res){
    const utr=(req.body.payment_utr || "").trim()

    // Payment screenshot is mandatory.
    // UPI transaction ID / UTR is optional.
    if(!req.file){
        return res.json({success:false,message:"Please upload your payment screenshot"})
    }

    const screenshotUrl="/uploads/payment-proofs/"+req.file.filename

    orderModel.markPaid(req.params.id,req.userId,utr || null,screenshotUrl,(err,result)=>{
        if(err){
            return res.json({success:false,message:"cannot update payment"})
        }
        if(result.affectedRows===0){
            return res.json({success:false,message:"Order not found or payment already submitted"})
        }
        res.json({success:true,message:"Payment proof sent. Wait for seller to verify."})
    })
}

function verifyPayment(req,res){
    orderModel.verifyPayment(req.params.id,req.sellerId,(err,result)=>{
        if(err){
            return res.json({success:false,message:"cannot verify payment"})
        }
        if(result.affectedRows===0){
            return res.json({success:false,message:"No submitted payment to verify"})
        }
        res.json({success:true,message:"Payment verified. You can prepare the order."})
    })
}

function rejectPayment(req,res){
    orderModel.rejectPayment(req.params.id,req.sellerId,(err,result)=>{
        if(err){
            return res.json({success:false,message:"cannot reject payment"})
        }
        if(result.affectedRows===0){
            return res.json({success:false,message:"No submitted payment to reject"})
        }
        res.json({success:true,message:"Payment rejected. Buyer must pay again."})
    })
}

function updateStatus(req,res){
    const status=req.body.status
    const allowed=["pending","confirmed","ready","completed","cancelled"]
    if(allowed.indexOf(status)===-1){
        return res.json({success:false,message:"Invalid status"})
    }

    orderModel.getOrderById(req.params.id,(err,rows)=>{
        if(err || !rows || rows.length===0){
            return res.json({success:false,message:"Order not found"})
        }
        const currentOrder = rows[0]

        // Validate seller ownership
        if(currentOrder.seller_id !== req.sellerId){
            return res.json({success:false,message:"You can only update your own orders"})
        }

        if(status==="confirmed" || status==="ready" || status==="completed"){
            if(currentOrder.payment_status!=="verified"){
                return res.json({success:false,message:"Verify payment before confirming the order"})
            }
        }

        // If cancelling an order that wasn't previously cancelled, restore inventory
        if(status==="cancelled" && currentOrder.status!=="cancelled"){
            orderModel.getOrderItems(req.params.id,(itErr,items)=>{
                if(!itErr && items && items.length > 0){
                    items.forEach(item => {
                        productModel.increaseStock(item.product_id, item.quantity, ()=>{})
                    })
                }
                doUpdate()
            })
        }
        else{
            doUpdate()
        }
    })

    function doUpdate(){
        orderModel.updateOrderStatus(req.params.id,req.sellerId,status,(err,result)=>{
            if(err){
                return res.json({success:false,message:"cannot update status"})
            }
            if(result.affectedRows===0){
                return res.json({success:false,message:"You can only update your own orders"})
            }
            res.json({success:true,message:"Order status updated"})
        })
    }
}

function adminOrders(req,res){
    orderModel.getAllOrders((err,result)=>{
        if(err){
            res.json({success:false,message:"cannot get orders"})
        }
        else{
            res.json(result)
        }
    })
}

module.exports={
    placeOrder,
    myOrders,
    sellerOrders,
    confirmPayment,
    verifyPayment,
    rejectPayment,
    updateStatus,
    adminOrders
}
