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

    // ── Column guards (idempotent — safe to run on every startup) ────────────

    db.query("SHOW COLUMNS FROM users LIKE 'is_blocked'", (err, res) => {
        if (!err && (!res || res.length === 0)) {
            db.query("ALTER TABLE users ADD COLUMN is_blocked TINYINT NOT NULL DEFAULT 0", (e) => {
                if (e) console.error("Error adding is_blocked:", e.message)
                else console.log("Added is_blocked to users.")
            })
        }
    })

    db.query("SHOW COLUMNS FROM users LIKE 'hostel_id'", (err, res) => {
        if (!err && (!res || res.length === 0)) {
            db.query("ALTER TABLE users ADD COLUMN hostel_id INT NULL", (e) => {
                if (e) console.error("Error adding hostel_id to users:", e.message)
                else console.log("Added hostel_id to users.")
            })
        }
    })

    // Student academic year — completely separate from hostel/building
    db.query("SHOW COLUMNS FROM users LIKE 'year'", (err, res) => {
        if (!err && (!res || res.length === 0)) {
            db.query("ALTER TABLE users ADD COLUMN year VARCHAR(20) NULL", (e) => {
                if (e) console.error("Error adding year to users:", e.message)
                else console.log("Added year column to users.")
            })
        }
    })

    db.query("SHOW COLUMNS FROM sellers LIKE 'hostel_id'", (err, res) => {
        if (!err && (!res || res.length === 0)) {
            db.query("ALTER TABLE sellers ADD COLUMN hostel_id INT NULL", (e) => {
                if (e) console.error("Error adding hostel_id to sellers:", e.message)
                else console.log("Added hostel_id to sellers.")
            })
        }
    })

    // ── Static reference tables ──────────────────────────────────────────────

    db.query(`CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp_code VARCHAR(10) NOT NULL,
        attempts INT NOT NULL DEFAULT 0,
        expires_at DATETIME NOT NULL,
        resend_available_at DATETIME NOT NULL,
        is_verified TINYINT NOT NULL DEFAULT 0,
        reset_token VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, (err) => { if (err) console.error("password_resets:", err.message) })

    db.query(`CREATE TABLE IF NOT EXISTS seller_strikes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        seller_id INT NOT NULL,
        admin_id INT NOT NULL,
        reason TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, (err) => { if (err) console.error("seller_strikes:", err.message) })

    db.query(`CREATE TABLE IF NOT EXISTS reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reporter_id INT NOT NULL,
        product_id INT NULL,
        seller_id INT NULL,
        reason VARCHAR(255) NOT NULL,
        description TEXT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, (err) => { if (err) console.error("reports:", err.message) })

    db.query(`CREATE TABLE IF NOT EXISTS order_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        sender_id INT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, (err) => { if (err) console.error("order_messages:", err.message) })

    // ── Hostels table — Admin-managed data ───────────────────────────────────
    //
    // RULE: The server NEVER automatically deletes any hostel row on startup.
    // Hostels are Admin-created and Admin-managed via the Admin UI.
    // The one-time cleanup of legacy development hostels is tracked in
    // db_migrations so it runs ONCE and NEVER again.

    db.query(`CREATE TABLE IF NOT EXISTS hostels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20) NOT NULL UNIQUE,
        is_active TINYINT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) { console.error("hostels table:", err.message); return }

        // Migration tracker — each named migration runs EXACTLY ONCE
        db.query(`CREATE TABLE IF NOT EXISTS db_migrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            migration_name VARCHAR(100) NOT NULL UNIQUE,
            ran_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`, (mErr) => {
            if (mErr) { console.error("db_migrations:", mErr.message); return }

            // ── ONE-TIME migration: remove legacy dev/fake hostels ────────────
            // After this runs once and inserts the flag row, it will NEVER run
            // again even after server restarts or redeployments.
            db.query(
                "SELECT id FROM db_migrations WHERE migration_name = 'remove_fake_dev_hostels'",
                (checkErr, flagRows) => {
                    if (checkErr || (flagRows && flagRows.length > 0)) {
                        // Already ran — skip
                        return
                    }

                    db.query(
                        "SELECT id FROM hostels WHERE name IN ('Amritam Hostel','Anugraha Hostel','Bhavani Hostel')",
                        (fErr, fakeRows) => {
                            if (fErr || !fakeRows || fakeRows.length === 0) {
                                // Fake hostels not present — mark done
                                db.query("INSERT IGNORE INTO db_migrations (migration_name) VALUES ('remove_fake_dev_hostels')", () => {})
                                return
                            }
                            const fakeIds = fakeRows.map(r => r.id)
                            const ph = fakeIds.map(() => '?').join(',')

                            // Step 1: unlink users
                            db.query(`UPDATE users SET hostel_id = NULL WHERE hostel_id IN (${ph})`, fakeIds, () => {
                                // Step 2: unlink sellers
                                db.query(`UPDATE sellers SET hostel_id = NULL WHERE hostel_id IN (${ph})`, fakeIds, () => {
                                    // Step 3: delete the fake hostel rows
                                    db.query(`DELETE FROM hostels WHERE id IN (${ph})`, fakeIds, (dErr) => {
                                        if (dErr) {
                                            console.error("Migration remove_fake_dev_hostels failed:", dErr.message)
                                        } else {
                                            console.log("[Migration] Removed legacy dev hostels (Amritam/Anugraha/Bhavani). Will NOT run again.")
                                            db.query("INSERT IGNORE INTO db_migrations (migration_name) VALUES ('remove_fake_dev_hostels')", () => {})
                                        }
                                    })
                                })
                            })
                        }
                    )
                }
            )

            // ── Seed confirmed real campus hostels (idempotent) ──────────────
            // INSERT only if the hostel does NOT already exist.
            // This NEVER deletes or modifies any Admin-created hostel row.
            const seedHostel = (name, code) => {
                db.query(
                    "INSERT INTO hostels (name, code, is_active) SELECT ?,?,1 WHERE NOT EXISTS (SELECT 1 FROM hostels WHERE code=? OR name=?)",
                    [name, code, code, name],
                    (sErr) => { if (sErr) console.error(`Hostel seed '${name}':`, sErr.message) }
                )
            }
            seedHostel('Nachiketas Hostel', 'NCH')
            seedHostel('Vyasa Hostel', 'VYS')
        })
    })
})
module.exports=db