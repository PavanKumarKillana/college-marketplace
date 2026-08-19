requireLogin()
const id = new URLSearchParams(window.location.search).get("id")

function loadProduct() {
    fetch(API + "/api/products/" + id)
        .then(r => r.json())
        .then(data => {
            const product = Array.isArray(data) ? data[0] : data
            if (!product) {
                document.getElementById("product-box").innerHTML = "<p>Product not found</p>"
                return
            }
            const img = product.image_url ? `<div class="product-detail-image-frame"><img src="${mediaUrl(product.image_url)}" alt="${product.name}"></div>` : ""
            document.getElementById("product-box").innerHTML = `
                ${img}
                <h2>${product.name}</h2>
                <p class="price">₹${product.price}</p>
                <p>${product.description || ""}</p>
                <p>Category: ${product.category || "-"} | Stock: ${product.stock}</p>
                <p>Pickup: ${product.pickup_available ? "Yes" : "No"} | Delivery: ${product.delivery_available ? "Yes" : "No"} | Delivery charge: ₹${product.delivery_charge || 0}</p>
                <p>Seller: <a href="store.html?id=${product.seller_id}">${product.store_name || "Shop"}</a> Room ${product.seller_room || "-"}</p>
                <div class="rating-row">${starRating(product.avg_rating)}</div>
                <button class="cart-btn" onclick="addtoCart(${product.id})" ${Number(product.stock) > 0 ? "" : "disabled"}>${Number(product.stock) > 0 ? "Add to Cart" : "Sold out"}</button>
            `
        })
    fetch(API + "/api/reviews/products/" + id)
        .then(r => r.json())
        .then(data => {
            const box = document.getElementById("reviews")
            box.innerHTML = ""
            if (!Array.isArray(data) || data.length === 0) {
                box.innerHTML = "<p>No reviews yet.</p>"
                return
            }
            data.forEach(row => {
                box.innerHTML += `<p><b>${row.name || "Student"}</b>: ${starRating(row.rating)} ${row.comment || ""}</p>`
            })
        })
}

function addtoCart(productId) {
    fetch(API + "/api/cart", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ product_id: productId })
    }).then(r => r.json()).then(data => alert(data.message))
}

function submitReview() {
    fetch(API + "/api/reviews/products/" + id, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
            rating: document.getElementById("rating").value,
            comment: document.getElementById("comment").value
        })
    }).then(r => r.json()).then(data => {
        alert(data.message)
        if (data.success) loadProduct()
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
loadProduct()
