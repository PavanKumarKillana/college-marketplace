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

function getFromAddress(label = "Notifications") {
    const smtpUser = process.env.SMTP_USER || "snackden.queries@gmail.com";
    return `"${label} - SnackDen" <${smtpUser}>`;
}

function getAppUrl() {
    return process.env.APP_URL || "https://snackden.duckdns.org";
}

async function sendOtpEmail(toEmail, otpCode) {
    const transporter = createTransporter();
    const fromAddress = getFromAddress("Security");
    const subject = "🔑 SnackDen - Password Reset OTP Code";
    const textContent = `Your password reset OTP code is: ${otpCode}. It is valid for 10 minutes. If you did not request this reset, please ignore this email.`;
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #6366f1; margin-top:0;">SnackDen Campus Marketplace</h2>
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
                replyTo: process.env.SMTP_USER || "snackden.queries@gmail.com",
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

async function sendOrderNotificationEmail(toEmail, orderId, buyerName, totalAmount) {
    const transporter = createTransporter();
    const appUrl = getAppUrl();
    const fromAddress = getFromAddress("Orders");
    const subject = `📦 SnackDen: New Order #${orderId} from ${buyerName}`;
    const textContent = `You have a new order!\n\n${buyerName} just placed Order #${orderId} for ₹${totalAmount}.\n\nView details: ${appUrl}/seller.html`;
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #4f46e5; margin-top:0;">🎉 You have a new order!</h2>
            <p style="font-size: 15px; color:#1e293b;"><strong>${buyerName}</strong> just placed Order <strong>#${orderId}</strong> for <strong>₹${totalAmount}</strong>.</p>
            <p style="font-size: 14px; color:#64748b;">Open your Seller Dashboard to prepare and confirm the order:</p>
            <div style="margin-top: 20px;">
                <a href="${appUrl}/seller.html" style="display:inline-block; padding:12px 24px; background:#4f46e5; color:#ffffff; text-decoration:none; border-radius:6px; font-weight:bold; font-size:14px;">View Order in Dashboard</a>
            </div>
        </div>
    `;

    if (transporter) {
        try {
            await transporter.sendMail({
                from: fromAddress,
                to: toEmail,
                replyTo: process.env.SMTP_USER || "snackden.queries@gmail.com",
                subject: subject,
                text: textContent,
                html: htmlContent
            });
            console.log(`[Mailer] Order alert sent to ${toEmail}`);
        } catch (err) { console.error("[Mailer] Order email err:", err.message); }
    } else {
        console.log(`[Mailer DEV MODE] Order email for Order #${orderId} would be sent to ${toEmail}`);
    }
}

async function sendChatNotificationEmail(toEmail, orderId, senderName, message) {
    const transporter = createTransporter();
    const appUrl = getAppUrl();
    const fromAddress = getFromAddress("Chat");
    const subject = `💬 SnackDen: New Message for Order #${orderId}`;
    const textContent = `New message from ${senderName} regarding Order #${orderId}:\n\n"${message}"\n\nReply at: ${appUrl}/orders.html`;
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h3 style="color: #4f46e5; margin-top:0;">New message from ${senderName}</h3>
            <p style="font-size:14px; color:#64748b; margin-bottom:8px;">Regarding Order <strong>#${orderId}</strong>:</p>
            <div style="background: #f8fafc; border-left: 3px solid #4f46e5; padding: 14px; border-radius: 4px; margin: 15px 0; font-size: 14px; color: #1e293b; font-style: italic;">
                "${message}"
            </div>
            <div style="margin-top: 20px;">
                <a href="${appUrl}/orders.html" style="display:inline-block; padding:12px 24px; background:#4f46e5; color:#ffffff; text-decoration:none; border-radius:6px; font-weight:bold; font-size:14px;">Open Order Chat</a>
            </div>
        </div>
    `;

    if (transporter) {
        try {
            await transporter.sendMail({
                from: fromAddress,
                to: toEmail,
                replyTo: process.env.SMTP_USER || "snackden.queries@gmail.com",
                subject: subject,
                text: textContent,
                html: htmlContent
            });
            console.log(`[Mailer] Chat notification sent to ${toEmail}`);
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
