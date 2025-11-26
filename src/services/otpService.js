const OTP = require('../models/OTP');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Tạo transporter cho email (sử dụng SendGrid hoặc Gmail)
const getTransporter = () => {
    // Nếu có SENDGRID_API_KEY thì dùng SendGrid
    if (process.env.SENDGRID_API_KEY) {
        try {
            const transport = require('nodemailer-sendgrid-transport');
            return nodemailer.createTransport(
                transport({
                    auth: {
                        api_key: process.env.SENDGRID_API_KEY,
                    },
                })
            );
        } catch (error) {
            console.error('Lỗi khởi tạo SendGrid transporter:', error);
            throw new Error('Không thể khởi tạo SendGrid transporter');
        }
    }

    // Nếu không có SendGrid thì dùng Gmail
    if (!process.env.FROM_EMAIL || !process.env.EMAIL_PASSWORD) {
        throw new Error('Cần cấu hình FROM_EMAIL và EMAIL_PASSWORD để sử dụng Gmail, hoặc SENDGRID_API_KEY để sử dụng SendGrid');
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.FROM_EMAIL,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

// Tạo mã OTP 6 chữ số
const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

// Gửi OTP qua email
exports.sendOTP = async (email, type = 'register') => {
    // Xóa các OTP cũ của email này (chưa verify)
    await OTP.deleteMany({ email, type, verified: false });

    // Tạo mã OTP mới
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Hết hạn sau 5 phút

    // Lưu OTP vào database
    const otp = new OTP({
        email,
        code,
        type,
        expiresAt
    });
    await otp.save();

    // Kiểm tra cấu hình email
    if (!process.env.FROM_EMAIL) {
        await OTP.findByIdAndDelete(otp._id);
        throw new Error('Cấu hình email chưa được thiết lập. Vui lòng liên hệ admin.');
    }

    // Gửi email
    let transporter;
    try {
        transporter = getTransporter();
    } catch (transporterError) {
        await OTP.findByIdAndDelete(otp._id);
        console.error('Lỗi tạo transporter:', transporterError);
        throw new Error('Cấu hình email không hợp lệ. Vui lòng kiểm tra SENDGRID_API_KEY hoặc EMAIL_PASSWORD.');
    }

    const mailOptions = {
        from: `"${process.env.SHOP_NAME || 'P&T Shop'}" <${process.env.FROM_EMAIL}>`,
        to: email,
        subject: type === 'register'
            ? 'Mã xác thực đăng ký tài khoản'
            : type === 'login'
                ? 'Mã xác thực đăng nhập'
                : 'Mã xác thực đặt lại mật khẩu',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Xin chào!</h2>
                <p>Mã xác thực của bạn là:</p>
                <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
                    <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${code}</h1>
                </div>
                <p>Mã này sẽ hết hạn sau <strong>5 phút</strong>.</p>
                <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 12px;">Đây là email tự động, vui lòng không trả lời.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true, message: 'Mã OTP đã được gửi đến email của bạn' };
    } catch (error) {
        // Xóa OTP nếu gửi email thất bại
        await OTP.findByIdAndDelete(otp._id);

        // Thông báo lỗi chi tiết hơn
        let errorMessage = 'Không thể gửi email. Vui lòng thử lại sau.';

        // Xử lý lỗi từ SendGrid
        if (error.response) {
            const responseBody = error.response.body;

            // SendGrid trả về errors array
            if (responseBody?.errors && Array.isArray(responseBody.errors) && responseBody.errors.length > 0) {
                const sendGridError = responseBody.errors[0];
                const sendGridMessage = sendGridError.message || sendGridError.field || 'Không xác định';
                
                // Xử lý lỗi "Maximum credits exceeded"
                if (sendGridMessage.includes('Maximum credits exceeded') || 
                    sendGridMessage.includes('credits') ||
                    sendGridMessage.includes('quota')) {
                    errorMessage = 'SendGrid đã hết quota. Vui lòng chuyển sang Gmail hoặc nâng cấp SendGrid plan.';
                } else {
                    errorMessage = `Lỗi SendGrid: ${sendGridMessage}`;
                }
            }
            // SendGrid có thể trả về message trực tiếp
            else if (responseBody?.message) {
                if (responseBody.message.includes('Maximum credits exceeded') || 
                    responseBody.message.includes('credits') ||
                    responseBody.message.includes('quota')) {
                    errorMessage = 'SendGrid đã hết quota. Vui lòng chuyển sang Gmail hoặc nâng cấp SendGrid plan.';
                } else {
                    errorMessage = `Lỗi SendGrid: ${responseBody.message}`;
                }
            }
            // Hoặc có thể là lỗi khác
            else {
                errorMessage = `Lỗi gửi email: ${error.message || 'Không xác định'}`;
            }
        }
        // Lỗi xác thực
        else if (error.code === 'EAUTH') {
            errorMessage = 'Lỗi xác thực email. Vui lòng kiểm tra EMAIL_PASSWORD hoặc SENDGRID_API_KEY.';
        }
        // Lỗi kết nối
        else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
            errorMessage = 'Không thể kết nối đến server email. Vui lòng kiểm tra kết nối internet.';
        }
        // Lỗi khác
        else if (error.message) {
            errorMessage = `Lỗi: ${error.message}`;
        }

        throw new Error(errorMessage);
    }
};

// Xác thực OTP
exports.verifyOTP = async (email, code, type = 'register') => {
    // Tìm OTP hợp lệ
    const otp = await OTP.findOne({
        email,
        code,
        type,
        verified: false,
        expiresAt: { $gt: new Date() } // Chưa hết hạn
    });

    if (!otp) {
        // Tăng số lần thử nếu có OTP nhưng sai mã
        const existingOTP = await OTP.findOne({ email, type, verified: false });
        if (existingOTP) {
            existingOTP.attempts += 1;
            if (existingOTP.attempts >= 5) {
                await OTP.deleteMany({ email, type, verified: false });
                throw new Error('Đã vượt quá số lần thử. Vui lòng yêu cầu mã mới.');
            }
            await existingOTP.save();
        }
        throw new Error('Mã OTP không hợp lệ hoặc đã hết hạn.');
    }

    // Đánh dấu OTP đã được sử dụng
    otp.verified = true;
    await otp.save();

    // Xóa các OTP cũ của email này
    await OTP.deleteMany({ email, type, _id: { $ne: otp._id } });

    return { success: true, message: 'Xác thực OTP thành công' };
};

// Kiểm tra xem email đã có OTP chưa verify chưa
exports.hasPendingOTP = async (email, type = 'register') => {
    const otp = await OTP.findOne({
        email,
        type,
        verified: false,
        expiresAt: { $gt: new Date() }
    });
    return !!otp;
};

