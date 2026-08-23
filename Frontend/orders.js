/* orders.js */

requireLogin()

fetch(API + "/api/orders", {
    headers: authHeaders()
})
.then(r => r.json())
.then(data => {

    const box = document.getElementById("orders")

    if (!Array.isArray(data) || data.length === 0) {

        box.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📭</span>
                <p>
                    No orders yet.
                    <a href="index.html">Go shop something!</a>
                </p>
            </div>
        `

        return
    }

    data.forEach(order => {

        /* =========================
           ITEMS
        ========================= */

        let itemsHtml = ""

        ;(order.items || []).forEach(item => {

            itemsHtml += `
                <div style="
                    display:flex;
                    justify-content:space-between;
                    font-size:0.83rem;
                    color:var(--text-2);
                    padding:3px 0;
                ">
                    <span>
                        • ${item.name} × ${item.quantity}
                    </span>

                    <span>
                        ₹${item.price}
                    </span>
                </div>
            `
        })


        /* =========================
           QR CODE
        ========================= */

        const qrHtml = order.upi_qr_url

            ? `
                <div class="qr-box">
                    <img
                        src="${mediaUrl(order.upi_qr_url)}"
                        alt="UPI QR Code"
                    >
                </div>
              `

            : `
                <p style="
                    color:var(--text-3);
                    font-size:0.82rem;
                ">
                    No QR yet — ask seller to add one
                    in their dashboard.
                </p>
              `


        /* =========================
           PAYMENT FORM
        ========================= */

        let payForm = ""

        if (
            order.payment_status === "pending" ||
            order.payment_status === "rejected"
        ) {

            payForm = `

                <div style="
                    background:var(--bg-3);
                    border-radius:var(--radius-md);
                    padding:14px;
                    margin-top:12px;
                ">

                    <p style="
                        font-weight:700;
                        margin-bottom:10px;
                    ">
                        💳 Pay to complete order
                    </p>

                    <p style="
                        font-size:0.83rem;
                        color:var(--text-2);
                        margin-bottom:8px;
                    ">
                        <strong>Step 1:</strong>
                        Send ₹${order.grand_total}
                        to UPI:

                        <strong style="
                            color:var(--brand);
                        ">
                            ${order.upi_id || "Not set by seller"}
                        </strong>
                    </p>

                    ${qrHtml}

                    <p style="
                        font-size:0.83rem;
                        color:var(--text-2);
                        margin-top:10px;
                        margin-bottom:6px;
                    ">
                        <strong>Step 2:</strong>
                        UPI transaction ID / UTR
                        <span style="
                            color:var(--text-3);
                        ">
                            (optional)
                        </span>
                    </p>

                    <input
                        id="utr-${order.id}"
                        class="input-field"
                        placeholder="UPI transaction ID / UTR number (optional)"
                    >

                    <span
                        class="input-label"
                        style="margin-top:10px;"
                    >
                        Payment screenshot
                        <strong style="color:var(--red);">
                            (required)
                        </strong>
                    </span>

                    <input
                        id="ss-${order.id}"
                        class="input-field"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                    >

                    <button
                        class="btn btn-primary btn-full"
                        style="margin-top:10px;"
                        onclick="submitPayment(${order.id})"
                    >
                        📤 Submit Payment Proof
                    </button>

                    ${
                        order.payment_status === "rejected"

                        ? `
                            <p style="
                                color:var(--red);
                                font-size:0.8rem;
                                margin-top:8px;
                            ">
                                ⚠️ Previous payment was rejected.
                                Please resubmit.
                            </p>
                          `

                        : ""
                    }

                </div>
            `

        }

        else if (order.payment_status === "submitted") {

            payForm = `

                <div style="
                    background:rgba(99,102,241,0.08);
                    border:1px solid rgba(99,102,241,0.2);
                    border-radius:var(--radius-md);
                    padding:12px;
                    margin-top:12px;
                ">

                    <p style="
                        color:#818cf8;
                        font-size:0.85rem;
                    ">

                        ⏳ Payment proof submitted

                        ${
                            order.payment_utr
                            ? `(UTR: ${order.payment_utr})`
                            : `(No UTR provided)`
                        }

                        <br>
                        Waiting for seller to verify.

                    </p>

                    ${
                        order.payment_screenshot_url

                        ? `
                            <a
                                href="${mediaUrl(order.payment_screenshot_url)}"
                                target="_blank"
                                class="btn btn-secondary"
                                style="
                                    margin-top:8px;
                                    font-size:0.78rem;
                                    width:auto;
                                "
                            >
                                View Screenshot
                            </a>
                          `

                        : ""
                    }

                </div>
            `
        }

        else if (order.payment_status === "verified") {

            payForm = `

                <div style="
                    background:rgba(34,197,94,0.08);
                    border:1px solid rgba(34,197,94,0.2);
                    border-radius:var(--radius-md);
                    padding:12px;
                    margin-top:12px;
                ">

                    <p style="
                        color:var(--green);
                        font-size:0.85rem;
                    ">
                        ✅ Payment verified by seller!
                    </p>

                </div>
            `
        }


        /* =========================
           STATUS
        ========================= */

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

        const stColor =
            statusColors[order.status] || "badge-gray"

        const pyColor =
            payColors[order.payment_status] || "badge-gray"


        /* =========================
           ORDER CARD
        ========================= */

        box.innerHTML += `

            <div class="order-card">

                <div class="order-card-header">

                    <div>

                        <p class="order-store" style="font-weight:600; font-size:1.05rem;">
                            🏪 ${escapeHtml(order.store_name)}
                        </p>

                        <div style="font-size:0.82rem; color:var(--text-2); margin:4px 0;">
                            <strong>Order #${order.id}</strong> · Type: <span class="badge badge-blue">${order.fulfillment_type}</span><br>
                            ${
                                order.fulfillment_type === 'delivery'
                                ? `🛵 <strong>Deliver to (Buyer):</strong> ${[order.buyer_year, escapeHtml(order.buyer_hostel_name || 'Campus Hostel'), 'Room ' + escapeHtml(order.buyer_room || order.buyer_room_number || '-')].filter(Boolean).join(' • ')}<br>
                                   🏃 <strong>Pickup from (Seller):</strong> ${escapeHtml(order.seller_hostel_name || 'Campus Hostel')} • Room ${escapeHtml(order.seller_room || '-')}`
                                : `🏃 <strong>Pickup from Seller:</strong> ${escapeHtml(order.seller_hostel_name || 'Campus Hostel')} • Room ${escapeHtml(order.seller_room || '-')}`
                            }
                        </div>

                    </div>

                    <span class="order-total">
                        ₹${order.grand_total}
                    </span>

                </div>


                <div
                    class="badge-row"
                    style="margin-bottom:10px;"
                >

                    <span class="badge ${stColor}">
                        📦 ${order.status}
                    </span>

                    <span class="badge ${pyColor}">
                        💳 ${order.payment_status}
                    </span>

                </div>


                ${itemsHtml}


                <div style="
                    display:flex;
                    justify-content:space-between;
                    font-size:0.82rem;
                    color:var(--text-3);
                    margin-top:6px;
                ">

                    <span>
                        Items: ₹${order.items_total}
                    </span>

                    <span>
                        Delivery: ₹${order.delivery_charge}
                    </span>

                    <strong style="
                        color:var(--text-1);
                    ">
                        Total: ₹${order.grand_total}
                    </strong>

                </div>


                ${payForm}

                <div style="margin-top:12px; display:flex; justify-content:flex-end;">
                    <button class="cart-btn" style="background:var(--indigo); font-size:0.8rem; padding:6px 12px;" onclick="openChatModal(${order.id}, '${escapeHtml(order.store_name || 'Seller')}')">
                        💬 Chat with Seller
                    </button>
                </div>

            </div>
        `
    })
})

/* =========================
   ORDER CHAT HANDLERS
========================= */

let currentChatOrderId = null

function openChatModal(orderId, storeName) {
    currentChatOrderId = orderId
    document.getElementById("chat-modal-title").textContent = `💬 Chat with ${storeName} (Order #${orderId})`
    document.getElementById("chat-modal").style.display = "flex"
    loadChatMessages()
}

function closeChatModal() {
    document.getElementById("chat-modal").style.display = "none"
    currentChatOrderId = null
}

function loadChatMessages() {
    if (!currentChatOrderId) return
    const box = document.getElementById("chat-messages-box")
    box.innerHTML = `<p style="text-align:center; color:var(--text-3); font-size:0.8rem;">Loading messages…</p>`

    fetch(API + "/api/orders/" + currentChatOrderId + "/messages", {
        headers: authHeaders()
    })
    .then(r => r.json())
    .then(data => {
        if (!Array.isArray(data)) {
            box.innerHTML = `<p style="color:var(--red); font-size:0.8rem;">Failed to load chat.</p>`
            return
        }
        if (data.length === 0) {
            box.innerHTML = `<p style="text-align:center; color:var(--text-3); font-size:0.8rem;">No messages yet. Send a message below to coordinate delivery!</p>`
            return
        }
        const currentUserId = Number(localStorage.getItem("user_id") || 0)
        box.innerHTML = data.map(m => {
            const isMe = m.sender_id === currentUserId
            return `
                <div style="margin-bottom:8px; text-align:${isMe ? 'right' : 'left'};">
                    <div style="display:inline-block; max-width:80%; padding:8px 12px; border-radius:10px; font-size:0.82rem; background:${isMe ? 'var(--indigo)' : 'var(--surface)'}; color:${isMe ? '#fff' : 'var(--text)'}; text-align:left;">
                        <strong>${escapeHtml(m.sender_name || 'User')}</strong> (${escapeHtml(m.sender_role || 'user')}):<br>
                        ${escapeHtml(m.message)}
                    </div>
                </div>
            `
        }).join("")
        box.scrollTop = box.scrollHeight
    })
    .catch(() => {
        box.innerHTML = `<p style="color:var(--red); font-size:0.8rem;">Chat offline.</p>`
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


/* =========================
   SUBMIT PAYMENT
========================= */

function submitPayment(orderId) {

    const utr =
        document
            .getElementById("utr-" + orderId)
            .value
            .trim()

    const screenshot =
        document
            .getElementById("ss-" + orderId)
            .files[0]


    /*
     * Screenshot is mandatory.
     * UTR is optional.
     */

    if (!screenshot) {

        toast(
            "Please upload your payment screenshot",
            "error"
        )

        return
    }


    const formData = new FormData()

    /*
     * Empty UTR is allowed.
     */

    formData.append(
        "payment_utr",
        utr
    )

    formData.append(
        "payment_screenshot",
        screenshot
    )


    fetch(
        API + "/api/orders/" + orderId + "/pay",
        {
            method: "POST",

            headers: {
                "authorization": getToken()
            },

            body: formData
        }
    )
    .then(r => r.json())
    .then(data => {

        toast(
            data.message,
            data.success
                ? "success"
                : "error"
        )

        if (data.success) {

            setTimeout(
                () => location.reload(),
                1000
            )
        }
    })
}
