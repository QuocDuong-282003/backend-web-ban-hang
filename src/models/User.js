const mongoose = require('mongoose');
const Stat = require('./Stat'); // đúng đường dẫn tới file Stat.js

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    isVerified: { type: Boolean, default: false },
    otp: String,
    otpExpire: Date,
    password: {
        type: String,
        // Không bắt buộc - có thể đăng ký bằng OTP hoặc Google
        // User phải có ít nhất một trong: password, googleId, hoặc isEmailVerified (OTP)
    },
    phone: String,
    address: String,
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    status: { type: String, enum: ['active', 'banned', 'inactive'], default: 'active' },
    avatar: { type: String },
    googleId: { type: String, sparse: true }, // Cho phép null, unique nếu có giá trị
    isEmailVerified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// Index cho googleId
userSchema.index({ googleId: 1 }, { sparse: true });



module.exports = mongoose.model('User', userSchema);
