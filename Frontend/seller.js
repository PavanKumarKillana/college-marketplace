/* seller.js */
requireLogin()

// Redirect non-sellers
fetch(API + "/api/users/me", { headers: authHeaders() })
    .then(r => r.json())
    .then(me => {
        if (!me.is_seller) {
            toast("Become a seller first from the Home page.", "error")
            setTimeout(() => { window.location.href = "index.html" }, 1500)
        }
    })

function productPayload() {
    return {
        name:              document.getElementById("p-name").value,
        price:             document.getElementById("p-price").value,
        description:       document.getElementById("p-desc").value,
        category:          document.getElementById("p-cat").value,
        stock:             document.getElementById("p-stock").value,
        delivery_charge:   document.getElementById("p-delivery-charge").value,
        pickup_available:  document.getElementById("p-pickup").checked  ? 1 : 0,
        delivery_available:document.getElementById("p-delivery").checked ? 1 : 0
    }
}

function loadShop() {
    fetch(API + "/api/sellers/me", { headers: authHeaders() })
        .then(r => r.json())
        .then(data => {
            if (!data.id) return
            document.getElementById("store-name").value = data.store_name || ""
            document.getElementById("store-room").value = data.room_number || ""
            document.getElementById("upi-id").value     = data.upi_id     || ""
            showExistingImage("upi-qr-preview", "upi-qr-wrap", data.upi_qr_url)
        })
}

function saveShop() {
    const formData = new FormData()
    formData.append("store_name", document.getElementById("store-name").value)
    formData.append("room_number", document.getElementById("store-room").value)
    formData.append("upi_id",     document.getElementById("upi-id").value)
    const qrFile = document.getElementById("upi-qr").files[0]
    if (qrFile) formData.append("upi_qr_image", qrFile)

    fetch(API + "/api/sellers/me", {
        method: "PUT",
        headers: { "authorization": getToken() },
        body: formData
    })
    .then(r => r.json())
    .then(data => toast(data.message, data.success ? "success" : "error"))
}

let myProducts = []

function loadMyProducts() {
    fetch(API + "/api/products/mine/list", { headers: authHeaders() })
        .then(r => r.json())
        .then(data => {
            const box = document.getElementById("my-products")
            box.innerHTML = ""
            if (!Array.isArray(data) || data.length === 0) {
                box.innerHTML = `<div class="empty-state" style="grid-column:1/-1; padding:30px 0;">
                    <span class="empty-icon">📦</span>
                    <p>No products yet. Add your first snack above!</p>
                </div>`
                return
            }
            myProducts = data
            data.forEach(p => {
                const imgHtml = p.image_url
                    ? `<img src="${mediaUrl(p.image_url)}" style="width:100%; height:100px; object-fit:cover; border-radius:8px; margin-bottom:8px;">`
                    : `<div style="height:60px; display:flex; align-items:center; justify-content:center; font-size:2rem; opacity:0.3; margin-bottom:8px;">🍟</div>`
                const statusBadge = p.is_active
                    ? `<span class="badge badge-green">Live</span>`
                    : `<span class="badge badge-gray">Hidden</span>`

                box.innerHTML += `<div class="card" style="padding:14px;">
                    ${imgHtml}
                    <h3 style="font-size:0.9rem; font-weight:700; margin-bottom:4px;">${p.name}</h3>
                    <p style="font-size:0.82rem; color:var(--brand); font-weight:700; margin-bottom:4px;">₹${p.price}</p>
                    <div class="badge-row" style="margin-bottom:10px;">
                        ${statusBadge}
                        <span class="badge badge-gray">Stock: ${p.stock}</span>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
                        <button class="btn btn-secondary" style="font-size:0.78rem; padding:7px;" onclick="fillProductById(${p.id})">✏️ Edit</button>
                        <button class="btn btn-danger"    style="font-size:0.78rem; padding:7px;" onclick="deleteProduct(${p.id})">🗑️ Delete</button>
                    </div>
                </div>`
            })
        })
}

