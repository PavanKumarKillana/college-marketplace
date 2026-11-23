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
    const subject = "SnackDen: Password reset verification code";
    const textContent = `Hello,\n\nYour SnackDen verification code is: ${otpCode}\n\nThis code is valid for 10 minutes. If you did not request this, you can safely ignore this email.\n\nBest regards,\nSnackDen Team`;
    const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827; padding: 24px; max-width: 520px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 6px;">
            <p style="font-size: 16px; font-weight: 600; margin-top: 0; color: #111827;">SnackDen Campus Marketplace</p>
            <p style="font-size: 14px; line-height: 1.5; color: #374151;">You requested a password reset for your SnackDen account. Use the code below to continue:</p>
            <div style="background-color: #f3f4f6; border-radius: 4px; padding: 12px; text-align: center; margin: 20px 0;">
                <span style="font-size: 26px; font-weight: 700; letter-spacing: 6px; color: #111827;">${otpCode}</span>
            </div>
            <p style="font-size: 13px; color: #6b7280; line-height: 1.5; margin-bottom: 0;">This code will expire in 10 minutes. If you did not make this request, please disregard this email.</p>
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
            console.log(`[Mailer] OTP email sent to ${toEmail}`);
            return { sent: true };
        } catch (err) {
            console.error(`[Mailer] Error sending OTP email: ${err.message}`);
            return { sent: false, error: err.message };
        }
    } else {
        console.log(`[Mailer DEV MODE] OTP for ${toEmail}: ${otpCode}`);
        return { sent: false, dev_mode: true };
    }
}

async function sendOrderNotificationEmail(toEmail, orderId, buyerName, totalAmount) {
    const transporter = createTransporter();
    const appUrl = getAppUrl();
    const fromAddress = getFromAddress("Orders");
    const subject = `SnackDen: Order #${orderId} received from ${buyerName}`;
    const textContent = `Hello,\n\nYou have received a new order on SnackDen.\n\nOrder #${orderId}\nBuyer: ${buyerName}\nTotal Amount: Rs. ${totalAmount}\n\nPlease visit your seller dashboard to review the order details and manage fulfillment: ${appUrl}/seller.html\n\nBest regards,\nSnackDen Team`;
    const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827; padding: 24px; max-width: 520px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 6px;">
            <p style="font-size: 16px; font-weight: 600; margin-top: 0; color: #111827;">SnackDen Orders</p>
            <p style="font-size: 14px; line-height: 1.5; color: #374151;">You have received a new order on your store:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
                <tr>
                    <td style="padding: 6px 0; color: #6b7280;">Order ID:</td>
                    <td style="padding: 6px 0; font-weight: 600; text-align: right;">#${orderId}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; color: #6b7280;">Buyer:</td>
                    <td style="padding: 6px 0; font-weight: 600; text-align: right;">${buyerName}</td>
                </tr>
                <tr>
                    <td style="padding: 6px 0; color: #6b7280;">Total Amount:</td>
                    <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #111827;">Rs. ${totalAmount}</td>
                </tr>
            </table>
            <p style="margin: 20px 0 0 0;">
                <a href="${appUrl}/seller.html" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 4px; font-size: 13px; font-weight: 600;">View in Seller Dashboard</a>
            </p>
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
        console.log(`[Mailer DEV MODE] Order #${orderId} notification to ${toEmail}`);
    }
}

async function sendChatNotificationEmail(toEmail, orderId, senderName, message) {
    const transporter = createTransporter();
    const appUrl = getAppUrl();
    const fromAddress = getFromAddress("Chat");
    const subject = `SnackDen: New message regarding Order #${orderId}`;
    const textContent = `Hello,\n\nYou have a new message from ${senderName} regarding Order #${orderId}:\n\n"${message}"\n\nYou can reply directly on SnackDen: ${appUrl}/orders.html\n\nBest regards,\nSnackDen Team`;
    const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827; padding: 24px; max-width: 520px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 6px;">
            <p style="font-size: 16px; font-weight: 600; margin-top: 0; color: #111827;">SnackDen Chat</p>
            <p style="font-size: 14px; line-height: 1.5; color: #374151;">You have a new message from <strong>${senderName}</strong> regarding <strong>Order #${orderId}</strong>:</p>
            <div style="background-color: #f9fafb; border-left: 3px solid #6b7280; padding: 12px 14px; margin: 16px 0; font-size: 14px; color: #374151;">
                ${message}
            </div>
            <p style="margin: 20px 0 0 0;">
                <a href="${appUrl}/orders.html" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 4px; font-size: 13px; font-weight: 600;">Reply to Message</a>
            </p>
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
        console.log(`[Mailer DEV MODE] Chat alert for Order #${orderId} to ${toEmail}`);
    }
}

module.exports = {
    sendOtpEmail,
    sendOrderNotificationEmail,
    sendChatNotificationEmail
};
