// --- FILE MỚI: models/OrderItem.js ---
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({

    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true
    },
    variant: {
        type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: false,
        default: null
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Số lượng sản phẩm phải lớn hơn 0']
    },
    option: {
        type: String,
        default: null
    },
    price: {
        type: Number,
        required: true
    },

    name: {
        type: String,
        required: true
    },

    image: {
        type: String
    }
});

module.exports = mongoose.model('OrderItem', orderItemSchema);