function fillProductById(id) {
    const p = myProducts.find(item => item.id === id)
    if (!p) return
    fillProduct(p)
}

function fillProduct(p) {
    document.getElementById("edit-id").value              = p.id
    document.getElementById("p-name").value               = p.name         || ""
    document.getElementById("p-price").value              = p.price        || ""
    document.getElementById("p-desc").value               = p.description  || ""
    document.getElementById("p-cat").value                = p.category     || ""
    document.getElementById("p-stock").value              = p.stock        || 0
    document.getElementById("p-delivery-charge").value    = p.delivery_charge || 0
    document.getElementById("p-pickup").checked           = !!Number(p.pickup_available)
    document.getElementById("p-delivery").checked         = !!Number(p.delivery_available)
    showExistingImage("p-image-preview", "p-image-wrap", p.image_url)
    window.scrollTo({ top: 0, behavior: "smooth" })
}

function clearProductForm() {
    document.getElementById("edit-id").value = ""
    ;["p-name","p-price","p-desc","p-cat","p-stock","p-delivery-charge"].forEach(id => {
        document.getElementById(id).value = ""
    })
    document.getElementById("p-pickup").checked   = true
    document.getElementById("p-delivery").checked = true
    const wrap = document.getElementById("p-image-wrap")
    if (wrap) wrap.classList.remove("visible")
}

function saveProduct() {
    const id     = document.getElementById("edit-id").value
    const method = id ? "PUT" : "POST"
    const url    = id ? API + "/api/products/" + id : API + "/api/products"

    const formData = new FormData()
    const data = productPayload()
    Object.keys(data).forEach(key => formData.append(key, data[key]))
    const imageFile = document.getElementById("p-image").files[0]
    if (imageFile) formData.append("product_image", imageFile)

    fetch(url, {
        method,
        headers: { "authorization": getToken() },
        body: formData
    })
    .then(r => r.json())
    .then(result => {
        toast(result.message, result.success ? "success" : "error")
        if (result.success) {
            clearProductForm()
            loadMyProducts()
        }
    })
}

function showExistingImage(imgId, wrapId, imagePath) {
    const img  = document.getElementById(imgId)
    const wrap = document.getElementById(wrapId)
    if (!imagePath || !img || !wrap) {
        if (wrap) wrap.classList.remove("visible")
        return
    }
    img.src = mediaUrl(imagePath)
    wrap.classList.add("visible")
}

function previewSelectedImage(inputId, imgId, wrapId) {
    const file = document.getElementById(inputId).files[0]
    if (!file) return
    const img  = document.getElementById(imgId)
    const wrap = document.getElementById(wrapId)
    img.src = URL.createObjectURL(file)
    if (wrap) wrap.classList.add("visible")
}

document.getElementById("p-image").addEventListener("change", () => {
    previewSelectedImage("p-image", "p-image-preview", "p-image-wrap")
})
document.getElementById("upi-qr").addEventListener("change", () => {
    previewSelectedImage("upi-qr", "upi-qr-preview", "upi-qr-wrap")
})

function deleteProduct(id) {
    if (!confirm("Delete this product?")) return
    fetch(API + "/api/products/" + id, {
        method: "DELETE",
        headers: authHeaders()
    })
    .then(r => r.json())
    .then(data => {
        toast(data.message, data.success ? "success" : "error")
        loadMyProducts()
    })
}

let globalSellerOrders = []

