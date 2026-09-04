/* seller.js — Sectioned Seller Dashboard, Inventory, Orders & Chat */

requireLogin()

let globalSellerOrders = []
let globalSellerProducts = []
let currentChatOrderId = null

function switchSellerTab(tabName) {
    const sections = ["overview", "products", "orders", "settings"]
    sections.forEach(sec => {
        const el = document.getElementById("sec-" + sec)
        const tab = document.getElementById("tab-" + sec)
        if (el) el.style.display = sec === tabName ? "block" : "none"
        if (tab) {
            if (sec === tabName) tab.classList.add("active")
            else tab.classList.remove("active")
        }
    })
}

function openProductFormModal(product = null) {
    const modal = document.getElementById("product-form-modal")
    const title = document.getElementById("product-modal-title")
    if (product) {
        title.textContent = "Edit Product"
        document.getElementById("edit-id").value = product.id
        document.getElementById("p-name").value = product.name || ""
        document.getElementById("p-price").value = product.price || ""
        document.getElementById("p-desc").value = product.description || ""
        document.getElementById("p-cat").value = product.category || ""
        document.getElementById("p-stock").value = product.stock || ""
        document.getElementById("p-delivery-charge").value = product.delivery_charge || 0
        document.getElementById("p-pickup").checked = Number(product.pickup_available) === 1
        document.getElementById("p-delivery").checked = Number(product.delivery_available) === 1
        showExistingImage("p-image-preview", "p-image-wrap", product.image_url)
    } else {
        title.textContent = "Add New Product"
        clearProductForm()
    }
    modal.style.display = "flex"
}

function closeProductFormModal() {
    document.getElementById("product-form-modal").style.display = "none"
}

function clearProductForm() {
    document.getElementById("edit-id").value = ""
    document.getElementById("p-name").value = ""
    document.getElementById("p-price").value = ""
    document.getElementById("p-desc").value = ""
    document.getElementById("p-cat").value = ""
    document.getElementById("p-stock").value = ""
    document.getElementById("p-delivery-charge").value = ""
    document.getElementById("p-image").value = ""
    document.getElementById("p-pickup").checked = true
    document.getElementById("p-delivery").checked = true
    const wrap = document.getElementById("p-image-wrap")
    if (wrap) wrap.classList.remove("visible")
}

function loadShop() {
    fetch(API + "/api/sellers/me", { headers: authHeaders() })
        .then(r => r.json())
        .then(data => {
            if (data && data.id) {
                document.getElementById("store-name").value = data.store_name || ""
                document.getElementById("store-room").value = data.room_number || ""
                document.getElementById("upi-id").value     = data.upi_id || ""

                const statStore = document.getElementById("stat-store-name")
                if (statStore) statStore.textContent = data.store_name || "My Shop"

                showExistingImage("upi-qr-preview", "upi-qr-wrap", data.upi_qr_url)
            }
        })
        .catch(() => toast("Could not load shop settings", "error"))
}

function saveShop() {
    const store_name = document.getElementById("store-name").value.trim()
    const room_number = document.getElementById("store-room").value.trim()
    const upi_id = document.getElementById("upi-id").value.trim()
    const qrFile = document.getElementById("upi-qr").files[0]

    if (!store_name) {
        toast("Store name is required", "error")
        return
    }

    const formData = new FormData()
    formData.append("store_name", store_name)
    formData.append("room_number", room_number)
    formData.append("upi_id", upi_id)
    if (qrFile) formData.append("upi_qr_image", qrFile)

    fetch(API + "/api/sellers/me", {
        method: "PUT",
        headers: authUploadHeaders(),
        body: formData
    })
    .then(r => r.json())
    .then(data => {
        toast(data.message, data.success ? "success" : "error")
        if (data.success) {
            localStorage.setItem("is_seller", "1")
            loadShop()
        }
    })
    .catch(() => {
        toast("Failed to save shop settings", "error")
    })
}

