requireLogin()

if (localStorage.getItem("role") !== "admin") {
    alert("Admin only")
    window.location.href = "index.html"
}

function switchAdminTab(tabName) {
    const sections = ["overview", "users", "products", "orders", "reports", "hostels"]
    sections.forEach(section => {
        const panel = document.getElementById("admin-sec-" + section)
        const tab = document.getElementById("admin-tab-" + section)
        if (panel) panel.hidden = section !== tabName
        if (tab) tab.classList.toggle("active", section === tabName)
    })

    const loaders = {
        users: loadUsers,
        products: loadProducts,
        orders: loadOrders,
        reports: loadReports,
        hostels: loadHostelsAdmin
    }
    if (loaders[tabName]) loaders[tabName]()
}

function setAdminStat(id, value) {
    const stat = document.getElementById(id)
    if (stat) stat.textContent = String(value)
}


/* =========================
   USERS
========================= */

function loadUsers() {
    fetch(API + "/api/admin/users", {
        headers: authHeaders()
    })
    .then(r => r.json())
    .then(data => {
        const box = document.getElementById("users")

        if (!Array.isArray(data)) {
            box.innerHTML = "<p>Unable to load users.</p>"
            return
        }

        if (data.length === 0) {
            setAdminStat("admin-stat-users", 0)
            box.innerHTML = "<p>No users found.</p>"
            return
        }

        setAdminStat("admin-stat-users", data.length)

        box.innerHTML = data.map(u => {
            const isBlocked = u.is_blocked === 1
            const isSeller = u.role === "seller" || u.seller_id
            const strikeCount = u.strike_count || 0
            const hostelDisp = u.hostel_name ? `${escapeHtml(u.hostel_name)} (${escapeHtml(u.hostel_code || '')})` : `<span style="color:#f59e0b;">Not set</span>`

            return `
                <div class="card" style="margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <div>
                        <strong>#${u.id}</strong> ${escapeHtml(u.name || "Unnamed")} (${escapeHtml(u.email)})<br>
                        Role: <strong>${escapeHtml(u.role || "-")}</strong> |
                        Year: <strong>${u.year ? escapeHtml(u.year) : '<span style="color:#f59e0b;">Not set</span>'}</strong> |
                        Hostel: <strong>${hostelDisp}</strong> |
                        Room: <strong>${escapeHtml(u.room_number || "-")}</strong><br>
                        Status: <strong style="color:${isBlocked ? 'var(--red)' : 'var(--green)'}">${isBlocked ? 'Suspended' : 'Active'}</strong>
                        ${
                            isSeller
                            ? ` | Shop: <strong>${escapeHtml(u.store_name || "Active")}</strong> | Strikes: <strong style="color:${strikeCount >= 3 ? 'var(--red)' : strikeCount > 0 ? '#f59e0b' : 'var(--green)'};">${strikeCount}/3</strong>`
                            : ''
                        }
                    </div>
                    <div style="display:flex; gap:6px; flex-wrap:wrap;">
                        <button class="cart-btn" style="background:var(--indigo); font-size:0.8rem; padding:6px 10px;" onclick="changeUserHostelAdmin(${u.id}, '${escapeHtml(u.name || u.email)}')">Edit location</button>
                        ${
                            isSeller && u.seller_id
                            ? `<button class="cart-btn" style="background:#f59e0b; font-size:0.8rem; padding:6px 10px;" onclick="issueSellerStrike(${u.seller_id}, '${escapeHtml(u.store_name || 'Seller')}')">Issue Strike</button>`
                            : ''
                        }
                        ${
                            isBlocked
                            ? `<button class="cart-btn" style="background:var(--green); font-size:0.8rem; padding:6px 12px;" onclick="toggleUserBlock(${u.id}, 0)">Unblock</button>`
                            : `<button class="cart-btn" style="background:#ff4b2b; font-size:0.8rem; padding:6px 12px;" onclick="toggleUserBlock(${u.id}, 1)">Block</button>`
                        }
                    </div>
                </div>
            `
        }).join("")
    })
    .catch(() => {
        document.getElementById("users").innerHTML = "<p>Failed to load users.</p>"
    })
}

