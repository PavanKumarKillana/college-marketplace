const nodemailer = require("nodemailer");

function createTransporter() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }
    return null;
}

async function sendOtpEmail(toEmail, otpCode) {
    const transporter = createTransporter();
    const fromAddress = process.env.SMTP_FROM || `"SnackDen Security" <noreply@snackden.duckdns.org>`;
    const subject = "🔑 SnackDen - Password Reset OTP Code";
    const textContent = `Your password reset OTP code is: ${otpCode}. It is valid for 10 minutes. Do not share this code with anyone.`;
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #6366f1;">SnackDen Campus Marketplace</h2>
            <p>You requested a password reset for your SnackDen account.</p>
            <div style="background: #f1f5f9; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;">
                <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #1e293b;">${otpCode}</span>
            </div>
            <p style="font-size: 0.9em; color: #64748b;">This OTP code is valid for <strong>10 minutes</strong>. If you did not request this reset, please ignore this email.</p>
        </div>
    `;

    if (transporter) {
        try {
            await transporter.sendMail({
                from: fromAddress,
                to: toEmail,
                subject: subject,
                text: textContent,
                html: htmlContent
            });
            console.log(`[Mailer] OTP email successfully sent to ${toEmail}`);
            return { sent: true };
        } catch (err) {
            console.error(`[Mailer] Error sending OTP email: ${err.message}`);
            return { sent: false, error: err.message };
        }
    } else {
        console.log(`[Mailer DEV MODE] SMTP credentials not configured in .env. Generated OTP for ${toEmail} is: ${otpCode}`);
        return { sent: false, dev_mode: true };
    }
}

async function sendOrderNotificationEmail(toEmail, orderId, buyerName, totalAmount, appUrl = "http://localhost:3000") {
    const transporter = createTransporter();
    const fromAddress = process.env.SMTP_FROM || `"SnackDen Orders" <noreply@snackden.duckdns.org>`;
    const subject = `📦 New Order #${orderId} from ${buyerName}`;
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #f59e0b;">🎉 You have a new order!</h2>
            <p><strong>${buyerName}</strong> just placed Order <strong>#${orderId}</strong> for <strong>₹${totalAmount}</strong>.</p>
            <a href="${appUrl}/seller.html" style="display:inline-block; margin-top:15px; padding:10px 20px; background:#6366f1; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold;">View Order Details</a>
        </div>
    `;

    if (transporter) {
        try {
            await transporter.sendMail({ from: fromAddress, to: toEmail, subject, html: htmlContent });
        } catch (err) { console.error("[Mailer] Order email err:", err.message); }
    } else {
        console.log(`[Mailer DEV MODE] Order email for Order #${orderId} would be sent to ${toEmail}`);
    }
}

async function sendChatNotificationEmail(toEmail, orderId, senderName, message, appUrl = "http://localhost:3000") {
    const transporter = createTransporter();
    const fromAddress = process.env.SMTP_FROM || `"SnackDen Chat" <noreply@snackden.duckdns.org>`;
    const subject = `💬 New Message regarding Order #${orderId}`;
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h3 style="color: #6366f1;">New message from ${senderName}</h3>
            <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; margin: 15px 0; font-style: italic;">
                "${message}"
            </div>
            <a href="${appUrl}/orders.html" style="display:inline-block; padding:10px 20px; background:#6366f1; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold;">Reply Now</a>
        </div>
    `;

    if (transporter) {
        try {
            await transporter.sendMail({ from: fromAddress, to: toEmail, subject, html: htmlContent });
        } catch (err) { console.error("[Mailer] Chat email err:", err.message); }
    } else {
        console.log(`[Mailer DEV MODE] Chat notification for Order #${orderId} would be sent to ${toEmail}`);
    }
}

module.exports = {
    sendOtpEmail,
    sendOrderNotificationEmail,
    sendChatNotificationEmail
};
