const { sendOrderConfirmation } = require('../services/emailService');

exports.createOrderEmail = async (req, res) => {
    try {
        // Lấy thông tin đơn hàng và user từ request hoặc từ DB
        const { order, user } = req.body; // hoặc lấy từ DB nếu cần

        const subject = `Xác nhận đơn hàng #${order.orderCode} từ P&T Shop`;
        const htmlContent = `
            <h2>Cảm ơn bạn đã đặt hàng!</h2>
            <p>Chào ${user.name},</p>
            <p>Đơn hàng #${order.orderCode} của bạn đã được tiếp nhận vào ngày ${new Date(order.createdAt).toLocaleString('vi-VN')} và đang được xử lý.</p>
            <hr>
            <h3>Chi tiết đơn hàng</h3>
            <p><strong>Địa chỉ giao hàng:</strong> ${order.shippingInfo.address}</p>
            <p><strong>Hình thức thanh toán:</strong> ${order.paymentMethod}</p>
            <p><strong>Tổng cộng:</strong> ${order.totalPrice.toLocaleString('vi-VN')} ₫</p>
        `;

        await sendOrderConfirmation(user.email, subject, htmlContent);

        res.status(201).json({ order, message: 'Đặt hàng thành công, email xác nhận đã được gửi!' });
    } catch (error) {
        console.error('Lỗi gửi mail:', error);
        res.status(500).json({ message: 'Đặt hàng thất bại hoặc gửi mail lỗi.' });
    }
};