function changeUserHostelAdmin(userId, userName) {
    const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"]
    let yearMsg = `Edit profile for ${userName}.\n\nSelect Academic Year:\n\n`
    years.forEach((y, idx) => { yearMsg += `${idx + 1}. ${y}\n` })
    yearMsg += `${years.length + 1}. Skip (keep existing year)\n`
    const yearChoice = prompt(yearMsg + "\nEnter number:")
    const yearNum = parseInt(yearChoice, 10)
    const selectedYear = (!isNaN(yearNum) && yearNum >= 1 && yearNum <= years.length)
        ? years[yearNum - 1]
        : undefined   // undefined = don't change year; only skip if explicitly chosen

    fetch(API + "/api/admin/hostels", { headers: authHeaders() })
        .then(r => r.json())
        .then(hostels => {
            if (!Array.isArray(hostels) || hostels.length === 0) {
                alert("No hostels found in database.")
                return
            }
            let msg = `Select Hostel Building for ${userName}:\n\n`
            hostels.forEach((h, idx) => {
                msg += `${idx + 1}. ${h.name} (${h.code})\n`
            })
            const choice = prompt(msg + "\nEnter hostel number:")
            const num = parseInt(choice, 10)
            if (isNaN(num) || num < 1 || num > hostels.length) {
                alert("Invalid hostel selection.")
                return
            }
            const selectedHostel = hostels[num - 1]
            const room = prompt(`Hostel: ${selectedHostel.name}\nEnter Room Number:`) || ""

            const payload = { hostel_id: selectedHostel.id, room_number: room }
            if (selectedYear !== undefined) payload.year = selectedYear

            fetch(API + "/api/admin/users/" + userId + "/hostel", {
                method: "PUT",
                headers: {
                    ...authHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            })
            .then(r => r.json())
            .then(data => {
                if (typeof toast === "function") toast(data.message, data.success ? "success" : "error")
                else alert(data.message)
                if (data.success) loadUsers()
            })
            .catch(() => alert("Failed to update user location"))
        })
}

function issueSellerStrike(sellerId, storeName) {
    const reason = prompt(`Enter reason for issuing strike to seller "${storeName}":`)
    if (!reason || !reason.trim()) return

    fetch(API + "/api/admin/sellers/" + sellerId + "/strike", {
        method: "POST",
        headers: {
            ...authHeaders(),
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ reason: reason.trim() })
    })
    .then(r => r.json())
    .then(data => {
        if (typeof toast === "function") {
            toast(data.message, data.success ? "success" : "error")
        } else {
            alert(data.message)
        }
        if (data.success) loadUsers()
    })
    .catch(() => alert("Failed to issue strike"))
}

function toggleUserBlock(userId, isBlocked) {
    const action = isBlocked ? "block/suspend" : "unblock"
    if (!confirm(`Are you sure you want to ${action} user #${userId}?`)) return

    fetch(API + "/api/admin/users/" + userId + "/block", {
        method: "PUT",
        headers: {
            ...authHeaders(),
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ is_blocked: isBlocked })
    })
    .then(r => r.json())
    .then(data => {
        if (typeof toast === "function") {
            toast(data.message, data.success ? "success" : "error")
        } else {
            alert(data.message)
        }
        if (data.success) loadUsers()
    })
    .catch(() => alert("Failed to update user block status"))
}


/* =========================
   PRODUCTS (ALL PRODUCTS FOR ADMIN)
========================= */

