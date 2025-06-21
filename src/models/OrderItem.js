// --- FILE MỚI: models/OrderItem.js ---
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({

    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true
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