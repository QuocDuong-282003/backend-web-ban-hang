
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');
const orderSchema = new mongoose.Schema({
    // 1. Mã đơn hàng để người dùng dễ tra cứu (thay vì dùng _id khó nhớ)
    orderCode: {
        type: String,
        required: true,
        unique: true,
        default: () => `DH-${nanoid(5)}` // Tự động tạo mã dạng DH-xxxxxxxx
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true }, // Giá của sản phẩm tại thời điểm mua
        name: { type: String, required: true }, // Lưu lại tên sản phẩm để tránh lỗi nếu sản phẩm bị xóa
        image: { type: String } // Lưu lại URL ảnh đầu tiên của sản phẩm
    }],

    // 2. Cấu trúc lại việc tính toán giá
    itemsPrice: { type: Number, required: true }, // Tổng tiền của các sản phẩm (chưa có ship, chưa giảm giá)
    shippingPrice: { type: Number, required: true, default: 0 },
    discountAmount: { type: Number, required: true, default: 0 }, // Số tiền được giảm
    totalPrice: { type: Number, required: true }, // Giá cuối cùng khách phải trả

    // 3. Cấu trúc lại địa chỉ giao hàng
    shippingInfo: {
        fullName: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        phoneNumber: { type: String, required: true },
    },

    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
        default: 'pending'
    },

    // 4. Cấu trúc lại thông tin thanh toán
    paymentInfo: {
        method: { type: String, required: true, enum: ['COD', 'Card', 'PayPal'] }, // Ví dụ: COD, thanh toán online
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            required: true,
            default: 'pending'
        },
        transactionId: { type: String } // ID giao dịch từ cổng thanh toán (Stripe, PayPal,...)
    },
    paidAt: { type: Date },

    // 5. Thông tin giao hàng
    deliveredAt: { type: Date },
    notes: { type: String } // Ghi chú của khách hàng

}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);