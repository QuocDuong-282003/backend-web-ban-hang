const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },

    slug: { type: String, unique: true, index: true },
    description: String,
    price: { type: Number, required: true },
    brand: {
        type: String,
        required: [true, 'Thương hiệu là bắt buộc'],
        trim: true
    },
    stock: Number,
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: false },

    variants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariant'
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    images: [{
        data: Buffer,       // Dữ liệu ảnh thô
        contentType: String // Kiểu file, ví dụ: 'image/jpeg'
    }],
    options: [{ type: String }],
    sold: { type: Number, default: 0 },
    rating: {
        type: Number,
        default: 0 // Rating trung bình, sẽ được tính toán lại mỗi khi có review mới
    },
    isFlashSale: { type: Boolean, default: false },
    numReviews: {
        type: Number,
        default: 0 // Tổng số lượng review
    },
    discount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Discount',
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