function loadOrders() {
    fetch(API + "/api/orders/seller/list", { headers: authHeaders() })
        .then(r => r.json())
        .then(data => {
            const box = document.getElementById("seller-orders")
            box.innerHTML = ""
            if (!Array.isArray(data) || data.length === 0) {
                box.innerHTML = `<div class="empty-state" style="padding:30px 0;">
                    <span class="empty-icon">📭</span><p>No incoming orders yet.</p></div>`
                return
            }
            globalSellerOrders = data
            data.forEach(order => {
                const statusColors = { pending:"badge-orange", confirmed:"badge-blue", ready:"badge-green", completed:"badge-green", cancelled:"badge-red" }
                const stColor = statusColors[order.status] || "badge-gray"
                const itemSummary = (order.items || []).map(i => `${i.name} × ${i.quantity}`).join(", ") || "Order items"

                box.innerHTML += `<div class="compact-order-card">
                    <div class="compact-order-header">
                        <div>
                            <strong style="font-size:0.95rem; color:var(--text-1);">Order #${order.id} — ${escapeHtml(order.buyer_name || order.buyer_email || 'Buyer')}</strong>
                        </div>
                        <span class="order-total">₹${order.grand_total}</span>
                    </div>

                    <p style="font-size:0.82rem; color:var(--text-2); margin-bottom:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                        ${escapeHtml(itemSummary)}
                    </p>

                    <div style="font-size:0.8rem; color:var(--text-2); margin-bottom:8px;">
                        ${
                            order.fulfillment_type === 'delivery'
                            ? `🛵 <strong>Deliver to:</strong> ${[order.buyer_year, escapeHtml(order.buyer_hostel_name || 'Campus Hostel'), 'Room ' + escapeHtml(order.buyer_room || order.buyer_room_number || '-')].filter(v => v && v !== 'Room -').join(' • ')}`
                            : `🏃 <strong>Fulfillment:</strong> Pickup Order`
                        }
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                        <div class="badge-row">
                            <span class="badge ${stColor}">📦 ${order.status}</span>
                            <span class="badge badge-gray">Pay: ${order.payment_status}</span>
                        </div>

                        <div style="display:flex; gap:6px;">
                            <button class="btn btn-secondary" style="font-size:0.78rem; padding:5px 10px;" onclick="openOrderDetailModal(${order.id})">
                                📋 Details
                            </button>
                            <button class="btn btn-primary" style="font-size:0.78rem; padding:5px 10px;" onclick="openChatModal(${order.id}, '${escapeHtml(order.buyer_name || 'Buyer')}')">
                                💬 Chat with Buyer
                            </button>
                        </div>
                    </div>
                </div>`
            })
        })
}

