const db = require("../config/db");

function getActiveHostels(callback) {
    db.query("SELECT * FROM hostels WHERE is_active = 1 ORDER BY name ASC", (err, result) => {
        if (err) callback(err, null);
        else callback(null, result);
    });
}

function getAllHostelsAdmin(callback) {
    db.query("SELECT * FROM hostels ORDER BY id DESC", (err, result) => {
        if (err) callback(err, null);
        else callback(null, result);
    });
}

function createHostel(name, code, callback) {
    db.query("INSERT INTO hostels (name, code, is_active) VALUES (?, ?, 1)", [name, code], (err, result) => {
        if (err) callback(err, null);
        else callback(null, result);
    });
}

function setHostelStatus(id, isActive, callback) {
    db.query("UPDATE hostels SET is_active = ? WHERE id = ?", [isActive, id], (err, result) => {
        if (err) callback(err, null);
        else callback(null, result);
    });
}

module.exports = {
    getActiveHostels,
    getAllHostelsAdmin,
    createHostel,
    setHostelStatus
};