function loadProducts() {
    fetch(API + "/api/admin/products", {
        headers: authHeaders()
    })
    .then(r => r.json())
    .then(data => {
        const box = document.getElementById("products")

        if (!Array.isArray(data)) {
            box.innerHTML = "<p>Unable to load products.</p>"
            return
        }

        if (data.length === 0) {
            setAdminStat("admin-stat-products", 0)
            box.innerHTML = "<p>No products found in catalog.</p>"
            return
        }

        setAdminStat("admin-stat-products", data.length)

        box.innerHTML = data.map(p => {
            const active = p.is_active === 1 || p.is_active === null || p.is_active === undefined
            const image = p.image_url ? mediaUrl(p.image_url) : ""

            return `
                <div class="card"
                     style="margin-bottom:15px;
                            display:flex;
                            gap:15px;
                            align-items:center;
                            flex-wrap:wrap;
                            border-left: 4px solid ${active ? 'var(--green)' : 'var(--red)'};">

                    ${
                        image
                        ? `<img src="${image}" alt="${escapeHtml(p.name || "Product")}" style="width:80px; height:80px; object-fit:cover; border-radius:8px;">`
                        : `<div style="width:80px; height:80px; display:flex; align-items:center; justify-content:center; background:var(--bg-3); border-radius:8px; font-size:0.75rem; color:var(--text-3);">No image</div>`
                    }

                    <div style="flex:1;min-width:220px;">
                        <h3 style="margin:0 0 4px 0; font-size:1.05rem;">
                            ${escapeHtml(p.name || "Unnamed product")}
                            <span style="font-size:0.75rem; font-weight:normal; margin-left:8px; padding:2px 8px; border-radius:4px; background:${active ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}; color:${active ? 'var(--green)' : 'var(--red)'};">
                                ${active ? 'ACTIVE' : 'HIDDEN'}
                            </span>
                        </h3>

                        <div style="font-size:0.82rem; color:var(--text-2);">
                            Seller: <strong>${escapeHtml(p.store_name || "Unknown")}</strong> (${escapeHtml(p.seller_email || "No email")})
                        </div>

                        <div style="font-size:0.82rem; color:var(--text-2);">
                            Price: <strong>₹${Number(p.price || 0).toFixed(2)}</strong> | Stock: <strong>${p.stock ?? 0}</strong> | Category: ${escapeHtml(p.category || "-")}
                        </div>
                    </div>

                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        ${
                            active
                            ? `<button class="cart-btn" style="background:#f59e0b; font-size:0.8rem; padding:6px 12px;" onclick="setProductStatus(${Number(p.id)}, 0)">Hide</button>`
                            : `<button class="cart-btn" style="background:var(--green); font-size:0.8rem; padding:6px 12px;" onclick="setProductStatus(${Number(p.id)}, 1)">Restore</button>`
                        }
                        <button class="cart-btn" style="background:#ef4444; font-size:0.8rem; padding:6px 12px;" onclick="deleteProduct(${Number(p.id)})">
                            Delete permanently
                        </button>
                    </div>

                </div>
            `
        }).join("")
    })
    .catch(() => {
        document.getElementById("products").innerHTML = "<p>Failed to load products.</p>"
    })
}


function setProductStatus(id, isActive) {
    const action = isActive ? "restore" : "hide"
    if (!confirm(`Are you sure you want to ${action} this product?`)) return

    fetch(API + "/api/admin/products/" + id, {
        method: "PUT",
        headers: {
            ...authHeaders(),
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ is_active: isActive })
    })
    .then(r => r.json())
    .then(data => {
        if (typeof toast === "function") {
            toast(data.message, data.success ? "success" : "error")
        } else {
            alert(data.message)
        }
        if (data.success) loadProducts()
    })
    .catch(() => alert("Failed to update product"))
}

function deleteProduct(id) {
    if (!confirm("Permanently delete this product from the catalog? This cannot be undone.")) {
        return
    }

    fetch(API + "/api/admin/products/" + id, {
        method: "DELETE",
        headers: authHeaders()
    })
    .then(r => r.json())
    .then(data => {
        if (typeof toast === "function") {
            toast(data.message, data.success ? "success" : "error")
        } else {
            alert(data.message)
        }
        if (data.success) loadProducts()
    })
    .catch(() => alert("Failed to delete product"))
}


/* =========================
   ORDERS
========================= */

