const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        index: true
    },
    code: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['register', 'login', 'reset-password'],
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expireAfterSeconds: 0 } // Tự động xóa sau khi hết hạn
    },
    attempts: {
        type: Number,
        default: 0,
        max: 5 // Giới hạn số lần thử
    },
    verified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Index để tìm OTP nhanh
otpSchema.index({ email: 1, type: 1, verified: 1 });

module.exports = mongoose.model('OTP', otpSchema);

