const transporter = require('../utils/mailer');

async function sendOrderConfirmation(userEmail, subject, htmlContent) {
    await transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: userEmail,
        subject,
        html: htmlContent
    })

}
module.exports = { sendOrderConfirmation };