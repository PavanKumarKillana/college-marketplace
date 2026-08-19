/* auth.js */

function toggleAuth() {
    const loginForm    = document.getElementById("login-form")
    const registerForm = document.getElementById("register-form")
    if (loginForm.style.display === "none") {
        loginForm.style.display    = "block"
        registerForm.style.display = "none"
    } else {
        loginForm.style.display    = "none"
        registerForm.style.display = "block"
    }
}

function loginUser() {
    const email    = document.getElementById("login-email").value.trim()
    const password = document.getElementById("login-password").value

    if (!email || !password) { toast("Please fill in all fields", "error"); return }

    fetch(API + "/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            localStorage.setItem("token", data.token)
            localStorage.setItem("role", data.role || "buyer")
            localStorage.setItem("is_seller", data.is_seller ? "1" : "0")
            if (data.room_number) localStorage.setItem("room_number", data.room_number)
            window.location.href = "index.html"
        } else {
            toast(data.message || "Login failed", "error")
        }
    })
    .catch(() => toast("Server offline — is the backend running?", "error"))
}

function registerUser() {
    const name        = document.getElementById("reg-name").value.trim()
    const email       = document.getElementById("reg-email").value.trim()
    const password    = document.getElementById("reg-password").value
    const room_number = document.getElementById("reg-room").value.trim()

    if (!name || !email || !password) { toast("Name, email and password are required", "error"); return }

    fetch(API + "/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, room_number })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            toast("Account created! Please login.", "success")
            setTimeout(toggleAuth, 800)
        } else {
            toast(data.message || "Registration failed", "error")
        }
    })
    .catch(() => toast("Server offline — is the backend running?", "error"))
}
