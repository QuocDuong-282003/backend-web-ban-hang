// --- THAY THẾ TOÀN BỘ FILE: backend/src/models/Order.js ---

const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

// Schema con để lưu lịch sử cập nhật trạng thái
const statusHistorySchema = new mongoose.Schema({
    status: {
        type: String,
        required: true,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    notes: { type: String }
}, { _id: false });


const orderSchema = new mongoose.Schema({
    // --- Các trường hiện có của bạn ---
    orderCode: {
        type: String,
        required: true,
        unique: true,
        default: () => `DH-${nanoid(6).toUpperCase()}`
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'OrderItem' }],
    shippingInfo: {
        fullName: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        email: { type: String } // Thêm trường email để gửi mail
    },
    itemsPrice: { type: Number, required: true },
    shippingPrice: { type: Number, required: true, default: 0 },
    discountAmount: { type: Number, required: true, default: 0 },
    totalPrice: { type: Number, required: true },
    paymentInfo: {
        method: { type: String, required: true, enum: ['COD', 'Card', 'PayPal'] },
        status: { type: String, enum: ['pending', 'completed', 'failed'], required: true, default: 'pending' },
        transactionId: { type: String }
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
        default: 'pending'
    },
    paidAt: { type: Date },
    deliveredAt: { type: Date },
    notes: { type: String },

    // --- CÁC TRƯỜNG MỚI ĐỂ THEO DÕI ---
    estimatedDeliveryDate: { type: String },
    shippingProvider: { type: String },
    shippingTrackingCode: { type: String },
    statusHistory: [statusHistorySchema],

}, { timestamps: true });

// Tự động thêm bản ghi lịch sử đầu tiên khi tạo đơn hàng
orderSchema.pre('save', function (next) {
    if (this.isNew) {
        this.statusHistory.push({ status: 'pending', notes: 'Đơn hàng được tạo thành công.' });
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);