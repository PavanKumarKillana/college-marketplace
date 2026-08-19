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
                for(let j=0;j<lines.length;j++){
                    itemsTotal += Number(lines[j].price) * Number(lines[j].quantity)
                }
                const deliveryCharge=fulfillment==="delivery" ? Number(lines[0].delivery_charge || 0) : 0
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
    if(!utr){
        return res.json({success:false,message:"Please enter UPI transaction ID (UTR)"})
    }
    if(!req.file){
        return res.json({success:false,message:"Please upload your payment screenshot"})
    }
    const screenshotUrl="/uploads/payment-proofs/"+req.file.filename
    orderModel.markPaid(req.params.id,req.userId,utr,screenshotUrl,(err,result)=>{
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
    if(status==="confirmed" || status==="ready" || status==="completed"){
        orderModel.getOrderById(req.params.id,(err,rows)=>{
            if(err || rows.length===0){
                return res.json({success:false,message:"Order not found"})
            }
            if(rows[0].payment_status!=="verified"){
                return res.json({success:false,message:"Verify payment before confirming the order"})
            }
            doUpdate()
        })
    }
    else{
        doUpdate()
    }
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
