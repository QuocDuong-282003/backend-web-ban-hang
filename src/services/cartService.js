
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ProductVariant = require('../models/productVariant');
const formatCartResponse = async (cartDocument) => {
    if (!cartDocument || !cartDocument.items || cartDocument.items.length === 0) {
        return { items: [], subtotal: 0, totalItems: 0 };
    }

    // Populate thông tin chi tiết của từng biến thể và sản phẩm cha của nó
    await cartDocument.populate({
        path: 'items.productVariant',
        select: 'price stock sku size color',
        populate: {
            path: 'product',
            select: 'name images discount',
            populate: { path: 'discount' }
        }
    });

    let subtotal = 0;
    const formattedItems = [];

    for (const item of cartDocument.items) {
        // Kiểm tra xem populate có thành công không
        if (item.productVariant && item.productVariant.product) {
            const variant = item.productVariant;
            const product = variant.product;
            let finalPrice = variant.price;

            if (product.discount && product.discount.isActive) {
                const discount = product.discount;
                const discountAmount = discount.discountType === 'percent' ? variant.price * (discount.value / 100) : discount.value;
                finalPrice = Math.max(0, variant.price - discountAmount);
            }

            const imageBase64 = (product.images && product.images.length > 0)
                ? `data:${product.images[0].contentType};base64,${product.images[0].data.toString('base64')}`
                : null;

            formattedItems.push({
                cartItemId: item._id,
                productId: product._id,
                productVariantId: variant._id,
                name: product.name,
                option: variant.size || variant.color, // Lấy tên tùy chọn từ biến thể
                quantity: item.quantity,
                price: finalPrice,
                image: imageBase64,
                stock: variant.stock,
                lineTotal: finalPrice * item.quantity
            });
            subtotal += finalPrice * item.quantity;
        }
    }
    return { items: formattedItems, subtotal, totalItems: formattedItems.reduce((sum, item) => sum + item.quantity, 0) };
};



exports.addItemToCart = async ({ userId, productId, quantity, option }) => {
    let variant;

    // Tìm biến thể dựa trên ID sản phẩm cha và tên tùy chọn (option)
    if (option) {
        // Giả sử tên tùy chọn được lưu trong trường 'size' của ProductVariant
        variant = await ProductVariant.findOne({ product: productId, size: option });
    } else {
        // Nếu không có tùy chọn, tìm biến thể mặc định của sản phẩm đó
        variant = await ProductVariant.findOne({ product: productId });
    }

    // Nếu không tìm thấy biến thể nào phù hợp -> báo lỗi
    if (!variant) {
        throw new Error('Sản phẩm với tùy chọn này không tồn tại hoặc đã hết hàng.');
    }

    // Kiểm tra tồn kho của biến thể
    if (variant.stock < quantity) {
        throw new Error(`Sản phẩm "${variant.product.name} - ${option}" không đủ tồn kho.`);
    }

    // Tìm giỏ hàng của user, nếu chưa có thì tạo mới
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
        cart = new Cart({ user: userId, items: [] });
    }

    // Kiểm tra xem biến thể này đã có trong giỏ hàng chưa
    const existingItemIndex = cart.items.findIndex(item => item.productVariant.equals(variant._id));

    if (existingItemIndex > -1) {
        // Nếu đã có, cập nhật số lượng
        cart.items[existingItemIndex].quantity += quantity;
    } else {
        // Nếu chưa có, thêm item mới vào giỏ hàng
        cart.items.push({
            product: productId,
            productVariant: variant._id,
            quantity: quantity,
            option: option
        });
    }

    await cart.save();

    return formatCartResponse(cart);
};


exports.getCartByUserId = async (userId) => {
    const cart = await Cart.findOne({ user: userId });
    return formatCartResponse(cart);
};

exports.updateItemQuantity = async ({ userId, cartItemId, quantity }) => {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw new Error('Không tìm thấy giỏ hàng.');

    const item = cart.items.find(i => i._id.equals(cartItemId));
    if (!item) throw new Error('Sản phẩm không có trong giỏ hàng.');

    const variant = await ProductVariant.findById(item.productVariant);
    if (!variant) throw new Error('Sản phẩm liên kết không tồn tại.');
    if (variant.stock < quantity) throw new Error('Số lượng sản phẩm trong kho không đủ.');

    item.quantity = quantity;
    await cart.save();
    return formatCartResponse(cart);
};

exports.removeItemFromCart = async ({ userId, cartItemId }) => {
    await Cart.updateOne(
        { user: userId },
        { $pull: { items: { _id: cartItemId } } }
    );
    const updatedCart = await Cart.findOne({ user: userId });
    return formatCartResponse(updatedCart);
};

exports.clearCart = async (userId) => {
    await Cart.updateOne({ user: userId }, { $set: { items: [] } });
    return { items: [], subtotal: 0, totalItems: 0 };
};