function loadOrders() {
    fetch(API + "/api/admin/orders", {
        headers: authHeaders()
    })
    .then(r => r.json())
    .then(data => {
        const box = document.getElementById("orders")

        if (!Array.isArray(data)) {
            box.innerHTML = "<p>Unable to load orders.</p>"
            return
        }

        if (data.length === 0) {
            setAdminStat("admin-stat-orders", 0)
            box.innerHTML = "<p>No orders found.</p>"
            return
        }

        setAdminStat("admin-stat-orders", data.length)

        box.innerHTML = data.map(o => `
            <div class="card" style="margin-bottom:10px;">
                <strong>Order #${o.id}</strong> | Store: <strong>${escapeHtml(o.store_name || "-")}</strong> | Buyer: ${escapeHtml(o.buyer_email || "-")}<br>
                Amount: <strong>₹${Number(o.grand_total || 0).toFixed(2)}</strong> | Payment: <strong>${escapeHtml(o.payment_status || "-")}</strong> | Status: <strong>${escapeHtml(o.status || "-")}</strong>
                ${o.payment_utr ? `<br>UPI/UTR: <strong>${escapeHtml(o.payment_utr)}</strong>` : '<br>UPI/UTR: <em>Not provided (optional)</em>'}
                ${
                    o.payment_screenshot_url
                    ? `<br><a href="${mediaUrl(o.payment_screenshot_url)}" target="_blank" class="btn btn-secondary" style="display:inline-block; margin-top:8px; font-size:0.8rem;">View payment screenshot</a>`
                    : ""
                }
            </div>
        `).join("")
    })
    .catch(() => {
        document.getElementById("orders").innerHTML = "<p>Failed to load orders.</p>"
    })
}


/* =========================
   MODERATION REPORTS QUEUE
========================= */

function loadReports() {
    fetch(API + "/api/admin/reports", {
        headers: authHeaders()
    })
    .then(r => r.json())
    .then(data => {
        const box = document.getElementById("reports")
        if (!box) return
        if (!Array.isArray(data)) {
            box.innerHTML = "<p>Unable to load moderation reports.</p>"
            return
        }
        if (data.length === 0) {
            setAdminStat("admin-stat-reports", 0)
            box.innerHTML = "<p style='color:var(--text-3); font-size:0.88rem;'>No active reports.</p>"
            return
        }

        setAdminStat("admin-stat-reports", data.filter(report => report.status === "open").length)

        box.innerHTML = data.map(r => {
            const isOpen = r.status === 'open'
            return `
                <div class="card" style="margin-bottom:12px; border-left: 4px solid ${isOpen ? '#f59e0b' : 'var(--green)'}; background:var(--surface);">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                        <div>
                            <strong>Report #${r.id}</strong> | Reporter: <strong>${escapeHtml(r.reporter_email || 'User')}</strong><br>
                            Item/Reason: <strong style="color:var(--red);">${escapeHtml(r.reason)}</strong>
                            ${r.product_title ? ` · Product: <strong>${escapeHtml(r.product_title)}</strong>` : ''}
                            ${r.store_name ? ` · Seller: <strong>${escapeHtml(r.store_name)}</strong>` : ''}<br>
                            Status: <strong style="color:${isOpen ? '#f59e0b' : 'var(--green)'};">${r.status.toUpperCase()}</strong>
                        </div>
                        ${
                            isOpen
                            ? `<div style="display:flex; gap:6px; flex-wrap:wrap;">
                                ${r.product_id ? `<button class="cart-btn" style="background:#ff4b2b; font-size:0.78rem; padding:6px 10px;" onclick="setProductStatus(${r.product_id}, 0)">Hide product</button>` : ''}
                                ${r.seller_id ? `<button class="cart-btn" style="background:#f59e0b; font-size:0.78rem; padding:6px 10px;" onclick="issueSellerStrike(${r.seller_id}, '${escapeHtml(r.store_name || 'Seller')}')">Issue Strike</button>` : ''}
                                <button class="cart-btn" style="background:var(--green); font-size:0.78rem; padding:6px 10px;" onclick="resolveReport(${r.id}, 'resolved')">Resolve</button>
                                <button class="cart-btn" style="background:var(--surface-2); color:var(--text); font-size:0.78rem; padding:6px 10px;" onclick="resolveReport(${r.id}, 'dismissed')">Dismiss</button>
                               </div>`
                            : `<span style="font-size:0.8rem; color:var(--text-3);">Resolved</span>`
                        }
                    </div>
                </div>
            `
        }).join("")
    })
    .catch(() => {
        if (document.getElementById("reports")) document.getElementById("reports").innerHTML = "<p>Failed to load reports.</p>"
    })
}

