-- Run these statements in MySQL Workbench on your existing database.
-- If a line says the column/table already exists, skip that line and continue.

-- Users
ALTER TABLE users ADD COLUMN name VARCHAR(100) NULL;
ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'buyer';
ALTER TABLE users ADD COLUMN room_number VARCHAR(50) NULL;

-- Seller shops
CREATE TABLE IF NOT EXISTS sellers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    store_name VARCHAR(100) NOT NULL,
    room_number VARCHAR(50) NULL,
    upi_id VARCHAR(100) NULL,
    upi_qr_url VARCHAR(500) NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
ALTER TABLE sellers ADD COLUMN upi_id VARCHAR(100) NULL;
ALTER TABLE sellers ADD COLUMN upi_qr_url VARCHAR(500) NULL;

-- Products (seller owns the row)
ALTER TABLE products ADD COLUMN seller_id INT NULL;
ALTER TABLE products ADD COLUMN description TEXT NULL;
ALTER TABLE products ADD COLUMN category VARCHAR(50) NULL;
ALTER TABLE products ADD COLUMN stock INT NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN image_url VARCHAR(500) NULL;
ALTER TABLE products ADD COLUMN pickup_available TINYINT NOT NULL DEFAULT 1;
ALTER TABLE products ADD COLUMN delivery_available TINYINT NOT NULL DEFAULT 1;
ALTER TABLE products ADD COLUMN delivery_charge DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN is_active TINYINT NOT NULL DEFAULT 1;

-- Cart quantity
ALTER TABLE cart ADD COLUMN quantity INT NOT NULL DEFAULT 1;

-- One order row per seller. Same checkout_id = one cart checkout with many sellers.
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    checkout_id VARCHAR(50) NOT NULL,
    buyer_id INT NOT NULL,
    seller_id INT NOT NULL,
    fulfillment_type VARCHAR(20) NOT NULL,
    buyer_room_number VARCHAR(50) NULL,
    items_total DECIMAL(10,2) NOT NULL DEFAULT 0,
    delivery_charge DECIMAL(10,2) NOT NULL DEFAULT 0,
    grand_total DECIMAL(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_status VARCHAR(30) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(id),
    FOREIGN KEY (seller_id) REFERENCES sellers(id)
);

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS product_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL,
    comment TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_product_review (product_id, user_id)
);

CREATE TABLE IF NOT EXISTS seller_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seller_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL,
    comment TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_seller_review (seller_id, user_id)
);

-- Payment proof: buyer sends UTR + screenshot, seller verifies
ALTER TABLE orders ADD COLUMN payment_utr VARCHAR(100) NULL;
ALTER TABLE orders ADD COLUMN payment_screenshot_url VARCHAR(500) NULL;

-- Older demo records that used the old button have no proof. Make them pending again.
UPDATE orders SET payment_status='pending' WHERE payment_status='buyer_confirmed';
