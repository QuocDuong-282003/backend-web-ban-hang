const nodemailer = require('nodemailer');

// Tạo transporter cho email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.FROM_EMAIL,
        pass: process.env.EMAIL_PASSWORD,
    }
});

/**
 * Tạo HTML template cho email OTP
 * @param {string} otp - Mã OTP 6 chữ số
 * @param {string} type - Loại OTP: 'register', 'reset-password', 'login'
 * @returns {string} HTML template
 */
const createOTPEmailTemplate = (otp, type = 'register') => {
    const subjectMap = {
        'register': 'Mã xác thực đăng ký tài khoản',
        'reset-password': 'Mã xác thực đặt lại mật khẩu',
        'login': 'Mã xác thực đăng nhập'
    };

    const titleMap = {
        'register': 'Xác thực đăng ký tài khoản',
        'reset-password': 'Đặt lại mật khẩu',
        'login': 'Xác thực đăng nhập'
    };

    const messageMap = {
        'register': 'Mã xác thực để hoàn tất đăng ký tài khoản của bạn:',
        'reset-password': 'Mã xác thực để đặt lại mật khẩu của bạn:',
        'login': 'Mã xác thực để đăng nhập vào tài khoản của bạn:'
    };

    return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subjectMap[type] || 'Mã xác thực OTP'}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                                ${titleMap[type] || 'Mã xác thực OTP'}
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Xin chào,
                            </p>
                            <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 30px 0;">
                                ${messageMap[type] || 'Mã xác thực OTP của bạn:'}
                            </p>
                            
                            <!-- OTP Box -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 20px; display: inline-block;">
                                            <span style="color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                                ${otp}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #999999; font-size: 12px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                                Mã này sẽ hết hạn sau <strong style="color: #667eea;">5 phút</strong>.
                            </p>
                            <p style="color: #999999; font-size: 12px; line-height: 1.6; margin: 10px 0 0 0; text-align: center;">
                                Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
                            <p style="color: #999999; font-size: 12px; line-height: 1.6; margin: 0;">
                                Đây là email tự động, vui lòng không trả lời.
                            </p>
                            <p style="color: #999999; font-size: 12px; line-height: 1.6; margin: 10px 0 0 0;">
                                © ${new Date().getFullYear()} ${process.env.SHOP_NAME || 'P&T Shop'}. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
};

/**
 * Gửi email OTP
 * @param {string} email - Email người nhận
 * @param {string} otp - Mã OTP 6 chữ số
 * @param {string} type - Loại OTP: 'register', 'reset-password', 'login' (mặc định: 'register')
 * @returns {Promise<void>}
 */
exports.sendEmailOTP = async (email, otp, type = 'register') => {
    const subjectMap = {
        'register': 'Mã xác thực đăng ký tài khoản',
        'reset-password': 'Mã xác thực đặt lại mật khẩu',
        'login': 'Mã xác thực đăng nhập'
    };

    const mailOptions = {
        from: `"${process.env.SHOP_NAME || 'P&T Shop'}" <${process.env.FROM_EMAIL}>`,
        to: email,
        subject: subjectMap[type] || 'Mã xác thực OTP',
        html: createOTPEmailTemplate(otp, type),
        text: `Mã xác thực OTP của bạn là: ${otp}. Mã này sẽ hết hạn sau 5 phút.`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email OTP đã được gửi đến: ${email}`);
    } catch (error) {
        console.error(`❌ Lỗi gửi email OTP đến ${email}:`, error);
        throw new Error('Không thể gửi email. Vui lòng thử lại sau.');
    }
};
