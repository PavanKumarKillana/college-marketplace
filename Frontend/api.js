/* api.js — shared helpers used by every page */

const API = ""

/* ── HTML escaping ─────────────────────────── */
function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
}

/* ── Auth helpers ──────────────────────────── */
function getToken() { return localStorage.getItem("token") }

function requireLogin() {
    if (!getToken()) window.location.href = "login.html"
}

function authHeaders() {
    return { "Content-Type": "application/json", "authorization": getToken() }
}

function logout() {
    ["token","role","is_seller","room_number"].forEach(k => localStorage.removeItem(k))
    window.location.href = "login.html"
}

/* ── Media ─────────────────────────────────── */
function mediaUrl(filePath) {
    if (!filePath) return ""
    return filePath.startsWith("/") ? API + filePath : filePath
}

/* ── Stars ─────────────────────────────────── */
function starRating(value) {
    const n = Number(value)
    if (!n) return `<span class="stars">☆☆☆☆☆</span><span class="rating-number">New</span>`
    const full = Math.max(0, Math.min(5, Math.round(n)))
    return `<span class="stars">${"★".repeat(full)}${"☆".repeat(5-full)}</span><span class="rating-number">${n.toFixed(1)}/5</span>`
}

/* ── Toast notifications ────────────────────── */
function toast(message, type) {
    // type: 'success' | 'error' | 'info'
    const container = document.getElementById("toast-container")
    if (!container) return
    const t = document.createElement("div")
    t.className = "toast toast-" + (type || "info")
    const icons = { success: "✅", error: "❌", info: "ℹ️" }
    t.innerHTML = `<span>${icons[type] || "ℹ️"}</span><span>${message}</span>`
    container.appendChild(t)
    setTimeout(() => t.remove(), 3200)
}

/* ── Cart badge ────────────────────────────── */
function updateCartBadge(count) {
    const badge = document.getElementById("cart-count")
    if (!badge) return
    badge.textContent = count || 0
    badge.style.display = count > 0 ? "inline-flex" : "none"
}

function refreshCartCount() {
    if (!getToken()) return
    fetch(API + "/api/cart", { headers: authHeaders() })
        .then(r => r.json())
        .then(data => {
            if (Array.isArray(data)) updateCartBadge(data.length)
        })
        .catch(() => {})
}
