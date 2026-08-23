const mysql=require('mysql2')
const env=require('dotenv').config()
const db=mysql.createConnection({
    host:process.env.DB_HOST,
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD,
    database:process.env.DB_NAME
})
db.connect((err)=>{
    if(err){
        console.log("connection failed")
        return
    }
    console.log("connected successfully")

    // Run self-healing schema updates
    db.query("SHOW COLUMNS FROM users LIKE 'is_blocked'", (err, res) => {
        if (!err && (!res || res.length === 0)) {
            db.query("ALTER TABLE users ADD COLUMN is_blocked TINYINT NOT NULL DEFAULT 0", (e) => {
                if (e) console.error("Error adding is_blocked column:", e.message);
                else console.log("Added is_blocked column to users table.");
            });
        }
    });

    const createResetsTable = `
        CREATE TABLE IF NOT EXISTS password_resets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            otp_code VARCHAR(10) NOT NULL,
            attempts INT NOT NULL DEFAULT 0,
            expires_at DATETIME NOT NULL,
            resend_available_at DATETIME NOT NULL,
            is_verified TINYINT NOT NULL DEFAULT 0,
            reset_token VARCHAR(255) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    db.query(createResetsTable, (err) => {
        if (err) console.error("Error creating password_resets table:", err.message);
    });

    const createStrikesTable = `
        CREATE TABLE IF NOT EXISTS seller_strikes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            seller_id INT NOT NULL,
            admin_id INT NOT NULL,
            reason TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    db.query(createStrikesTable, (err) => {
        if (err) console.error("Error creating seller_strikes table:", err.message);
    });

    // Create Hostels table
    const createHostelsTable = `
        CREATE TABLE IF NOT EXISTS hostels (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            code VARCHAR(20) NOT NULL,
            is_active TINYINT NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    db.query(createHostelsTable, (err) => {
        if (err) console.error("Error creating hostels table:", err.message);
        else {
            // Seed initial hostels if empty
            db.query("SELECT COUNT(*) AS total FROM hostels", (sErr, rows) => {
                if (!sErr && rows && rows[0].total === 0) {
                    const seedSql = `
                        INSERT INTO hostels (name, code, is_active) VALUES 
                        ('Amritam Hostel', 'AMR', 1),
                        ('Anugraha Hostel', 'ANU', 1),
                        ('Bhavani Hostel', 'BHV', 1)
                    `;
                    db.query(seedSql, () => console.log("Seeded default college hostels into database."));
                }
            });
        }
    });

    // Add hostel_id column to users
    db.query("SHOW COLUMNS FROM users LIKE 'hostel_id'", (err, res) => {
        if (!err && (!res || res.length === 0)) {
            db.query("ALTER TABLE users ADD COLUMN hostel_id INT NULL", (e) => {
                if (e) console.error("Error adding hostel_id column to users:", e.message);
                else console.log("Added hostel_id column to users table.");
            });
        }
    });

    // Add hostel_id column to sellers
    db.query("SHOW COLUMNS FROM sellers LIKE 'hostel_id'", (err, res) => {
        if (!err && (!res || res.length === 0)) {
            db.query("ALTER TABLE sellers ADD COLUMN hostel_id INT NULL", (e) => {
                if (e) console.error("Error adding hostel_id column to sellers:", e.message);
                else console.log("Added hostel_id column to sellers table.");
            });
        }
    });

    // Create Reports table
    const createReportsTable = `
        CREATE TABLE IF NOT EXISTS reports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            reporter_id INT NOT NULL,
            product_id INT NULL,
            seller_id INT NULL,
            reason VARCHAR(255) NOT NULL,
            description TEXT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'open',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    db.query(createReportsTable, (err) => {
        if (err) console.error("Error creating reports table:", err.message);
    });

    // Create Order Messages table
    const createMessagesTable = `
        CREATE TABLE IF NOT EXISTS order_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            sender_id INT NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    db.query(createMessagesTable, (err) => {
        if (err) console.error("Error creating order_messages table:", err.message);
    });
})
module.exports=db