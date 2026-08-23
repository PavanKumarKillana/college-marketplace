const hostelModel = require("../models/hostelModel");

function getPublicHostels(req, res) {
    hostelModel.getActiveHostels((err, result) => {
        if (err) res.json({ success: false, message: "Cannot get hostels list" });
        else res.json(result);
    });
}

function getAllHostelsAdmin(req, res) {
    hostelModel.getAllHostelsAdmin((err, result) => {
        if (err) res.json({ success: false, message: "Cannot get hostels" });
        else res.json(result);
    });
}

function addHostel(req, res) {
    const name = (req.body.name || "").trim();
    const code = (req.body.code || "").trim().toUpperCase();

    if (!name || !code) {
        return res.json({ success: false, message: "Hostel name and building code are required" });
    }

    hostelModel.createHostel(name, code, (err) => {
        if (err) res.json({ success: false, message: "Failed to add hostel. Name or code may be duplicate." });
        else res.json({ success: true, message: `Hostel "${name}" added successfully!` });
    });
}

function toggleHostelStatus(req, res) {
    const id = req.params.id;
    const isActive = req.body.is_active ? 1 : 0;

    hostelModel.setHostelStatus(id, isActive, (err) => {
        if (err) res.json({ success: false, message: "Cannot update hostel status" });
        else res.json({ success: true, message: isActive ? "Hostel activated!" : "Hostel marked inactive!" });
    });
}

module.exports = {
    getPublicHostels,
    getAllHostelsAdmin,
    addHostel,
    toggleHostelStatus
};
