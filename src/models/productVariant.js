const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true
    },

    size: { type: String, trim: true },
    color: { type: String, trim: true },

    price: {
        type: Number,
        required: [true, 'Giá của biến thể là bắt buộc']
    },
    stock: {
        type: Number,
        required: true,
        default: 0
    },
    sku: {
        type: String,
        unique: true,
        trim: true,
        required: [true, 'SKU là bắt buộc']
    },
    images: [{
        data: Buffer,
        contentType: String
    }]
}, { timestamps: true });

module.exports = mongoose.model('ProductVariant', productVariantSchema);