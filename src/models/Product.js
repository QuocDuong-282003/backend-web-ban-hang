const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, unique: false },
    description: String,
    price: { type: Number, required: true },
    stock: Number,
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: false },
    brand: String,

    images: [{
        data: Buffer,       // Dữ liệu ảnh thô
        contentType: String // Kiểu file, ví dụ: 'image/jpeg'
    }],
    sold: { type: Number, default: 0 },
    isFlashSale: { type: Boolean, default: false },
    discount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Discount',
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
