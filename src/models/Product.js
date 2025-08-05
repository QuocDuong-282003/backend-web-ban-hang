const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },

    slug: { type: String, unique: true, index: true },
    description: String,
    price: { type: Number, required: true },
    brand: {
        type: String,
        required: [true, 'Thương hiệu là bắt buộc'],
        trim: true,
        uppercase: true
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
        data: Buffer,
        contentType: String
    }],
    options: [{ type: String }],
    sold: { type: Number, default: 0 },
    rating: {
        type: Number,
        default: 0
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
