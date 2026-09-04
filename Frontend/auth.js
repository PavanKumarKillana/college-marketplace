/* auth.js */

let resetTokenStorage = ""
let resetEmailStorage = ""

function toggleAuth() {
    const loginForm    = document.getElementById("login-form")
    const registerForm = document.getElementById("register-form")
    const forgotForm   = document.getElementById("forgot-form")
    forgotForm.style.display = "none"
    if (loginForm.style.display === "none") {
        loginForm.style.display    = "block"
        registerForm.style.display = "none"
    } else {
        loginForm.style.display    = "none"
        registerForm.style.display = "block"
    }
}

function showForgotForm() {
    document.getElementById("login-form").style.display = "none"
    document.getElementById("register-form").style.display = "none"
    document.getElementById("forgot-form").style.display = "block"
    document.getElementById("forgot-step-1").style.display = "block"
    document.getElementById("forgot-step-2").style.display = "none"
    document.getElementById("forgot-step-3").style.display = "none"
}

function showLoginForm() {
    document.getElementById("login-form").style.display = "block"
    document.getElementById("register-form").style.display = "none"
    document.getElementById("forgot-form").style.display = "none"
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
            if (data.user_id) localStorage.setItem("user_id", data.user_id)
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

document.addEventListener("DOMContentLoaded", () => {
    loadRegistrationHostels()
})

function loadRegistrationHostels() {
    const sel = document.getElementById("reg-hostel")
    if (!sel) return
    fetch(API + "/api/hostels")
    .then(r => r.json())
    .then(hostels => {
        if (Array.isArray(hostels) && hostels.length > 0) {
            sel.innerHTML = `<option value="">-- Select Your Hostel / Building --</option>` + 
                hostels.map(h => `<option value="${h.id}">📍 ${h.name} (${h.code})</option>`).join("")
        }
    })
    .catch(() => {})
}

function registerUser() {
    const name        = document.getElementById("reg-name").value.trim()
    const email       = document.getElementById("reg-email").value.trim()
    const username    = document.getElementById("reg-username") ? document.getElementById("reg-username").value.trim() : ""
    const password    = document.getElementById("reg-password").value
    const room_number = document.getElementById("reg-room").value.trim()
    const hostel_id   = document.getElementById("reg-hostel") ? document.getElementById("reg-hostel").value : ""
    const year        = document.getElementById("reg-year") ? document.getElementById("reg-year").value : ""

    if (!name || !email || !password) { toast("Name, email and password are required", "error"); return }

    fetch(API + "/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, username, password, room_number, hostel_id, year })
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

/* FORGOT PASSWORD OTP HANDLERS */

function sendOtp() {
    const email = document.getElementById("forgot-email").value.trim()
    if (!email) {
        toast("Please enter your email", "error")
        return
    }

    fetch(API + "/api/users/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            resetEmailStorage = email
            toast(data.message, "success")
            document.getElementById("forgot-step-1").style.display = "none"
            document.getElementById("forgot-step-2").style.display = "block"

            const demoBox = document.getElementById("otp-demo-alert")
            if (data.otp_demo) {
                demoBox.style.display = "block"
                demoBox.innerHTML = `🔑 <strong>OTP Code:</strong> <span style="letter-spacing:2px; font-weight:700;">${data.otp_demo}</span>`
            } else {
                demoBox.style.display = "none"
            }
        } else {
            toast(data.message || "Failed to send OTP", "error")
        }
    })
    .catch(() => toast("Server error sending OTP", "error"))
}

function verifyOtpCode() {
    const otp = document.getElementById("otp-input").value.trim()
    if (!otp) {
        toast("Please enter the 6-digit OTP code", "error")
        return
    }

    fetch(API + "/api/users/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmailStorage, otp })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            resetTokenStorage = data.reset_token
            toast("OTP verified successfully!", "success")
            document.getElementById("forgot-step-2").style.display = "none"
            document.getElementById("forgot-step-3").style.display = "block"
        } else {
            toast(data.message || "Invalid OTP code", "error")
        }
    })
    .catch(() => toast("Server error verifying OTP", "error"))
}

function submitNewPassword() {
    const new_password = document.getElementById("new-password-input").value
    if (!new_password || new_password.length < 6) {
        toast("Password must be at least 6 characters long", "error")
        return
    }

    fetch(API + "/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: resetEmailStorage,
            reset_token: resetTokenStorage,
            new_password
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            toast("Password reset successful! Please log in.", "success")
            setTimeout(() => {
                showLoginForm()
                document.getElementById("login-email").value = resetEmailStorage
            }, 1000)
        } else {
            toast(data.message || "Failed to reset password", "error")
        }
    })
    .catch(() => toast("Server error resetting password", "error"))
}

