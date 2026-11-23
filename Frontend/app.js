/* app.js — Home page */
requireLogin()
refreshCartCount()

/* ── Nav setup ─────────────────────────────── */
function setupNav(isSeller, role) {
    const roleLabel = document.getElementById("role-label")
    if (roleLabel) {
        roleLabel.textContent = isSeller ? "👤 Seller & Shopper" : "👤 Shopper"
        roleLabel.style.display = "inline-block"
    }
    if (role === "admin") {
        const el = document.getElementById("admin-link")
        if (el) el.style.display = "inline"
    }
    if (isSeller) {
        const s = document.getElementById("seller-link")
        if (s) s.style.display = "inline"
        const b = document.getElementById("become-seller-btn")
        if (b) b.style.display = "none"
    } else {
        const b = document.getElementById("become-seller-btn")
        if (b) b.style.display = "inline-flex"
    }
}

fetch(API + "/api/users/me", { headers: authHeaders() })
    .then(r => r.json())
    .then(me => {
        const isSeller = !!me.is_seller
        if (me.id) localStorage.setItem("user_id", me.id)
        localStorage.setItem("is_seller", isSeller ? "1" : "0")
        if (me.role) localStorage.setItem("role", me.role)
        setupNav(isSeller, me.role || "buyer")

        // Show banner if user hasn't set hostel OR year yet
        const banner = document.getElementById("hostel-update-banner")
        if (banner && (!me.hostel_id || !me.year)) {
            banner.style.display = "block"
        } else if (banner) {
            banner.style.display = "none"
        }
    })
    .catch(() => {
        setupNav(localStorage.getItem("is_seller") === "1", localStorage.getItem("role") || "buyer")
    })

function promptSetHostel() {
    const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"]
    let yearMsg = "Select your Academic Year:\n\n"
    years.forEach((y, idx) => { yearMsg += `${idx + 1}. ${y}\n` })
    const yearChoice = prompt(yearMsg + "\nEnter number:")
    const yearNum = parseInt(yearChoice, 10)
    const selectedYear = (!isNaN(yearNum) && yearNum >= 1 && yearNum <= years.length)
        ? years[yearNum - 1]
        : null

    fetch(API + "/api/hostels")
        .then(r => r.json())
        .then(hostels => {
            if (!Array.isArray(hostels) || hostels.length === 0) {
                alert("No active hostels found. Please contact admin.")
                return
            }
            let msg = "Select your Hostel Building:\n\n"
            hostels.forEach((h, idx) => {
                msg += `${idx + 1}. ${h.name} (${h.code})\n`
            })
            const choice = prompt(msg + "\nEnter the number corresponding to your hostel:")
            const num = parseInt(choice, 10)
            if (isNaN(num) || num < 1 || num > hostels.length) {
                alert("Invalid selection.")
                return
            }
            const selectedHostel = hostels[num - 1]
            const room = prompt(`Selected: ${selectedHostel.name}\nEnter your Room Number (optional):`) || ""

            fetch(API + "/api/users/profile", {
                method: "PUT",
                headers: {
                    ...authHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ hostel_id: selectedHostel.id, room_number: room, year: selectedYear })
            })
            .then(r => r.json())
            .then(data => {
                toast(data.message, data.success ? "success" : "error")
                if (data.success) {
                    const banner = document.getElementById("hostel-update-banner")
                    if (banner) banner.style.display = "none"
                    loadProducts()
                }
            })
        })
        .catch(() => toast("Could not fetch hostel list", "error"))
}

/* ── Become seller ─────────────────────────── */
function becomeSeller() {
    const name = prompt("Your shop name (e.g. Room 214 Snacks):")
    if (!name) return
    const room = prompt("Your room number (optional):") || ""
    fetch(API + "/api/users/become-seller", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ store_name: name, room_number: room })
    })
    .then(r => r.json())
    .then(data => {
        toast(data.message || "Done", data.success ? "success" : "error")
        if (data.success && data.token) {
            localStorage.setItem("token", data.token)
            localStorage.setItem("role", data.role)
            localStorage.setItem("is_seller", "1")
            setTimeout(() => { window.location.href = "seller.html" }, 900)
        }
    })
}

/* ── Product card ──────────────────────────── */
let globalProducts = []

