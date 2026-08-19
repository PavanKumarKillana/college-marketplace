requireLogin()
if (localStorage.getItem("role") !== "admin") {
    alert("Admin only")
    window.location.href = "index.html"
}

fetch(API + "/api/admin/users", { headers: authHeaders() })
    .then(r => r.json())
    .then(data => {
        const box = document.getElementById("users")
        if (!Array.isArray(data)) {
            box.innerHTML = "<p>Not allowed or schema not run.</p>"
            return
        }
        data.forEach(u => {
            box.innerHTML += `<p>#${u.id} ${u.email} | ${u.role} | room ${u.room_number || "-"}</p>`
        })
    })

fetch(API + "/api/admin/orders", { headers: authHeaders() })
    .then(r => r.json())
    .then(data => {
        const box = document.getElementById("orders")
        if (!Array.isArray(data)) return
        data.forEach(o => {
            box.innerHTML += `<p>Order #${o.id} ${o.store_name} buyer ${o.buyer_email} ₹${o.grand_total} pay:${o.payment_status} status:${o.status}</p>`
        })
    })

function hideProduct() {
    fetch(API + "/api/admin/products/" + document.getElementById("hide-id").value, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ is_active: 0 })
    }).then(r => r.json()).then(data => alert(data.message))
}
