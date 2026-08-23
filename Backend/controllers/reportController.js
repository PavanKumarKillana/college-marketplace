const reportModel = require("../models/reportModel");

function submitReport(req, res) {
    const reporterId = req.userId;
    const { product_id, seller_id, reason, description } = req.body;

    if (!reason || !reason.trim()) {
        return res.json({ success: false, message: "Please provide a reason for the report." });
    }

    reportModel.createReport(reporterId, product_id, seller_id, reason.trim(), (description || "").trim(), (err) => {
        if (err) {
            return res.json({ success: false, message: "Failed to submit report. Please try again." });
        }
        res.json({
            success: true,
            message: "Report submitted successfully. SnackDen admins will review this listing."
        });
    });
}

function getReportsAdmin(req, res) {
    reportModel.getAllReportsAdmin((err, result) => {
        if (err) res.json({ success: false, message: "Cannot load reports" });
        else res.json(result);
    });
}

function resolveReport(req, res) {
    const reportId = req.params.id;
    const status = req.body.status || "resolved"; // 'resolved' or 'dismissed'

    reportModel.updateReportStatus(reportId, status, (err) => {
        if (err) res.json({ success: false, message: "Failed to update report status" });
        else res.json({ success: true, message: `Report marked as ${status}.` });
    });
}

module.exports = {
    submitReport,
    getReportsAdmin,
    resolveReport
};
