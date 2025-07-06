// --- THAY THẾ TOÀN BỘ FILE: src/controller/cartController.js ---

const cartService = require('../services/cartService');

exports.getCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await cartService.getCartByUserId(userId);
        res.status(200).json(cart);
    } catch (error) {
        console.error("Error in getCart controller:", error);
        res.status(500).json({ message: 'Lỗi server khi lấy giỏ hàng', error: error.message });
    }
};

exports.addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        // **SỬA Ở ĐÂY: Nhận cả productVariantId từ frontend**
        const { productId, productVariantId, quantity } = req.body;

        if (!productId || !quantity || quantity < 1) {
            return res.status(400).json({ message: 'Thiếu thông tin sản phẩm hoặc số lượng.' });
        }

        // Truyền tất cả thông tin cho service
        const cart = await cartService.addItemToCart({ userId, productId, productVariantId, quantity });
        res.status(200).json({ message: "Thêm sản phẩm vào giỏ hàng thành công!", data: cart });
    } catch (error) {
        console.error("Error in addToCart controller:", error);
        res.status(400).json({ message: error.message });
    }
};

exports.updateCartItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const cartItemId = req.params.id; // Lấy từ URL params
        const { quantity } = req.body;

        if (!cartItemId || !quantity || quantity < 1) {
            return res.status(400).json({ message: 'Dữ liệu không hợp lệ.' });
        }

        const cart = await cartService.updateItemQuantity({ userId, cartItemId, quantity });
        res.status(200).json({ message: 'Cập nhật giỏ hàng thành công!', data: cart });
    } catch (error) {
        console.error("Error in updateCartItem controller:", error);
        res.status(400).json({ message: error.message });
    }
};

exports.removeCartItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const cartItemId = req.params.id; // Lấy từ URL params

        if (!cartItemId) {
            return res.status(400).json({ message: 'Thiếu thông tin sản phẩm cần xóa.' });
        }

        const cart = await cartService.removeItemFromCart({ userId, cartItemId });
        res.status(200).json({ message: 'Xóa sản phẩm khỏi giỏ hàng thành công!', data: cart });
    } catch (error) {
        console.error("Error in removeCartItem controller:", error);
        res.status(400).json({ message: error.message });
    }
};