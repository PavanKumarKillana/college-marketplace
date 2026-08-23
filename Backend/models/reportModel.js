const db = require("../config/db");

function createReport(reporterId, productId, sellerId, reason, description, callback) {
    const query = `
        INSERT INTO reports (reporter_id, product_id, seller_id, reason, description, status)
        VALUES (?, ?, ?, ?, ?, 'open')
    `;
    db.query(query, [reporterId, productId || null, sellerId || null, reason, description || null], (err, result) => {
        if (err) callback(err, null);
        else callback(null, result);
    });
}

function getAllReportsAdmin(callback) {
    const query = `
        SELECT r.*, 
               u.email AS reporter_email,
               p.title AS product_title, p.is_active AS product_is_active,
               s.store_name, s.id AS seller_id
        FROM reports r
        LEFT JOIN users u ON r.reporter_id = u.id
        LEFT JOIN products p ON r.product_id = p.id
        LEFT JOIN sellers s ON r.seller_id = s.id OR p.seller_id = s.id
        ORDER BY r.id DESC
    `;
    db.query(query, (err, result) => {
        if (err) callback(err, null);
        else callback(null, result);
    });
}

function updateReportStatus(id, status, callback) {
    db.query("UPDATE reports SET status = ? WHERE id = ?", [status, id], (err, result) => {
        if (err) callback(err, null);
        else callback(null, result);
    });
}

module.exports = {
    createReport,
    getAllReportsAdmin,
    updateReportStatus
};
