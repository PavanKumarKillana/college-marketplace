/* orders.js — Compact Marketplace Orders & Chat */

requireLogin()

let globalOrders = []

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
                    <span class="empty-icon">📭</span>
                    <p>No orders yet. <a href="index.html">Go shop something!</a></p>
                </div>
            `
            return
        }

        globalOrders = data
        box.innerHTML = data.map(order => renderCompactOrderCard(order)).join("")
    })
    .catch(() => {
        box.innerHTML = `<div class="empty-state"><span class="empty-icon">📡</span><p>Could not load orders.</p></div>`
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
    const itemSummary = (order.items || []).map(i => `${i.name} × ${i.quantity}`).join(", ") || "Order items"

    return `
        <div class="compact-order-card">
            <div class="compact-order-header">
                <div>
                    <strong style="font-size:0.95rem; color:var(--text-1);">🏪 ${escapeHtml(order.store_name || "Campus Seller")}</strong>
                    <span style="font-size:0.78rem; color:var(--text-2); margin-left:8px;">Order #${order.id}</span>
                </div>
                <span class="order-total">₹${order.grand_total}</span>
            </div>

            <p style="font-size:0.82rem; color:var(--text-2); margin-bottom:8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${escapeHtml(itemSummary)}
            </p>

            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                <div class="badge-row">
                    <span class="badge ${stColor}">📦 ${order.status}</span>
                    <span class="badge ${pyColor}">💳 Pay: ${order.payment_status}</span>
                    <span class="badge badge-gray">${order.fulfillment_type === 'delivery' ? '🛵 Delivery' : '🏃 Pickup'}</span>
                </div>

                <div style="display:flex; gap:6px;">
                    <button class="btn btn-secondary" style="font-size:0.78rem; padding:5px 10px;" onclick="openOrderDetailModal(${order.id})">
                        📋 Details
                    </button>
                    <button class="btn btn-primary" style="font-size:0.78rem; padding:5px 10px;" onclick="openChatModal(${order.id}, '${escapeHtml(order.store_name || 'Seller')}')">
                        💬 Chat &amp; Negotiate
                    </button>
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

    title.textContent = `📋 Order #${order.id} — ${order.store_name || 'Seller'}`

    let itemsHtml = (order.items || []).map(item => `
        <div style="display:flex; justify-content:space-between; font-size:0.85rem; padding:4px 0; border-bottom:1px solid var(--border);">
            <span>• ${escapeHtml(item.name)} × ${item.quantity}</span>
            <strong>₹${item.price}</strong>
        </div>
    `).join("")

    let locationHtml = ""
    if (order.fulfillment_type === 'delivery') {
        const buyerLoc = [order.buyer_year, escapeHtml(order.buyer_hostel_name || 'Campus Hostel'), 'Room ' + escapeHtml(order.buyer_room || order.buyer_room_number || '-')].filter(Boolean).join(' • ')
        locationHtml = `<p style="font-size:0.82rem; color:var(--text-2); margin-top:8px;">
            🛵 <strong>Deliver to (Your location):</strong> ${buyerLoc}<br>
            🏃 <strong>Pickup from (Seller):</strong> ${escapeHtml(order.seller_hostel_name || 'Campus Hostel')}
        </p>`
    } else {
        locationHtml = `<p style="font-size:0.82rem; color:var(--text-2); margin-top:8px;">
            🏃 <strong>Pickup Location:</strong> ${escapeHtml(order.seller_hostel_name || 'Campus Hostel')} • Room ${escapeHtml(order.seller_room || '-')}
        </p>`
    }

    let payFormHtml = ""
    if (order.payment_status === "pending" || order.payment_status === "rejected") {
        const qrHtml = order.upi_qr_url
            ? `<div class="qr-box"><img src="${mediaUrl(order.upi_qr_url)}" alt="UPI QR"></div>`
            : `<p style="color:var(--text-3); font-size:0.8rem;">No QR code provided by seller.</p>`

        payFormHtml = `
            <div style="background:var(--bg-3); border-radius:var(--radius-md); padding:14px; margin-top:14px;">
                <p style="font-weight:700; margin-bottom:8px;">💳 Pay to Complete Order</p>
                <p style="font-size:0.82rem; color:var(--text-2); margin-bottom:6px;">
                    <strong>Step 1:</strong> Send <strong>₹${order.grand_total}</strong> to UPI: <strong style="color:var(--brand);">${escapeHtml(order.upi_id || "Not set")}</strong>
                </p>
                ${qrHtml}
                <span class="input-label">Step 2: UPI Transaction ID / UTR <span style="color:var(--text-3);">(optional)</span></span>
                <input id="utr-${order.id}" class="input-field" placeholder="UTR number (optional)">

                <span class="input-label">Payment Screenshot <strong style="color:var(--red);">(required)</strong></span>
                <input id="ss-${order.id}" class="input-field" type="file" accept="image/png,image/jpeg,image/webp">

                <button class="btn btn-primary btn-full" style="margin-top:10px;" onclick="submitPayment(${order.id})">
                    📤 Submit Payment Proof
                </button>
            </div>
        `
    } else if (order.payment_status === "submitted") {
        payFormHtml = `
            <div style="background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.2); border-radius:var(--radius-md); padding:12px; margin-top:14px;">
                <p style="color:#818cf8; font-size:0.85rem; margin:0;">
                    ⏳ Payment proof submitted ${order.payment_utr ? `(UTR: ${order.payment_utr})` : ""}<br>Waiting for seller verification.
                </p>
            </div>
        `
    } else if (order.payment_status === "verified") {
        payFormHtml = `
            <div style="background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.2); border-radius:var(--radius-md); padding:12px; margin-top:14px;">
                <p style="color:var(--green); font-size:0.85rem; margin:0;">✅ Payment verified by seller!</p>
            </div>
        `
    }

    body.innerHTML = `
        <div style="margin-bottom:12px;">
            <p style="font-weight:600; margin-bottom:6px;">Items Ordered:</p>
            ${itemsHtml}
            <div style="display:flex; justify-content:space-between; font-size:0.82rem; color:var(--text-2); margin-top:8px;">
                <span>Items: ₹${order.items_total}</span>
                <span>Delivery: ₹${order.delivery_charge}</span>
                <strong style="color:var(--text-1);">Total: ₹${order.grand_total}</strong>
            </div>
        </div>
        ${locationHtml}
        ${payFormHtml}
    `

    modal.style.display = "flex"
}

