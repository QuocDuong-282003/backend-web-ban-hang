const orderService = require('../services/orderService');
const emailService = require('../services/emailService');


//
exports.createOrder = async (req, res) => {

    try {
        const userId = req.body.userId || req.user?.id;
        const { items, shippingInfo, paymentMethod, notes } = req.body;

        if (!userId || !items || !shippingInfo || !paymentMethod) {
            return res.status(400).json({ message: 'Thieu thong tin de tao don hang' });

        }
        if (!shippingInfo.email && req.user?.email) {
            shippingInfo.email = req.user.email;
        }
        const orderInput = {
            userId, items,
            shippingInfo, paymentMethod, notes
        };
        const order = await orderService.createOrder(orderInput);

        if (shippingInfo.email) {
            emailService.sendOrderConfirmationEmail(order, shippingInfo.email);
        }
        res.status(201).json({ message: 'Dat hang thanh cong', order });

    } catch (error) {
        console.error('Loi controller khi tao don hang', error);
        res.status(400).json({ message: error.message });
    }
};
exports.getAllOrders = async (req, res) => {
    try {
        const options = {
            page: req.query.page,
            limit: req.query.limit,
            search: req.query.search,
        };

        const orders = await orderService.getAllOrders(options);
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'loi server', error: error.message });

    }
};
exports.updateOrderStatus = async (req, res) => {
    try {
        const updateData = req.body;
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'Không có thông tin cập nhật.' });
        }
        const updatedOrder = await orderService.updateOrderStatus(req.params.id, updateData);
        res.status(200).json(updatedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getMyOrders = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Vui lòng đăng nhập để xem đơn hàng.' });
        }
        const orders = await orderService.findOrdersByUserId(userId);
        res.status(200).json({ orders });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};
exports.getOrderByIdForUser = async (req, res) => {
    try {
        const orderId = req.params.id;
        const userId = req.user?.id; // Lấy userId từ token (nếu có)

        const order = await orderService.findOrderById(orderId, userId);

        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng hoặc bạn không có quyền xem.' });
        }
        res.status(200).json({ order });
    } catch (error) {
        console.error("Lỗi controller khi lấy chi tiết đơn hàng:", error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};