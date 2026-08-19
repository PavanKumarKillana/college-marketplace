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

function loadOrders() {
    fetch(API + "/api/orders/seller/list", { headers: authHeaders() })
        .then(r => r.json())
        .then(data => {
            const box = document.getElementById("seller-orders")
            box.innerHTML = ""
            if (!Array.isArray(data) || data.length === 0) {
                box.innerHTML = `<div class="empty-state" style="padding:30px 0;">
                    <span class="empty-icon">📭</span><p>No orders yet.</p></div>`
                return
            }
            data.forEach(order => {
                let itemsHtml = ""
                ;(order.items || []).forEach(item => {
                    itemsHtml += `<p style="font-size:0.83rem; color:var(--text-2);">• ${item.name} × ${item.quantity}</p>`
                })

                let payActions = ""
                if (order.payment_status === "submitted") {
                    payActions = `
                        <p style="font-size:0.83rem;">UTR: <strong>${order.payment_utr}</strong></p>
                        ${order.payment_screenshot_url ? `<a href="${mediaUrl(order.payment_screenshot_url)}" target="_blank" class="btn btn-secondary" style="margin-bottom:6px; font-size:0.8rem;">View Screenshot</a>` : ""}
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:6px;">
                            <button class="btn btn-success" onclick="verifyPay(${order.id})">✅ Verify Payment</button>
                            <button class="btn btn-danger"  onclick="rejectPay(${order.id})">❌ Reject</button>
                        </div>`
                } else if (order.payment_status === "verified") {
                    payActions = `<p style="color:var(--green); font-size:0.83rem;">✅ Payment verified</p>`
                } else {
                    payActions = `<p style="color:var(--text-3); font-size:0.83rem;">⏳ Waiting for buyer payment…</p>`
                }

                const statusColors = { pending:"badge-orange", confirmed:"badge-blue", ready:"badge-green", completed:"badge-green", cancelled:"badge-red" }
                const stColor = statusColors[order.status] || "badge-gray"

                box.innerHTML += `<div class="order-card">
                    <div class="order-card-header">
                        <div>
                            <p class="order-store">Order #${order.id} — ${order.buyer_name || order.buyer_email}</p>
                            <p class="order-meta">${order.fulfillment_type}${order.buyer_room_number ? " → Room " + order.buyer_room_number : ""}</p>
                        </div>
                        <span class="order-total">₹${order.grand_total}</span>
                    </div>
                    <div class="badge-row" style="margin-bottom:10px;">
                        <span class="badge ${stColor}">${order.status}</span>
                        <span class="badge badge-gray">Pay: ${order.payment_status}</span>
                    </div>
                    ${itemsHtml}
                    <hr class="order-divider">
                    ${payActions}
                    <hr class="order-divider" style="margin:10px 0;">
                    <div style="display:flex; gap:8px; align-items:center;">
                        <select id="st-${order.id}" class="input-field" style="margin:0; flex:1;">
                            <option>pending</option>
                            <option>confirmed</option>
                            <option>ready</option>
                            <option>completed</option>
                            <option>cancelled</option>
                        </select>
                        <button class="btn btn-primary" style="white-space:nowrap;" onclick="setStatus(${order.id})">
                            Update Status
                        </button>
                    </div>
                </div>`

                // Pre-select current status
                const sel = document.getElementById("st-" + order.id)
                if (sel) {
                    const opt = Array.from(sel.options).find(o => o.value === order.status)
                    if (opt) opt.selected = true
                }
            })
        })
}

function verifyPay(id) {
    fetch(API + "/api/orders/" + id + "/verify-payment", {
        method: "POST", headers: authHeaders()
    }).then(r => r.json()).then(data => { toast(data.message, data.success ? "success" : "error"); loadOrders() })
}

function rejectPay(id) {
    fetch(API + "/api/orders/" + id + "/reject-payment", {
        method: "POST", headers: authHeaders()
    }).then(r => r.json()).then(data => { toast(data.message, data.success ? "success" : "error"); loadOrders() })
}

function setStatus(id) {
    fetch(API + "/api/orders/" + id + "/status", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ status: document.getElementById("st-" + id).value })
    }).then(r => r.json()).then(data => { toast(data.message, data.success ? "success" : "error"); loadOrders() })
}

loadShop()
loadMyProducts()
loadOrders()