function loadMyProducts() {
    fetch(API + "/api/products/mine/list", { headers: authHeaders() })
        .then(r => r.json())
        .then(data => {
            const box = document.getElementById("my-products")
            const statProducts = document.getElementById("stat-products-count")
            box.innerHTML = ""

            if (!Array.isArray(data) || data.length === 0) {
                box.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><p style="color:var(--text-3);">No products added yet. Click "+ Add New Product" above.</p></div>`
                if (statProducts) statProducts.textContent = "0"
                return
            }

            globalSellerProducts = data
            if (statProducts) statProducts.textContent = String(data.length)

            data.forEach(p => {
                const img = p.image_url
                    ? `<img src="${mediaUrl(p.image_url)}" alt="${escapeHtml(p.name)}" class="product-img">`
                    : `<span class="product-img-placeholder">No image</span>`

                box.innerHTML += `
                    <div class="product-card">
                        <div class="product-image-frame">${img}</div>
                        <div class="product-body">
                            <span class="product-category">${escapeHtml(p.category || "General")}</span>
                            <div class="card-title">${escapeHtml(p.name)}</div>
                            <div class="card-price">₹${p.price}</div>
                            <div style="font-size:0.78rem; color:var(--text-2); margin-bottom:8px;">Stock: ${p.stock} units</div>

                            <div style="display:flex; gap:6px; margin-top:auto;">
                                <button class="btn btn-secondary" style="flex:1; font-size:0.78rem; padding:4px 8px;" onclick="editProduct(${p.id})">Edit</button>
                                <button class="btn btn-danger" style="flex:1; font-size:0.78rem; padding:4px 8px;" onclick="deleteProduct(${p.id})">Delete</button>
                            </div>
                        </div>
                    </div>
                `
            })
        })
        .catch(() => {
            document.getElementById("my-products").innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><p>Could not load products.</p></div>`
        })
}

function editProduct(id) {
    const product = globalSellerProducts.find(p => p.id === id)
    if (product) openProductFormModal(product)
}

function saveProduct() {
    const editId = document.getElementById("edit-id").value
    const name = document.getElementById("p-name").value.trim()
    const price = document.getElementById("p-price").value.trim()
    const description = document.getElementById("p-desc").value.trim()
    const category = document.getElementById("p-cat").value.trim()
    const stock = document.getElementById("p-stock").value.trim()
    const delivery_charge = document.getElementById("p-delivery-charge").value.trim()
    const imageFile = document.getElementById("p-image").files[0]
    const pickup_available = document.getElementById("p-pickup").checked ? "1" : "0"
    const delivery_available = document.getElementById("p-delivery").checked ? "1" : "0"

    if (!name || !price) {
        toast("Name and price are required", "error")
        return
    }

    const formData = new FormData()
    formData.append("name", name)
    formData.append("price", price)
    formData.append("description", description)
    formData.append("category", category)
    formData.append("stock", stock || 0)
    formData.append("delivery_charge", delivery_charge || 0)
    formData.append("pickup_available", pickup_available)
    formData.append("delivery_available", delivery_available)

    if (imageFile) formData.append("product_image", imageFile)

    const url = editId ? API + "/api/products/" + editId : API + "/api/products"
    const method = editId ? "PUT" : "POST"

    fetch(url, {
        method,
        headers: authUploadHeaders(),
        body: formData
    })
    .then(r => r.json())
    .then(result => {
        toast(result.message, result.success ? "success" : "error")
        if (result.success) {
            closeProductFormModal()
            clearProductForm()
            loadMyProducts()
        }
    })
    .catch(() => {
        toast("Failed to save product", "error")
    })
}

function deleteProduct(id) {
    if (!confirm("Delete this product listing?")) return
    fetch(API + "/api/products/" + id, {
        method: "DELETE",
        headers: authHeaders()
    })
    .then(r => r.json())
    .then(data => {
        toast(data.message, data.success ? "success" : "error")
        loadMyProducts()
    })
    .catch(() => toast("Failed to delete product", "error"))
}

function loadOrders(silent = false) {
    fetch(API + "/api/orders/seller/list", { headers: authHeaders() })
        .then(r => r.json())
        .then(data => {
            if (!Array.isArray(data)) return;
            
            // Check if there's a new order when silently polling
            if (silent && data.length > globalSellerOrders.length) {
                toast("🔔 New order received!", "success");
            }
            
            globalSellerOrders = data
            const box = document.getElementById("seller-orders")
            const overviewBox = document.getElementById("overview-orders-preview")
            const statOrders = document.getElementById("stat-orders-count")

            if (!silent) {
                box.innerHTML = ""
                if (overviewBox) overviewBox.innerHTML = ""
            }

            if (data.length === 0) {
                const emptyHtml = `<div class="empty-state" style="padding:20px 0;"><p style="color:var(--text-3);">No incoming orders yet.</p></div>`
                box.innerHTML = emptyHtml
                if (overviewBox) overviewBox.innerHTML = emptyHtml
                if (statOrders) statOrders.textContent = "0"
                return
            }
            if (statOrders) statOrders.textContent = String(data.length)

            data.forEach((order, index) => {
                const statusColors = { pending:"badge-orange", confirmed:"badge-blue", ready:"badge-green", completed:"badge-green", cancelled:"badge-red" }
                const stColor = statusColors[order.status] || "badge-gray"
                const itemSummary = (order.items || []).map(i => `${i.name} × ${i.quantity}`).join(", ") || "Order items"

                const cardHtml = `
                    <div class="compact-order-card">
                        <div class="compact-order-header">
                            <div>
                                <strong style="font-size:0.95rem; color:var(--text-1);">Order #${order.id} — ${escapeHtml(order.buyer_name || order.buyer_email || 'Buyer')}</strong>
                            </div>
                            <span class="order-total">₹${order.grand_total}</span>
                        </div>

                        <p style="font-size:0.82rem; color:var(--text-2); margin-bottom:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                            ${escapeHtml(itemSummary)}
                        </p>

                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                            <div class="badge-row">
                                <span class="badge ${stColor}">${order.status}</span>
                                <span class="badge badge-gray">Pay: ${order.payment_status}</span>
                            </div>

                            <div style="display:flex; gap:6px;">
                                <button class="btn btn-secondary" style="font-size:0.78rem; padding:5px 10px;" onclick="openOrderDetailModal(${order.id})">
                                    Details
                                </button>
                                <button class="btn btn-primary" style="font-size:0.78rem; padding:5px 10px;" onclick="openChatModal(${order.id})">
                                    Chat with Buyer
                                </button>
                            </div>
                        </div>
                    </div>
                `

                box.innerHTML += cardHtml
                if (overviewBox && index < 3) overviewBox.innerHTML += cardHtml
            })
        })
        .catch(() => {
            const errorHtml = `<div class="empty-state" style="padding:20px 0;"><p>Could not load orders.</p></div>`
            document.getElementById("seller-orders").innerHTML = errorHtml
            document.getElementById("overview-orders-preview").innerHTML = errorHtml
        })
}

function openOrderDetailModal(orderId) {
    const order = globalSellerOrders.find(o => o.id === orderId)
    if (!order) return

    const modal = document.getElementById("order-detail-modal")
    const title = document.getElementById("detail-modal-title")
    const body = document.getElementById("detail-modal-body")

    title.textContent = `Incoming Order #${order.id}`

    let itemsHtml = (order.items || []).map(item => `
        <div style="display:flex; justify-content:space-between; font-size:0.85rem; padding:6px 0; border-bottom:1px solid var(--border);">
            <span>${escapeHtml(item.name)} × ${item.quantity}</span>
            <strong>₹${(parseFloat(item.price) * item.quantity).toFixed(2)}</strong>
        </div>
    `).join("")

    let payActions = ""
    if (order.payment_status === "submitted") {
        payActions = `
            <div style="background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.2); border-radius:var(--radius-md); padding:12px; margin-top:12px;">
                <p style="font-size:0.85rem; margin:0 0 8px 0; color:var(--text-1);">
                    <strong>Payment Proof Received</strong> ${order.payment_utr ? `(UTR: ${escapeHtml(order.payment_utr)})` : ""}
                </p>
                ${
                    order.payment_screenshot_url
                    ? `<div style="margin-bottom:10px;"><a href="${mediaUrl(order.payment_screenshot_url)}" target="_blank" style="font-size:0.8rem; color:var(--brand); text-decoration:underline;">View Uploaded Screenshot</a></div>`
                    : ''
                }
                <div style="display:flex; gap:8px;">
                    <button class="btn btn-success" style="flex:1; font-size:0.8rem;" onclick="verifyPay(${order.id})">Verify Payment</button>
                    <button class="btn btn-danger" style="flex:1; font-size:0.8rem;" onclick="rejectPay(${order.id})">Reject Payment</button>
                </div>
            </div>
        `
    }

    const fulfillmentDetails = order.fulfillment_type === "delivery"
        ? `<div style="background:var(--bg-3); padding:10px 12px; border-radius:var(--radius-md); font-size:0.84rem;">
                <strong>Delivery location:</strong> ${[escapeHtml(order.buyer_year || ""), escapeHtml(order.buyer_hostel_name || "Campus Hostel"), "Room " + escapeHtml(order.buyer_room || order.buyer_room_number || "-")].filter(Boolean).join(" · ")}
           </div>`
        : `<div style="background:var(--bg-3); padding:10px 12px; border-radius:var(--radius-md); font-size:0.84rem;">
                <strong>Pickup:</strong> Buyer collects from your store.
           </div>`

    let statusSelectHtml = `
        <div style="margin-top:12px; background:var(--bg-3); padding:12px; border-radius:var(--radius-md);">
            <span class="input-label">Update Order Status</span>
            <div style="display:flex; gap:8px; margin-top:4px;">
                <select id="status-select-${order.id}" class="input-field" style="margin:0; font-size:0.82rem; flex:1;">
                    <option value="pending" ${order.status==='pending'?'selected':''}>Pending</option>
                    <option value="confirmed" ${order.status==='confirmed'?'selected':''}>Confirmed</option>
                    <option value="ready" ${order.status==='ready'?'selected':''}>Ready / Dispatched</option>
                    <option value="completed" ${order.status==='completed'?'selected':''}>Completed</option>
                    <option value="cancelled" ${order.status==='cancelled'?'selected':''}>Cancelled</option>
                </select>
                <button class="btn btn-primary" style="font-size:0.8rem; padding:6px 12px;" onclick="updateOrderStatus(${order.id})">Update</button>
            </div>
        </div>
    `

    body.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:10px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong>Buyer:</strong> ${escapeHtml(order.buyer_name || order.buyer_email || 'Buyer')}<br>
                    <span style="font-size:0.78rem; color:var(--text-3);">${order.fulfillment_type === 'delivery' ? 'Delivery Order' : 'Pickup Order'}</span>
                </div>
                <div style="text-align:right;">
                    <span class="badge badge-brand">₹${order.grand_total}</span>
                </div>
            </div>

            <div style="margin-top:6px;">
                <h4 style="font-size:0.82rem; color:var(--text-2); margin-bottom:4px; text-transform:uppercase;">Order Items</h4>
                ${itemsHtml}
            </div>

            ${fulfillmentDetails}
            ${payActions}
            ${statusSelectHtml}

            <button class="btn btn-secondary" style="margin-top:10px;" onclick="closeOrderDetailModal(); openChatModal(${order.id})">
                Open Chat with Buyer
            </button>
        </div>
    `

    modal.style.display = "flex"
}

function closeOrderDetailModal() {
    document.getElementById("order-detail-modal").style.display = "none"
}

function openChatModal(orderId) {
    const order = globalSellerOrders.find(item => item.id === orderId)
    const buyerName = order ? (order.buyer_name || order.buyer_email || "Buyer") : "Buyer"
    currentChatOrderId = orderId
    document.getElementById("chat-modal-title").textContent = `Order #${orderId} Chat (${buyerName})`
    document.getElementById("chat-modal").style.display = "flex"
    document.getElementById("offer-input-fields").style.display = "none"
    loadChatMessages()

    if (window.chatPollInterval) clearInterval(window.chatPollInterval)
    window.chatPollInterval = setInterval(() => {
        if (document.getElementById("chat-modal").style.display !== "none") {
            loadChatMessages(true)
        } else {
            clearInterval(window.chatPollInterval)
        }
    }, 5000)
}

function closeChatModal() {
    document.getElementById("chat-modal").style.display = "none"
    currentChatOrderId = null
    if (window.chatPollInterval) clearInterval(window.chatPollInterval)
}

function toggleOfferInputs() {
    const box = document.getElementById("offer-input-fields")
    box.style.display = box.style.display === "none" ? "block" : "none"
}

function loadChatMessages(silent = false) {
    if (!currentChatOrderId) return
    const msgBox = document.getElementById("chat-messages-box")
    const contextBox = document.getElementById("chat-context-box")
    const sellerOfferBar = document.getElementById("seller-offer-bar")
    const composer = document.getElementById("chat-composer")

    if (!silent) {
        msgBox.innerHTML = `<p style="text-align:center; color:var(--text-3); font-size:0.8rem;">Loading conversation…</p>`
    }

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
        let locText = ""
        if (o.fulfillment_type === 'delivery' && o.buyer_location) {
            locText = `<strong>Deliver to:</strong> ${[o.buyer_location.year, escapeHtml(o.buyer_location.hostel_name || 'Campus Hostel'), 'Room ' + escapeHtml(o.buyer_location.room_number || '-')].filter(Boolean).join(' · ')}`
        } else {
            locText = `<strong>Pickup Order</strong> (Your location: ${escapeHtml(o.seller_location ? o.seller_location.hostel_name : 'Campus Hostel')} · Room ${escapeHtml(o.seller_location ? o.seller_location.room_number : '-')})`
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

        if (data.is_seller && (o.payment_status === "pending" || o.payment_status === "rejected") && !data.is_read_only) {
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
            const isMe = Number(m.sender_id) === currentUserId
            const roleBadge = m.sender_role ? `<span style="font-weight:normal; opacity:0.75;">(${m.sender_role})</span>` : ""

            html += `
                <div class="chat-bubble ${isMe ? 'chat-bubble-me' : 'chat-bubble-them'}">
                    <div class="chat-sender">${escapeHtml(m.sender_name || 'User')} ${roleBadge}</div>
                    ${escapeHtml(m.message)}
                </div>
            `
        })

        if (pendingOffers.length > 0) {
            html += pendingOffers.map(offer => `
                <div class="offer-card">
                    <div class="offer-card-header">
                        <span>Sent Offer: ${escapeHtml(offer.item_name || 'Item')}</span>
                        <span class="badge badge-orange">Pending Buyer Acceptance</span>
                    </div>
                    <div>
                        Offered Unit Price: <span class="offer-price-tag">₹${offer.offered_price}</span>
                        <span class="offer-orig-price">₹${offer.original_price}</span>
                        ${offer.message ? `<br><small style="color:var(--text-2); font-style:italic;">"${escapeHtml(offer.message)}"</small>` : ""}
                    </div>
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
    .catch(() => {
        toast("Failed to send offer", "error")
    })
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

function updateOrderStatus(id) {
    const sel = document.getElementById("status-select-" + id)
    if (!sel) return
    fetch(API + "/api/orders/" + id + "/status", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ status: sel.value })
    }).then(r => r.json()).then(data => {
        toast(data.message, data.success ? "success" : "error")
        closeOrderDetailModal()
        loadOrders()
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

document.addEventListener("DOMContentLoaded", () => {
    const pImg = document.getElementById("p-image")
    if (pImg) pImg.addEventListener("change", () => previewSelectedImage("p-image", "p-image-preview", "p-image-wrap"))

    const uQr = document.getElementById("upi-qr")
    if (uQr) uQr.addEventListener("change", () => previewSelectedImage("upi-qr", "upi-qr-preview", "upi-qr-wrap"))

    loadShop()
    loadMyProducts()
    loadOrders()

    // Poll for new orders every 30 seconds
    setInterval(() => {
        const secOrders = document.getElementById("seller-sec-orders")
        const secOverview = document.getElementById("seller-sec-overview")
        if (secOrders && secOverview && (secOrders.style.display !== "none" || secOverview.style.display !== "none")) {
            loadOrders(true) // Silent check
        }
    }, 30000)
})
