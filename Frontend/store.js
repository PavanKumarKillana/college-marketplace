requireLogin()
const id = new URLSearchParams(window.location.search).get("id")

fetch(API + "/api/sellers/" + id)
    .then(r => r.json())
    .then(data => {
        if (!data.seller) {
            document.getElementById("store-box").innerHTML = "<p>Store not found</p>"
            return
        }
        const seller = data.seller
        document.getElementById("store-box").innerHTML = `
            <h2>${seller.store_name}</h2>
            <p>Room ${seller.room_number || "-"}</p>
            <div class="rating-row">${starRating(seller.avg_rating)}</div>
        `
        const container = document.getElementById("products-container")
        container.innerHTML = ""
        ;(data.products || []).forEach(product => {
            const img = product.image_url ? `<img class="product-img" src="${mediaUrl(product.image_url)}">` : ""
            container.innerHTML += `<div class="card product-card">
                <div class="product-image-frame">${img}</div>
                <h2>${product.name}</h2>
                <p class="price">₹${product.price}</p>
                <div class="rating-row">${starRating(product.avg_rating)}</div>
                <span class="stock-status ${Number(product.stock) > 0 ? "in-stock" : "out-of-stock"}">${Number(product.stock) > 0 ? "In stock: " + product.stock : "Sold out"}</span>
                <a class="cart-btn details-btn" href="product.html?id=${product.id}" style="display:block;text-align:center;box-sizing:border-box; margin-top:auto;">Details</a>
            </div>`
        })
        const reviews = document.getElementById("reviews")
        reviews.innerHTML = ""
        ;(data.reviews || []).forEach(row => {
            reviews.innerHTML += `<p><b>${row.name || "Student"}</b>: ${starRating(row.rating)} ${row.comment || ""}</p>`
        })
    })

function submitReview() {
    fetch(API + "/api/reviews/sellers/" + id, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
            rating: document.getElementById("rating").value,
            comment: document.getElementById("comment").value
        })
    }).then(r => r.json()).then(data => {
        alert(data.message)
        if (data.success) window.location.reload()
    })
}

function selectRating(value) {
    document.getElementById("rating").value = value
    document.getElementById("rating-text").textContent = value + " out of 5"
    document.querySelectorAll(".star-picker button").forEach((button, index) => {
        button.classList.toggle("selected", index < value)
    })
}

selectRating(5)
