const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            quantity: Number,
            price: Number
        }
    ],
    totalPrice: Number,
    shippingAddress: String,
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    paymentMethod: String,
    isPaid: { type: Boolean, default: false },
    paidAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