function closeOrderDetailModal() {
    document.getElementById("order-detail-modal").style.display = "none"
}

/* ================================================
   ORDER CHAT & NEGOTIATION HANDLERS
================================================ */

let currentChatOrderId = null
let currentChatIsSeller = false

function openChatModal(orderId, storeName) {
    currentChatOrderId = orderId
    document.getElementById("chat-modal-title").textContent = `💬 Order #${orderId} Chat`
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
            msgBox.innerHTML = `<p style="color:var(--red); text-align:center;">🚫 You are not authorized to access this order conversation.</p>`
            throw new Error("403")
        }
        return r.json()
    })
    .then(data => {
        if (!data || !data.success) {
            msgBox.innerHTML = `<p style="color:var(--red); text-align:center;">${escapeHtml(data.message || "Failed to load chat.")}</p>`
            return
        }

        const o = data.order || {}
        currentChatIsSeller = !!data.is_seller

        // Render context header
        let locText = ""
        if (o.fulfillment_type === 'delivery') {
            if (data.is_seller && o.buyer_location) {
                locText = `🛵 <strong>Deliver to:</strong> ${[o.buyer_location.year, escapeHtml(o.buyer_location.hostel_name || 'Campus Hostel'), 'Room ' + escapeHtml(o.buyer_location.room_number || '-')].filter(Boolean).join(' • ')}`
            } else {
                locText = `🛵 <strong>Fulfillment:</strong> Room Delivery (Seller: ${escapeHtml(o.seller_location ? o.seller_location.hostel_name : 'Campus Hostel')})`
            }
        } else {
            locText = `🏃 <strong>Pickup Location:</strong> ${escapeHtml(o.seller_location ? o.seller_location.hostel_name : 'Campus Hostel')} • Room ${escapeHtml(o.seller_location ? o.seller_location.room_number : '-')}`
        }

        contextBox.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
                <span>${locText}</span>
                <strong style="color:var(--brand);">Total: ₹${o.grand_total}</strong>
            </div>
        `

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
            msgBox.innerHTML = `<p style="text-align:center; color:var(--text-3); font-size:0.8rem;">No messages yet. Send a message to coordinate delivery or ask about products!</p>`
            return
        }

        let html = ""

        // Map offers by ID/order
        const pendingOffers = offers.filter(of => of.status === 'pending')

        messages.forEach(m => {
            const isMe = m.sender_id === currentUserId
            const roleBadge = m.sender_role ? `<span style="font-weight:normal; opacity:0.75;">(${m.sender_role})</span>` : ""

            html += `
                <div class="chat-bubble ${isMe ? 'chat-bubble-me' : 'chat-bubble-them'}">
                    <div class="chat-sender">${escapeHtml(m.sender_name || 'User')} ${roleBadge}</div>
                    ${escapeHtml(m.message)}
                </div>
            `
        })

        // Append active pending offer card if any
        if (pendingOffers.length > 0) {
            const latestOffer = pendingOffers[0]
            const isBuyer = data.is_buyer

            html += `
                <div class="offer-card">
                    <div class="offer-card-header">
                        <span>🏷️ Custom Price Offer: ${escapeHtml(latestOffer.item_name || 'Item')}</span>
                        <span class="badge badge-orange">Pending</span>
                    </div>
                    <div style="margin-bottom:8px;">
                        Offered Unit Price: <span class="offer-price-tag">₹${latestOffer.offered_price}</span>
                        <span class="offer-orig-price">₹${latestOffer.original_price}</span>
                        ${latestOffer.message ? `<br><small style="color:var(--text-2); font-style:italic;">"${escapeHtml(latestOffer.message)}"</small>` : ""}
                    </div>
                    ${
                        isBuyer && (o.payment_status === "pending" || o.payment_status === "rejected")
                        ? `<div style="display:flex; gap:8px; margin-top:8px;">
                            <button class="btn btn-success" style="font-size:0.78rem; padding:4px 10px;" onclick="acceptCustomOffer(${latestOffer.id})">✅ Accept Offer</button>
                            <button class="btn btn-danger" style="font-size:0.78rem; padding:4px 10px;" onclick="rejectCustomOffer(${latestOffer.id})">❌ Decline</button>
                           </div>`
                        : `<p style="font-size:0.75rem; color:var(--text-3); margin:0;">Waiting for buyer response…</p>`
                    }
                </div>
            `
        }

        msgBox.innerHTML = html
        msgBox.scrollTop = msgBox.scrollHeight
    })
    .catch(err => {
        if (err.message !== "401" && err.message !== "403") {
            msgBox.innerHTML = `<p style="color:var(--red); font-size:0.8rem; text-align:center;">Network error — Could not load messages.</p>`
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
    .catch(() => toast("Failed to send message", "error"))
}

function sendCustomOffer() {
    if (!currentChatOrderId) return
    const priceInput = document.getElementById("offer-price-input")
    const noteInput = document.getElementById("offer-note-input")
    const price = parseFloat(priceInput.value)
    const note = noteInput.value.trim()

    if (isNaN(price) || price <= 0) {
        toast("Please enter a valid offered price", "error")
        return
    }

    fetch(API + "/api/orders/" + currentChatOrderId + "/offers", {
        method: "POST",
        headers: {
            ...authHeaders(),
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ offered_price: price, message: note })
    })
    .then(r => r.json())
    .then(data => {
        toast(data.message, data.success ? "success" : "error")
        if (data.success) {
            priceInput.value = ""
            noteInput.value = ""
            document.getElementById("offer-input-fields").style.display = "none"
            loadChatMessages()
            loadBuyerOrders()
        }
    })
    .catch(() => toast("Failed to send offer", "error"))
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
    .catch(() => toast("Failed to accept offer", "error"))
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
    .catch(() => toast("Failed to reject offer", "error"))
}

/* ================================================
   PAYMENT PROOF SUBMISSION
================================================ */

function submitPayment(orderId) {
    const utr = (document.getElementById("utr-" + orderId).value || "").trim()
    const screenshot = document.getElementById("ss-" + orderId).files[0]

    if (!screenshot) {
        toast("Please upload your payment screenshot", "error")
        return
    }

    const formData = new FormData()
    formData.append("payment_utr", utr)
    formData.append("payment_screenshot", screenshot)

    fetch(API + "/api/orders/" + orderId + "/pay", {
        method: "POST",
        headers: { "authorization": getToken() },
        body: formData
    })
    .then(r => r.json())
    .then(data => {
        toast(data.message, data.success ? "success" : "error")
        if (data.success) {
            closeOrderDetailModal()
            loadBuyerOrders()
        }
    })
    .catch(() => toast("Failed to submit payment", "error"))
}

// Initial load
loadBuyerOrders()
