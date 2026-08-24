/* orders.js — Compact Marketplace Orders, Payment & Negotiation */

requireLogin()

let globalOrders = []
let currentChatOrderId = null

function loadBuyerOrders() {
    const box = document.getElementById("orders")
    box.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div><p>Loading your orders…</p></div>`

    fetch(API + "/api/orders", {
        headers: authHeaders()
    })
    .then(r => r.json())
    .then(data => {
        if (!Array.isArray(data) || data.length === 0) {
            box.innerHTML = `
                <div class="empty-state">
                    <p style="font-size:1rem; font-weight:600; color:var(--text-2); margin-bottom:8px;">No orders found</p>
                    <p><a href="index.html" class="btn btn-primary" style="font-size:0.82rem;">Browse Marketplace</a></p>
                </div>
            `
            return
        }

        globalOrders = data
        box.innerHTML = data.map(order => renderCompactOrderCard(order)).join("")
    })
    .catch(() => {
        box.innerHTML = `<div class="empty-state"><p style="color:var(--red);">Could not load orders. Please refresh the page.</p></div>`
    })
}

function renderCompactOrderCard(order) {
    const statusColors = {
        pending: "badge-orange",
        confirmed: "badge-blue",
        ready: "badge-green",
        completed: "badge-green",
        cancelled: "badge-red"
    }

    const payColors = {
        pending: "badge-orange",
        submitted: "badge-blue",
        verified: "badge-green",
        rejected: "badge-red"
    }

    const stColor = statusColors[order.status] || "badge-gray"
    const pyColor = payColors[order.payment_status] || "badge-gray"
    const items = order.items || []
    const itemSummary = items.map(i => `${i.name} × ${i.quantity}`).join(", ") || "Order items"
    const itemCountText = items.length === 1 ? "1 item" : `${items.length} items`

    const isPayable = order.payment_status === "pending" || order.payment_status === "rejected"

    return `
        <div class="compact-order-card">
            <div class="compact-order-header">
                <div>
                    <strong style="font-size:0.95rem; color:var(--text-1);">${escapeHtml(order.store_name || "Campus Seller")}</strong>
                    <span style="font-size:0.78rem; color:var(--text-3); margin-left:8px;">Order #${order.id}</span>
                </div>
                <span class="order-total">₹${order.grand_total}</span>
            </div>

            <p style="font-size:0.82rem; color:var(--text-2); margin:4px 0 8px 0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                <strong>${itemCountText}</strong> · ${escapeHtml(itemSummary)}
            </p>

            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                <div class="badge-row">
                    <span class="badge ${stColor}">${order.status}</span>
                    <span class="badge ${pyColor}">Pay: ${order.payment_status}</span>
                    <span class="badge badge-gray">${order.fulfillment_type === 'delivery' ? 'Delivery' : 'Pickup'}</span>
                </div>

                <div style="display:flex; gap:6px;">
                    <button class="btn btn-secondary" style="font-size:0.78rem; padding:5px 10px;" onclick="openOrderDetailModal(${order.id})">
                        View Order
                    </button>
                    <button class="btn btn-secondary" style="font-size:0.78rem; padding:5px 10px;" onclick="openChatModal(${order.id})">
                        Chat
                    </button>
                    ${isPayable ? `
                        <button class="btn btn-primary" style="font-size:0.78rem; padding:5px 10px;" onclick="openPaymentModal(${order.id})">
                            Pay Now
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `
}

/* ================================================
   ORDER DETAIL MODAL
================================================ */

function openOrderDetailModal(orderId) {
    const order = globalOrders.find(o => o.id === orderId)
    if (!order) return

    const modal = document.getElementById("order-detail-modal")
    const title = document.getElementById("detail-modal-title")
    const body = document.getElementById("detail-modal-body")

    title.textContent = `Order #${order.id} — ${order.store_name || 'Seller'}`

    let itemsHtml = (order.items || []).map(item => `
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem; padding:6px 0; border-bottom:1px solid var(--border);">
            <div>
                <strong>${escapeHtml(item.name)}</strong>
                <span style="font-size:0.78rem; color:var(--text-3); margin-left:6px;">× ${item.quantity}</span>
            </div>
            <strong>₹${(parseFloat(item.price) * item.quantity).toFixed(2)}</strong>
        </div>
    `).join("")

    let locationHtml = ""
    if (order.fulfillment_type === 'delivery') {
        const buyerLoc = [order.buyer_year, escapeHtml(order.buyer_hostel_name || 'Campus Hostel'), 'Room ' + escapeHtml(order.buyer_room || order.buyer_room_number || '-')].filter(Boolean).join(' · ')
        locationHtml = `
            <div class="info-card" style="background:var(--bg-3); padding:10px 12px; border-radius:var(--radius-md); margin-top:10px; font-size:0.82rem;">
                <div style="color:var(--text-2);"><strong>Delivery Location:</strong> ${buyerLoc}</div>
                <div style="color:var(--text-3); font-size:0.78rem; margin-top:2px;">Seller: ${escapeHtml(order.seller_hostel_name || 'Campus Hostel')}</div>
            </div>
        `
    } else {
        locationHtml = `
            <div class="info-card" style="background:var(--bg-3); padding:10px 12px; border-radius:var(--radius-md); margin-top:10px; font-size:0.82rem;">
                <div style="color:var(--text-2);"><strong>Pickup Location:</strong> ${escapeHtml(order.seller_hostel_name || 'Campus Hostel')} · Room ${escapeHtml(order.seller_room || '-')}</div>
            </div>
        `
    }

    const isPayable = order.payment_status === "pending" || order.payment_status === "rejected"

    body.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:12px;">
            <!-- Order Meta -->
            <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-2); padding:10px 12px; border-radius:var(--radius-md);">
                <div>
                    <span class="badge badge-blue" style="margin-right:6px;">${order.status}</span>
                    <span class="badge ${isPayable ? 'badge-orange' : 'badge-green'}">Pay: ${order.payment_status}</span>
                </div>
                <span style="font-size:0.8rem; color:var(--text-3);">${order.fulfillment_type === 'delivery' ? 'Room Delivery' : 'Pickup Order'}</span>
            </div>

            <!-- Items Section -->
            <div>
                <h4 style="font-size:0.85rem; color:var(--text-2); margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">Purchased Items</h4>
                ${itemsHtml}
            </div>

            <!-- Totals Breakdown -->
            <div style="background:var(--bg-3); padding:12px; border-radius:var(--radius-md); font-size:0.85rem;">
                <div style="display:flex; justify-content:space-between; margin-bottom:4px; color:var(--text-2);">
                    <span>Items Total</span>
                    <span>₹${order.items_total}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:6px; color:var(--text-2);">
                    <span>Delivery Charge</span>
                    <span>₹${order.delivery_charge}</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-weight:700; font-size:0.95rem; color:var(--text-1); border-top:1px solid var(--border); padding-top:6px;">
                    <span>Grand Total</span>
                    <span style="color:var(--brand);">₹${order.grand_total}</span>
                </div>
            </div>

            <!-- Fulfillment Location -->
            ${locationHtml}

            <!-- Actions -->
            <div style="display:flex; gap:8px; margin-top:8px;">
                <button class="btn btn-secondary" style="flex:1;" onclick="closeOrderDetailModal(); openChatModal(${order.id})">
                    Open Chat &amp; Negotiation
                </button>
                ${isPayable ? `
                    <button class="btn btn-primary" style="flex:1;" onclick="closeOrderDetailModal(); openPaymentModal(${order.id})">
                        Pay Now
                    </button>
                ` : ''}
            </div>
        </div>
    `

    modal.style.display = "flex"
}

function closeOrderDetailModal() {
    document.getElementById("order-detail-modal").style.display = "none"
}

/* ================================================
   PAYMENT MODAL (3-Step Interface)
================================================ */

function openPaymentModal(orderId) {
    const order = globalOrders.find(o => o.id === orderId)
    if (!order) return

    const modal = document.getElementById("payment-modal")
    const title = document.getElementById("payment-modal-title")
    const body = document.getElementById("payment-modal-body")

    title.textContent = `Pay Order #${order.id}`

    const qrHtml = order.upi_qr_url
        ? `<div style="text-align:center; margin:10px 0;"><img src="${mediaUrl(order.upi_qr_url)}" alt="UPI QR Code" style="max-width:160px; height:auto; border-radius:8px; border:1px solid var(--border);"></div>`
        : `<p style="color:var(--text-3); font-size:0.8rem; margin:6px 0;">No QR code uploaded by seller. Please transfer to UPI ID below.</p>`

    body.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:12px;">
            <!-- Step 1: Pay Details -->
            <div style="background:var(--bg-3); border-radius:var(--radius-md); padding:12px;">
                <span class="badge badge-brand" style="margin-bottom:6px;">Step 1 · Transfer Amount</span>
                <p style="font-size:0.85rem; margin:6px 0 2px 0;">Send exactly <strong>₹${order.grand_total}</strong> to:</p>
                <div style="font-size:0.95rem; font-weight:700; color:var(--brand); word-break:break-all;">${escapeHtml(order.upi_id || "Not configured by seller")}</div>
                ${qrHtml}
            </div>

            <!-- Step 2: UTR Reference -->
            <div style="background:var(--bg-3); border-radius:var(--radius-md); padding:12px;">
                <span class="badge badge-gray" style="margin-bottom:6px;">Step 2 · UTR / Reference ID</span>
                <input id="utr-${order.id}" class="input-field" placeholder="12-digit UTR / UPI Transaction ID (optional)" style="margin-top:6px; margin-bottom:0;">
            </div>

            <!-- Step 3: Screenshot Upload -->
            <div style="background:var(--bg-3); border-radius:var(--radius-md); padding:12px;">
                <span class="badge badge-gray" style="margin-bottom:6px;">Step 3 · Payment Screenshot</span>
                <input id="ss-${order.id}" class="input-field" type="file" accept="image/png,image/jpeg,image/webp" style="margin-top:6px; margin-bottom:0;">
            </div>

            <!-- Submit Button -->
            <button class="btn btn-primary btn-full" style="padding:10px;" onclick="submitPayment(${order.id})">
                Submit Payment Proof
            </button>
        </div>
    `

    modal.style.display = "flex"
}

function closePaymentModal() {
    document.getElementById("payment-modal").style.display = "none"
}

function submitPayment(orderId) {
    const utrInput = document.getElementById("utr-" + orderId)
    const ssInput  = document.getElementById("ss-" + orderId)

    const utr  = utrInput ? utrInput.value.trim() : ""
    const file = ssInput ? ssInput.files[0] : null

    if (!file) {
        toast("Please upload a payment screenshot", "error")
        return
    }

    const formData = new FormData()
    formData.append("payment_utr", utr)
    formData.append("payment_screenshot", file)

    fetch(API + "/api/orders/" + orderId + "/pay", {
        method: "POST",
        headers: authUploadHeaders(),
        body: formData
    })
    .then(r => r.json())
    .then(data => {
        toast(data.message, data.success ? "success" : "error")
        if (data.success) {
            closePaymentModal()
            closeOrderDetailModal()
            loadBuyerOrders()
        }
    })
    .catch(() => {
        toast("Failed to submit payment proof", "error")
    })
}

/* ================================================
   CHAT & NEGOTIATION MODAL
================================================ */

function openChatModal(orderId) {
    const order = globalOrders.find(item => item.id === orderId)
    const storeName = order ? order.store_name : "Seller"
    currentChatOrderId = orderId
    document.getElementById("chat-modal-title").textContent = `Order #${orderId} Chat (${storeName})`
    document.getElementById("chat-modal").style.display = "flex"
    document.getElementById("offer-input-fields").style.display = "none"
    loadChatMessages()
}

