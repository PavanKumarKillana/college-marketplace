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
        localStorage.setItem("is_seller", isSeller ? "1" : "0")
        if (me.role) localStorage.setItem("role", me.role)
        setupNav(isSeller, me.role || "buyer")
    })
    .catch(() => {
        setupNav(localStorage.getItem("is_seller") === "1", localStorage.getItem("role") || "buyer")
    })

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
function productCard(p) {
    const imgHtml = p.image_url
        ? `<img class="product-img" src="${mediaUrl(p.image_url)}" alt="${p.name}">`
        : `<span class="product-img-placeholder">🍟</span>`
    const shop    = p.store_name || "Unknown Shop"
    const inStock = Number(p.stock) > 0
    const delBadge = p.delivery_available
        ? `<span class="badge badge-blue">🛵 Delivery</span>`
        : `<span class="badge badge-gray">🏃 Pickup only</span>`
    const stockBadge = inStock
        ? `<span class="badge badge-green">In stock: ${p.stock}</span>`
        : `<span class="badge badge-red">Sold out</span>`
    const deliveryChargeHtml = p.delivery_available && Number(p.delivery_charge) > 0
        ? `<p class="product-meta">+ ₹${p.delivery_charge} delivery</p>` : ""

    return `<div class="product-card">
        <div class="product-image-frame">${imgHtml}</div>
        <div class="product-body">
            <h2>${p.name}</h2>
            <p class="price">₹${p.price}</p>
            <div class="rating-row">${starRating(p.avg_rating)}</div>
            <p class="product-meta">🏪 ${shop}${p.seller_room ? " · Room " + p.seller_room : ""}</p>
            ${deliveryChargeHtml}
            <div class="badge-row">${stockBadge} ${delBadge}</div>
            <div class="product-actions" style="margin-top:10px;">
                <button class="btn btn-primary" onclick="addtoCart(${p.id})" ${inStock ? "" : "disabled"}>
                    🛒 Add
                </button>
                <a class="btn btn-secondary" href="product.html?id=${p.id}"
                   style="display:flex; align-items:center; justify-content:center;">
                    Details
                </a>
            </div>
        </div>
    </div>`
}

/* ── Categories ────────────────────────────── */
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
}

/* ── Products ──────────────────────────────── */
function loadProducts() {
    const container = document.getElementById("products-container")
    container.innerHTML = `<div class="spinner-wrap" style="grid-column:1/-1;"><div class="spinner"></div><p>Loading…</p></div>`

    const search   = document.getElementById("search-box").value
    const category = document.getElementById("category-box").value
    let url = API + "/api/products?search=" + encodeURIComponent(search)
    if (category) url += "&category=" + encodeURIComponent(category)

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
            data.forEach(p => { container.innerHTML += productCard(p) })
        })
        .catch(() => {
            container.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
                <span class="empty-icon">📡</span>
                <p>Backend server is offline. Start it with <code>npm run dev</code></p>
            </div>`
        })
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