function resolveReport(reportId, status) {
    fetch(API + "/api/admin/reports/" + reportId, {
        method: "PUT",
        headers: {
            ...authHeaders(),
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
    })
    .then(r => r.json())
    .then(data => {
        if (typeof toast === "function") toast(data.message, data.success ? "success" : "error")
        else alert(data.message)
        if (data.success) loadReports()
    })
    .catch(() => alert("Failed to update report"))
}


/* =========================
   HOSTEL MANAGEMENT
========================= */

function loadHostelsAdmin() {
    fetch(API + "/api/admin/hostels", {
        headers: authHeaders()
    })
    .then(r => r.json())
    .then(data => {
        const box = document.getElementById("hostels-list")
        if (!box) return
        if (!Array.isArray(data)) {
            box.innerHTML = "<p>Unable to load hostels.</p>"
            return
        }

        box.innerHTML = data.map(h => {
            const active = h.is_active === 1
            return `
                <div class="card" style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; padding:10px 15px;">
                    <div>
                        <strong>${escapeHtml(h.name)}</strong> (Code: <code>${escapeHtml(h.code)}</code>)<br>
                        Status: <strong style="color:${active ? 'var(--green)' : 'var(--red)'}">${active ? 'Active' : 'Inactive'}</strong>
                    </div>
                    <div>
                        ${
                            active
                            ? `<button class="cart-btn" style="background:#ff4b2b; font-size:0.78rem; padding:4px 10px;" onclick="toggleHostelStatus(${h.id}, 0)">Disable</button>`
                            : `<button class="cart-btn" style="background:var(--green); font-size:0.78rem; padding:4px 10px;" onclick="toggleHostelStatus(${h.id}, 1)">Enable</button>`
                        }
                    </div>
                </div>
            `
        }).join("")
    })
    .catch(() => {
        if (document.getElementById("hostels-list")) document.getElementById("hostels-list").innerHTML = "<p>Failed to load hostels.</p>"
    })
}

function addHostel() {
    const nameEl = document.getElementById("new-hostel-name")
    const codeEl = document.getElementById("new-hostel-code")
    const name = nameEl ? nameEl.value.trim() : ""
    const code = codeEl ? codeEl.value.trim() : ""

    if (!name || !code) {
        alert("Please enter both Hostel Name and Code")
        return
    }

    fetch(API + "/api/admin/hostels", {
        method: "POST",
        headers: {
            ...authHeaders(),
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, code })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            nameEl.value = ""
            codeEl.value = ""
            loadHostelsAdmin()
        }
        if (typeof toast === "function") toast(data.message, data.success ? "success" : "error")
        else alert(data.message)
    })
    .catch(() => alert("Failed to add hostel"))
}

function toggleHostelStatus(id, isActive) {
    fetch(API + "/api/admin/hostels/" + id, {
        method: "PUT",
        headers: {
            ...authHeaders(),
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ is_active: isActive })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) loadHostelsAdmin()
        if (typeof toast === "function") toast(data.message, data.success ? "success" : "error")
        else alert(data.message)
    })
    .catch(() => alert("Failed to update hostel status"))
}


/* =========================
   START
========================= */

loadUsers()
loadProducts()
loadOrders()
loadReports()
loadHostelsAdmin()