function openOrderDetailModal(orderId) {
    const order = globalSellerOrders.find(o => o.id === orderId)
    if (!order) return

    const modal = document.getElementById("order-detail-modal")
    const title = document.getElementById("detail-modal-title")
    const body = document.getElementById("detail-modal-body")

    title.textContent = `📋 Incoming Order #${order.id}`

    let itemsHtml = (order.items || []).map(item => `
        <div style="display:flex; justify-content:space-between; font-size:0.85rem; padding:4px 0; border-bottom:1px solid var(--border);">
            <span>• ${escapeHtml(item.name)} × ${item.quantity}</span>
            <strong>₹${item.price}</strong>
        </div>
    `).join("")

    let payActions = ""
    if (order.payment_status === "submitted") {
        payActions = `
            <div style="background:var(--bg-3); padding:12px; border-radius:var(--radius-md); margin-top:12px;">
                <p style="font-size:0.85rem; font-weight:700; margin-bottom:6px;">💳 Payment Proof Submitted</p>
                <p style="font-size:0.82rem; margin-bottom:8px;">UTR / Txn ID: <strong>${escapeHtml(order.payment_utr || "Not provided")}</strong></p>
                ${order.payment_screenshot_url ? `<a href="${mediaUrl(order.payment_screenshot_url)}" target="_blank" class="btn btn-secondary" style="margin-bottom:10px; font-size:0.8rem; width:100%; display:inline-block; text-align:center;">🔍 View Payment Screenshot</a>` : ""}
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                    <button class="btn btn-success" onclick="verifyPay(${order.id})">✅ Verify Payment</button>
                    <button class="btn btn-danger"  onclick="rejectPay(${order.id})">❌ Reject</button>
                </div>
            </div>`
    } else if (order.payment_status === "verified") {
        payActions = `<p style="color:var(--green); font-size:0.85rem; margin-top:10px;">✅ Payment verified</p>`
    } else {
        payActions = `<p style="color:var(--text-3); font-size:0.85rem; margin-top:10px;">⏳ Waiting for buyer payment…</p>`
    }

    body.innerHTML = `
        <div style="margin-bottom:12px;">
            <p style="font-weight:600; margin-bottom:6px;">Items:</p>
            ${itemsHtml}
            <div style="display:flex; justify-content:space-between; font-size:0.82rem; color:var(--text-2); margin-top:8px;">
                <span>Items Total: ₹${order.items_total}</span>
                <span>Delivery: ₹${order.delivery_charge}</span>
                <strong style="color:var(--text-1);">Grand Total: ₹${order.grand_total}</strong>
            </div>
        </div>

        <div style="margin-top:12px; font-size:0.83rem;">
            ${
                order.fulfillment_type === 'delivery'
                ? `🛵 <strong>Delivery Destination:</strong> ${[order.buyer_year, escapeHtml(order.buyer_hostel_name || 'Campus Hostel'), 'Room ' + escapeHtml(order.buyer_room || order.buyer_room_number || '-')].filter(v => v && v !== 'Room -').join(' • ')}`
                : `🏃 <strong>Pickup Location:</strong> ${escapeHtml(order.seller_hostel_name || 'Campus Hostel')} • Room ${escapeHtml(order.seller_room || '-')}`
            }
        </div>

        ${payActions}

        <hr class="order-divider" style="margin:14px 0;">

        <div style="display:flex; gap:8px; align-items:center;">
            <label style="font-size:0.82rem; font-weight:600;">Status:</label>
            <select id="st-${order.id}" class="input-field" style="margin:0; flex:1;">
                <option value="pending">pending</option>
                <option value="confirmed">confirmed</option>
                <option value="ready">ready</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
            </select>
            <button class="btn btn-primary" style="white-space:nowrap;" onclick="setStatus(${order.id})">
                Update Status
            </button>
        </div>
    `

    const sel = document.getElementById("st-" + order.id)
    if (sel) {
        const opt = Array.from(sel.options).find(o => o.value === order.status)
        if (opt) opt.selected = true
    }

    modal.style.display = "flex"
}

function closeOrderDetailModal() {
    document.getElementById("order-detail-modal").style.display = "none"
}

/* Chat Modal for Seller */
let currentChatOrderId = null