function productCard(p) {
    const imgHtml = p.image_url
        ? `<img class="product-img" src="${mediaUrl(p.image_url)}" alt="${p.name}">`
        : `<span class="product-img-placeholder">🍟</span>`
    const shop    = p.store_name || "Unknown Shop"
    const hostel  = p.hostel_name ? `📍 ${p.hostel_name}` : "📍 Campus Hostel"
    const inStock = Number(p.stock) > 0
    const delBadge = p.delivery_available
        ? `<span class="badge badge-blue">🛵 Delivery</span>`
        : `<span class="badge badge-gray">🏃 Pickup only</span>`
    const stockBadge = inStock
        ? `<span class="badge badge-green">In stock: ${p.stock}</span>`
        : `<span class="badge badge-red">Sold out</span>`
    const deliveryChargeHtml = p.delivery_available && Number(p.delivery_charge) > 0
        ? `<p class="product-meta">+ ₹${p.delivery_charge} delivery</p>` : ""

    const dateHtml = p.created_at ? `<div style="font-size:0.73rem; color:var(--text-3); margin-top:2px;">📅 Listed ${formatDate(p.created_at)}</div>` : ""

    return `<div class="product-card">
        <div class="product-image-frame" onclick="openProductDetailModal(${p.id})">${imgHtml}</div>
        <div class="product-body">
            <h2 onclick="openProductDetailModal(${p.id})">${escapeHtml(p.name)}</h2>
            <p class="price">₹${p.price}</p>
            <div class="rating-row">${starRating(p.avg_rating)}</div>
            <p class="product-meta">🏪 ${escapeHtml(shop)} | <strong style="color:var(--brand);">${escapeHtml(hostel)}</strong></p>
            ${deliveryChargeHtml}
            ${dateHtml}
            <div class="badge-row">${stockBadge} ${delBadge}</div>
            <div class="product-actions" style="margin-top:10px; display:flex; gap:6px;">
                <button class="btn btn-primary" style="flex:1;" onclick="addtoCart(${p.id})" ${inStock ? "" : "disabled"}>
                    🛒 Add
                </button>
                <button class="btn btn-secondary" style="padding:6px 10px;" onclick="openProductDetailModal(${p.id})" title="View Details">
                    👁️
                </button>
                <button class="btn btn-secondary" style="padding:6px 10px;" onclick="reportProduct(${p.id}, '${escapeHtml(p.name)}', ${p.seller_id})" title="Report item">
                    🚩
                </button>
            </div>
        </div>
    </div>`
}

function openProductDetailModal(productId) {
    const p = globalProducts.find(x => x.id === productId)
    if (!p) return

    const modal = document.getElementById("product-detail-modal")
    const title = document.getElementById("product-detail-title")
    const body = document.getElementById("product-detail-body")

    title.textContent = p.name

    const imgHtml = p.image_url
        ? `<img src="${mediaUrl(p.image_url)}" alt="${p.name}" style="max-height:220px; object-fit:contain; border-radius:var(--radius-md);">`
        : `<span style="font-size:4rem; opacity:0.3;">🍟</span>`

    const inStock = Number(p.stock) > 0

    body.innerHTML = `
        <div style="display:flex; justify-content:center; background:var(--bg-3); padding:16px; border-radius:var(--radius-md); margin-bottom:14px;">
            ${imgHtml}
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <h2 style="font-size:1.2rem; font-weight:800; margin:0;">${escapeHtml(p.name)}</h2>
            <span style="font-size:1.3rem; font-weight:800; color:var(--brand);">₹${p.price}</span>
        </div>
        <div class="rating-row" style="margin-bottom:8px;">${starRating(p.avg_rating)}</div>
        <p style="font-size:0.85rem; color:var(--text-2); margin-bottom:8px;">
            🏪 Store: <strong>${escapeHtml(p.store_name || "Campus Seller")}</strong><br>
            📍 Hostel Building: <strong style="color:var(--brand);">${escapeHtml(p.hostel_name || "Campus Hostel")}</strong>
            ${p.created_at ? `<br><span style="font-size:0.78rem; color:var(--text-3);">📅 Listed: ${formatDateTime(p.created_at)}</span>` : ""}
        </p>
        <p style="font-size:0.85rem; color:var(--text-1); margin-bottom:12px; background:var(--bg-3); padding:10px; border-radius:var(--radius-sm);">
            ${escapeHtml(p.description || "No description provided.")}
        </p>
        <div class="badge-row" style="margin-bottom:16px;">
            <span class="badge ${inStock ? 'badge-green' : 'badge-red'}">${inStock ? `In Stock: ${p.stock}` : 'Sold Out'}</span>
            <span class="badge ${p.delivery_available ? 'badge-blue' : 'badge-gray'}">${p.delivery_available ? '🛵 Room Delivery Available' : '🏃 Pickup Only'}</span>
            ${p.delivery_available && Number(p.delivery_charge) > 0 ? `<span class="badge badge-orange">+ ₹${p.delivery_charge} delivery</span>` : ''}
        </div>
        <div style="display:flex; gap:10px;">
            <button class="btn btn-primary btn-full" onclick="addtoCart(${p.id}); closeProductDetailModal();" ${inStock ? "" : "disabled"}>
                🛒 Add to Cart (₹${p.price})
            </button>
            <button class="btn btn-secondary" onclick="reportProduct(${p.id}, '${escapeHtml(p.name)}', ${p.seller_id})" title="Report item">
                🚩 Report
            </button>
        </div>
    `

    modal.style.display = "flex"
}

