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
})
module.exports=db