function closeChatModal() {
    document.getElementById("chat-modal").style.display = "none"
    currentChatOrderId = null
}

function toggleOfferInputs() {
    const box = document.getElementById("offer-input-fields")
    box.style.display = box.style.display === "none" ? "block" : "none"
}

function loadChatMessages() {
    if (!currentChatOrderId) return
    const msgBox = document.getElementById("chat-messages-box")
    const contextBox = document.getElementById("chat-context-box")
    const sellerOfferBar = document.getElementById("seller-offer-bar")
    const composer = document.getElementById("chat-composer")

    msgBox.innerHTML = `<p style="text-align:center; color:var(--text-3); font-size:0.8rem;">Loading conversation…</p>`

    fetch(API + "/api/orders/" + currentChatOrderId + "/messages", {
        headers: authHeaders()
    })
    .then(r => {
        if (r.status === 401) {
            msgBox.innerHTML = `<p style="color:var(--red); text-align:center;">Authentication required. Please log in again.</p>`
            throw new Error("401")
        }
        if (r.status === 403) {
            msgBox.innerHTML = `<p style="color:var(--red); text-align:center;">You are not authorized to access this conversation.</p>`
            throw new Error("403")
        }
        return r.json()
    })
    .then(data => {
        if (!data || !data.success) {
            msgBox.innerHTML = `<p style="color:var(--red); text-align:center;">${escapeHtml(data.message || "Unable to load chat. Please try again.")}</p>`
            return
        }

        const o = data.order || {}

        // Render context header
        let locText = ""
        if (o.fulfillment_type === 'delivery') {
            if (data.is_seller && o.buyer_location) {
                locText = `<strong>Deliver to:</strong> ${[o.buyer_location.year, escapeHtml(o.buyer_location.hostel_name || 'Campus Hostel'), 'Room ' + escapeHtml(o.buyer_location.room_number || '-')].filter(Boolean).join(' · ')}`
            } else {
                locText = `<strong>Fulfillment:</strong> Room Delivery (Seller: ${escapeHtml(o.seller_location ? o.seller_location.hostel_name : 'Campus Hostel')})`
            }
        } else {
            locText = `<strong>Pickup Location:</strong> ${escapeHtml(o.seller_location ? o.seller_location.hostel_name : 'Campus Hostel')} · Room ${escapeHtml(o.seller_location ? o.seller_location.room_number : '-')}`
        }

        contextBox.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
                <span>${locText}</span>
                <strong style="color:var(--brand);">Total: ₹${o.grand_total}</strong>
            </div>
        `

        // Item selection for offers
        const items = data.items || []
        const itemSelect = document.getElementById("offer-item-select")
        if (itemSelect) {
            itemSelect.innerHTML = items.map(it => `<option value="${it.id}">${escapeHtml(it.name)} (Current: ₹${it.price})</option>`).join("")
        }

        // Show/hide seller offer button
        if (data.is_seller && (o.payment_status === "pending" || o.payment_status === "rejected") && !data.is_read_only) {
            sellerOfferBar.style.display = "block"
        } else {
            sellerOfferBar.style.display = "none"
        }

        // Show/hide composer if read only
        if (data.is_read_only) {
            composer.style.display = "none"
        } else {
            composer.style.display = "flex"
        }

        // Render messages & offers
        const currentUserId = Number(localStorage.getItem("user_id") || 0)
        const messages = data.messages || []
        const offers = data.offers || []

        if (messages.length === 0 && offers.length === 0) {
            msgBox.innerHTML = `<p style="text-align:center; color:var(--text-3); font-size:0.8rem;">No messages yet. Send a message to coordinate delivery!</p>`
            return
        }

        let html = ""

        const pendingOffers = offers.filter(of => of.status === 'pending')

        messages.forEach(m => {
            const isMe = Number(m.sender_id) === currentUserId
            const roleBadge = m.sender_role ? `<span style="font-weight:normal; opacity:0.75;">(${m.sender_role})</span>` : ""

            html += `
                <div class="chat-bubble ${isMe ? 'chat-bubble-me' : 'chat-bubble-them'}">
                    <div class="chat-sender">${escapeHtml(m.sender_name || 'User')} ${roleBadge}</div>
                    ${escapeHtml(m.message)}
                </div>
            `
        })

        // Every pending offer stays visible. Offers can target different order items.
        if (pendingOffers.length > 0) {
            const isBuyer = !!data.is_buyer
            html += pendingOffers.map(offer => `
                <div class="offer-card">
                    <div class="offer-card-header">
                        <span>Custom Price Offer: ${escapeHtml(offer.item_name || 'Item')}</span>
                        <span class="badge badge-orange">Pending</span>
                    </div>
                    <div style="margin-bottom:8px;">
                        Offered Unit Price: <span class="offer-price-tag">₹${offer.offered_price}</span>
                        <span class="offer-orig-price">₹${offer.original_price}</span>
                        ${offer.message ? `<br><small style="color:var(--text-2); font-style:italic;">"${escapeHtml(offer.message)}"</small>` : ""}
                    </div>
                    ${
                        isBuyer && (o.payment_status === "pending" || o.payment_status === "rejected")
                        ? `<div style="display:flex; gap:8px; margin-top:8px;">
                            <button class="btn btn-success" style="font-size:0.78rem; padding:4px 10px;" onclick="acceptCustomOffer(${offer.id})">Accept Offer</button>
                            <button class="btn btn-danger" style="font-size:0.78rem; padding:4px 10px;" onclick="rejectCustomOffer(${offer.id})">Decline</button>
                           </div>`
                        : `<p style="font-size:0.75rem; color:var(--text-3); margin:0;">Waiting for response…</p>`
                    }
                </div>
            `).join("")
        }

        msgBox.innerHTML = html
        msgBox.scrollTop = msgBox.scrollHeight
    })
    .catch(err => {
        if (err.message !== "401" && err.message !== "403") {
            msgBox.innerHTML = `<p style="color:var(--red); font-size:0.8rem; text-align:center;">Unable to load chat. Please try again.</p>`
        }
    })
}

function sendChatMessage() {
    if (!currentChatOrderId) return
    const input = document.getElementById("chat-input")
    const msg = input.value.trim()
    if (!msg) return

    fetch(API + "/api/orders/" + currentChatOrderId + "/messages", {
        method: "POST",
        headers: {
            ...authHeaders(),
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: msg })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            input.value = ""
            loadChatMessages()
        } else {
            toast(data.message, "error")
        }
    })
    .catch(() => {
        toast("Failed to send message", "error")
    })
}

function acceptCustomOffer(offerId) {
    if (!currentChatOrderId) return
    fetch(API + "/api/orders/" + currentChatOrderId + "/offers/" + offerId + "/accept", {
        method: "PUT",
        headers: authHeaders()
    })
    .then(r => r.json())
    .then(data => {
        toast(data.message, data.success ? "success" : "error")
        if (data.success) {
            loadChatMessages()
            loadBuyerOrders()
        }
    })
    .catch(() => {
        toast("Failed to accept offer", "error")
    })
}

function rejectCustomOffer(offerId) {
    if (!currentChatOrderId) return
    fetch(API + "/api/orders/" + currentChatOrderId + "/offers/" + offerId + "/reject", {
        method: "PUT",
        headers: authHeaders()
    })
    .then(r => r.json())
    .then(data => {
        toast(data.message, data.success ? "success" : "error")
        if (data.success) {
            loadChatMessages()
        }
    })
    .catch(() => {
        toast("Failed to decline offer", "error")
    })
}

document.addEventListener("DOMContentLoaded", loadBuyerOrders)