function closeProductDetailModal() {
    document.getElementById("product-detail-modal").style.display = "none"
}

/* ── Categories & Hostels ─────────────────── */
function loadCategories() {
    fetch(API + "/api/products/categories/list")
        .then(r => r.json())
        .then(data => {
            const box = document.getElementById("category-box")
            if (!Array.isArray(data)) return
            data.forEach(row => {
                box.innerHTML += `<option value="${row.category}">${row.category}</option>`
            })
        })
        .catch(() => {})

    fetch(API + "/api/hostels")
        .then(r => r.json())
        .then(hostels => {
            const hBox = document.getElementById("hostel-box")
            if (!hBox || !Array.isArray(hostels)) return
            hostels.forEach(h => {
                hBox.innerHTML += `<option value="${h.id}">📍 ${h.name} (${h.code})</option>`
            })
        })
        .catch(() => {})
}

/* ── Products ──────────────────────────────── */
function loadProducts() {
    const container = document.getElementById("products-container")
    container.innerHTML = `<div class="spinner-wrap" style="grid-column:1/-1;"><div class="spinner"></div><p>Loading…</p></div>`

    const search   = document.getElementById("search-box").value
    const category = document.getElementById("category-box").value
    const hostel   = document.getElementById("hostel-box") ? document.getElementById("hostel-box").value : ""
    let url = API + "/api/products?search=" + encodeURIComponent(search)
    if (category) url += "&category=" + encodeURIComponent(category)
    if (hostel) url += "&hostel=" + encodeURIComponent(hostel)

    fetch(url)
        .then(r => r.json())
        .then(data => {
            container.innerHTML = ""
            if (!Array.isArray(data)) {
                container.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
                    <span class="empty-icon">⚠️</span>
                    <p>Could not load products. Make sure the backend is running.</p>
                </div>`
                return
            }
            if (data.length === 0) {
                container.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
                    <span class="empty-icon">🍃</span>
                    <p>No items found. Try a different search!</p>
                </div>`
                return
            }
            globalProducts = data
            data.forEach(p => { container.innerHTML += productCard(p) })
        })
        .catch(() => {
            container.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
                <span class="empty-icon">📡</span>
                <p>Backend server is offline.</p>
            </div>`
        })
}

function reportProduct(productId, title, sellerId) {
    const reason = prompt(`Report listing "${title}":\nSelect/Type reason (e.g., Unauthorized item, Unsafe food, Misleading listing):`)
    if (!reason || !reason.trim()) return

    fetch(API + "/api/reports", {
        method: "POST",
        headers: {
            ...authHeaders(),
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ product_id: productId, seller_id: sellerId, reason: reason.trim() })
    })
    .then(r => r.json())
    .then(data => toast(data.message, data.success ? "success" : "error"))
    .catch(() => toast("Failed to submit report", "error"))
}

/* ── Add to cart ───────────────────────────── */
function addtoCart(productId) {
    fetch(API + "/api/cart", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ product_id: productId })
    })
    .then(r => r.json())
    .then(data => {
        toast(data.message, data.success ? "success" : "error")
        if (data.success) refreshCartCount()
    })
}

/* ── Cart panel toggle ─────────────────────── */
function viewCart() {
    const panel = document.getElementById("cart-panel")
    const cartList = document.getElementById("cart-list")
    if (panel.style.display === "block") {
        panel.style.display = "none"
        return
    }
    panel.style.display = "block"
    cartList.innerHTML  = `<div class="spinner-wrap"><div class="spinner"></div></div>`

    fetch(API + "/api/cart", { headers: authHeaders() })
        .then(r => r.json())
        .then(data => {
            cartList.innerHTML = ""
            if (!Array.isArray(data) || data.length === 0) {
                cartList.innerHTML = `<div class="empty-state" style="padding:20px 0;">
                    <span class="empty-icon">🛒</span><p>Your cart is empty!</p></div>`
                return
            }
            updateCartBadge(data.length)
            data.forEach(item => {
                cartList.innerHTML += `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <p class="cart-item-name">${item.name}</p>
                        <p class="cart-item-sub">${item.store_name || ""} · ₹${item.price} × ${item.quantity}</p>
                    </div>
                    <button class="btn btn-danger" style="padding:6px 12px; font-size:0.78rem;"
                            onclick="removeFromCart(${item.id})">Remove</button>
                </div>`
            })
        })
}

/* ── Remove from cart ──────────────────────── */
function removeFromCart(cartId) {
    fetch(API + "/api/cart/" + cartId, {
        method: "DELETE",
        headers: authHeaders()
    })
    .then(r => r.json())
    .then(data => {
        toast(data.message, data.success ? "success" : "error")
        document.getElementById("cart-panel").style.display = "none"
        viewCart()
        refreshCartCount()
    })
}

loadCategories()
loadProducts()
