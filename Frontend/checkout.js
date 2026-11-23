/* checkout.js */
requireLogin()
refreshCartCount()

let cartItems = []
let fulfillmentType = "pickup"

function selectFulfillment(type) {
    fulfillmentType = type
    document.getElementById("fulfillment").value = type

    document.getElementById("opt-pickup").classList.toggle("active", type === "pickup")
    document.getElementById("opt-delivery").classList.toggle("active", type === "delivery")
    document.getElementById("room-wrap").style.display = type === "delivery" ? "block" : "none"
    showTotals()
}

function showTotals() {
    const preview = document.getElementById("cart-preview")
    preview.innerHTML = ""
    const groups = {}
    cartItems.forEach(item => {
        const key = item.seller_id || "none"
        if (!groups[key]) groups[key] = []
        groups[key].push(item)
    })

    let grand = 0
    Object.keys(groups).forEach(key => {
        const lines = groups[key]
        let sub = 0
        let maxDelivery = 0
        lines.forEach(l => {
            sub += Number(l.price) * Number(l.quantity)
            const charge = Number(l.delivery_charge || 0)
            if (charge > maxDelivery) maxDelivery = charge
        })
        const delivery = fulfillmentType === "delivery" ? maxDelivery : 0
        grand += sub + delivery

        // Seller header
        preview.innerHTML += `<p style="font-weight:700; font-size:0.92rem; color:var(--text-1); margin-bottom:6px;">
            🏪 ${lines[0].store_name || "Seller"} — Room ${lines[0].seller_room || "-"}</p>`

        // Items
        lines.forEach(l => {
            preview.innerHTML += `
            <div style="display:flex; justify-content:space-between; font-size:0.85rem;
                        color:var(--text-2); padding:4px 0;">
                <span>${l.name} × ${l.quantity}</span>
                <span>₹${Number(l.price) * Number(l.quantity)}</span>
            </div>`
        })

        // Delivery line
        if (fulfillmentType === "delivery") {
            preview.innerHTML += `
            <div style="display:flex; justify-content:space-between; font-size:0.82rem;
                        color:var(--text-3); padding:4px 0; border-bottom:1px solid var(--border); margin-bottom:10px;">
                <span>🛵 Delivery charge</span>
                <span>${delivery > 0 ? "₹" + delivery : "Free"}</span>
            </div>`
        } else {
            preview.innerHTML += `<hr class="order-divider">`
        }
    })

    const totalEl = document.getElementById("total-line")
    if (totalEl) totalEl.textContent = "₹" + grand
}

// Load cart items
fetch(API + "/api/cart", { headers: authHeaders() })
    .then(r => r.json())
    .then(data => {
        cartItems = Array.isArray(data) ? data : []
        const preview = document.getElementById("cart-preview")
        if (cartItems.length === 0) {
            preview.innerHTML = `<div class="empty-state" style="padding:20px 0;">
                <span class="empty-icon">🛒</span>
                <p>Your cart is empty. <a href="index.html">Go shop!</a></p>
            </div>`
            return
        }
        const savedRoom = localStorage.getItem("room_number")
        if (savedRoom) {
            const roomInput = document.getElementById("buyer-room")
            if (roomInput) roomInput.value = savedRoom
        }
        showTotals()
    })

function showOrderGuideModal() {
    const buyerRoom = document.getElementById("buyer-room")
    if (fulfillmentType === "delivery" && buyerRoom && !buyerRoom.value.trim()) {
        toast("Please enter your room number for delivery", "error")
        return
    }
    const modal = document.getElementById("order-guide-modal")
    if (modal) modal.style.display = "flex"
    else placeOrder()
}

function closeOrderGuideModal() {
    const modal = document.getElementById("order-guide-modal")
    if (modal) modal.style.display = "none"
}

function confirmAndPlaceOrder() {
    closeOrderGuideModal()
    placeOrder()
}

function placeOrder() {
    const buyerRoom = document.getElementById("buyer-room")
    if (fulfillmentType === "delivery" && buyerRoom && !buyerRoom.value.trim()) {
        toast("Please enter your room number for delivery", "error")
        return
    }

    fetch(API + "/api/orders", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
            fulfillment_type: fulfillmentType,
            buyer_room_number: buyerRoom ? buyerRoom.value.trim() : ""
        })
    })
    .then(r => r.json())
    .then(data => {
        toast(data.message, data.success ? "success" : "error")
        if (data.success) {
            setTimeout(() => { window.location.href = "orders.html" }, 1000)
        }
    })
}
