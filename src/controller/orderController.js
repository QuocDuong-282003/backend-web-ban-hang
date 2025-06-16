const orderService = require('../services/orderService');


//
exports.createOrder = async (req, res) => {
    try {
        const userId = req.body.userId || req.user?.id;
        const { items, shippingInfo, paymentMethod, notes } = req.body;

        if (!userId || !items || !shippingInfo || !paymentMethod) {
            return res.status(400).json({ message: 'Thieu thong tin de tao don hang' });

        }
        const orderInput = {
            userId, cartItems: items,
            shippingInfo, paymentMethod, notes
        };
        const order = await orderService.createOrder(orderInput);
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
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ message: 'Trang thai khong duoc de trong' });
        }
        const updateOrder = await orderService.updateOrderStatus(req.params.id, status);
        res.status(200).json(updateOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}