function openChatModal(orderId, buyerName) {
    currentChatOrderId = orderId
    document.getElementById("chat-modal-title").textContent = `💬 Order #${orderId} Chat (${buyerName})`
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
    .then(r => r.json())
    .then(data => {
        if (!data || !data.success) {
            msgBox.innerHTML = `<p style="color:var(--red); text-align:center;">${escapeHtml(data.message || "Failed to load chat.")}</p>`
            return
        }

        const o = data.order || {}
        let locText = ""
        if (o.fulfillment_type === 'delivery' && o.buyer_location) {
            locText = `🛵 <strong>Deliver to:</strong> ${[o.buyer_location.year, escapeHtml(o.buyer_location.hostel_name || 'Campus Hostel'), 'Room ' + escapeHtml(o.buyer_location.room_number || '-')].filter(Boolean).join(' • ')}`
        } else {
            locText = `🏃 <strong>Pickup Order</strong> (Your location: ${escapeHtml(o.seller_location ? o.seller_location.hostel_name : 'Campus Hostel')} • Room ${escapeHtml(o.seller_location ? o.seller_location.room_number : '-')})`
        }

        contextBox.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
                <span>${locText}</span>
                <strong style="color:var(--brand);">Order Total: ₹${o.grand_total}</strong>
            </div>
        `

        const items = data.items || []
        const itemSelect = document.getElementById("offer-item-select")
        if (itemSelect) {
            itemSelect.innerHTML = items.map(it => `<option value="${it.id}">${escapeHtml(it.name)} (Current: ₹${it.price})</option>`).join("")
        }

        if ((o.payment_status === "pending" || o.payment_status === "rejected") && !data.is_read_only) {
            sellerOfferBar.style.display = "block"
        } else {
            sellerOfferBar.style.display = "none"
        }

        if (data.is_read_only) {
            composer.style.display = "none"
        } else {
            composer.style.display = "flex"
        }

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
            const isMe = m.sender_id === currentUserId
            const roleBadge = m.sender_role ? `<span style="font-weight:normal; opacity:0.75;">(${m.sender_role})</span>` : ""

            html += `
                <div class="chat-bubble ${isMe ? 'chat-bubble-me' : 'chat-bubble-them'}">
                    <div class="chat-sender">${escapeHtml(m.sender_name || 'User')} ${roleBadge}</div>
                    ${escapeHtml(m.message)}
                </div>
            `
        })

        if (pendingOffers.length > 0) {
            const latestOffer = pendingOffers[0]
            html += `
                <div class="offer-card">
                    <div class="offer-card-header">
                        <span>🏷️ Sent Offer: ${escapeHtml(latestOffer.item_name || 'Item')}</span>
                        <span class="badge badge-orange">Pending Buyer Acceptance</span>
                    </div>
                    <div>
                        Offered Unit Price: <span class="offer-price-tag">₹${latestOffer.offered_price}</span>
                        <span class="offer-orig-price">₹${latestOffer.original_price}</span>
                        ${latestOffer.message ? `<br><small style="color:var(--text-2); font-style:italic;">"${escapeHtml(latestOffer.message)}"</small>` : ""}
                    </div>
                </div>
            `
        }

        msgBox.innerHTML = html
        msgBox.scrollTop = msgBox.scrollHeight
    })
    .catch(() => {
        msgBox.innerHTML = `<p style="color:var(--red); font-size:0.8rem; text-align:center;">Network error.</p>`
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
    const itemSelect = document.getElementById("offer-item-select")
    const priceInput = document.getElementById("offer-price-input")
    const noteInput = document.getElementById("offer-note-input")

    const orderItemId = itemSelect ? parseInt(itemSelect.value) : null
    const price = parseFloat(priceInput.value)
    const note = noteInput.value.trim()

    if (!orderItemId) {
        toast("Please select an item to offer a discount on", "error")
        return
    }

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
        body: JSON.stringify({ order_item_id: orderItemId, offered_price: price, message: note })
    })
    .then(r => r.json())
    .then(data => {
        toast(data.message, data.success ? "success" : "error")
        if (data.success) {
            priceInput.value = ""
            noteInput.value = ""
            document.getElementById("offer-input-fields").style.display = "none"
            loadChatMessages()
            loadOrders()
        }
    })
    .catch(() => toast("Failed to send offer", "error"))
}

function verifyPay(id) {
    fetch(API + "/api/orders/" + id + "/verify-payment", {
        method: "POST", headers: authHeaders()
    }).then(r => r.json()).then(data => {
        toast(data.message, data.success ? "success" : "error")
        closeOrderDetailModal()
        loadOrders()
    })
}

function rejectPay(id) {
    fetch(API + "/api/orders/" + id + "/reject-payment", {
        method: "POST", headers: authHeaders()
    }).then(r => r.json()).then(data => {
        toast(data.message, data.success ? "success" : "error")
        closeOrderDetailModal()
        loadOrders()
    })
}

function setStatus(id) {
    fetch(API + "/api/orders/" + id + "/status", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ status: document.getElementById("st-" + id).value })
    }).then(r => r.json()).then(data => {
        toast(data.message, data.success ? "success" : "error")
        closeOrderDetailModal()
        loadOrders()
    })
}

loadShop()
loadMyProducts()
loadOrders()
