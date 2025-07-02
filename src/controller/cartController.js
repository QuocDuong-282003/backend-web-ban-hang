// --- THAY THẾ TOÀN BỘ FILE: src/controller/cartController.js ---
const cartService = require('../services/cartService');

exports.getCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await cartService.getCartByUserId(userId);
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy giỏ hàng', error: error.message });
    }
};

exports.addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        // Controller nhận đúng các tham số từ frontend
        const { productId, quantity, option } = req.body;

        if (!productId || !quantity) {
            return res.status(400).json({ message: 'Thiếu thông tin sản phẩm hoặc số lượng.' });
        }

        // Truyền đúng các tham số này cho service
        const cart = await cartService.addItemToCart({ userId, productId, quantity, option });
        res.status(200).json({ message: "Thêm sản phẩm vào giỏ hàng thành công!", data: cart });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateCartItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cartItemId } = req.params; // Lấy ID của item trong giỏ hàng
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({ message: 'Số lượng không hợp lệ.' });
        }

        const cart = await cartService.updateItemQuantity({ userId, cartItemId, quantity });
        res.status(200).json({ message: 'Cập nhật giỏ hàng thành công!', data: cart });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.removeCartItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cartItemId } = req.params;

        const cart = await cartService.removeItemFromCart({ userId, cartItemId });
        res.status(200).json({ message: 'Xóa sản phẩm khỏi giỏ hàng thành công!', data: cart });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};