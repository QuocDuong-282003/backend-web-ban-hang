// --- THAY THẾ TOÀN BỘ FILE: src/models/Cart.js ---
const mongoose = require('mongoose');

// Schema cho một item trong giỏ hàng
const cartItemSchema = new mongoose.Schema({
    // Lưu ID của sản phẩm chính để tham chiếu nhanh
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    // Lưu ID của biến thể cụ thể (quan trọng nhất)
    productVariant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariant',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    // Lưu lại tên của option để tiện hiển thị
    option: {
        type: String,
        default: null
    }
});

// Schema cho toàn bộ giỏ hàng của một người dùng
const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    items: [cartItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);