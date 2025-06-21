// --- CẬP NHẬT FILE: models/Order.js ---
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const orderSchema = new mongoose.Schema({
    orderCode: {
        type: String,
        required: true,
        unique: true,
        default: () => `DH-${nanoid(4).toLowerCase()}`
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // THAY ĐỔI QUAN TRỌNG:
    // Trường này giờ đây sẽ chứa một mảng các ID tham chiếu tới các OrderItem.
    // Điều này cực kỳ quan trọng để dùng .populate() hiệu quả.
    items: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrderItem'
    }],
    shippingInfo: {
        fullName: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        phoneNumber: { type: String, required: true },
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
    notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);