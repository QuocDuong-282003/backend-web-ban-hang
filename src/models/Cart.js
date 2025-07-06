const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({

    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    variant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariant',
        required: false,
        default: null,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
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