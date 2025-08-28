
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ProductVariant = require('../models/productVariant');

const formatCartResponse = async (cartDocument) => {
    if (!cartDocument || !cartDocument.items || cartDocument.items.length === 0) {
        return { items: [], cartTotal: 0, totalItems: 0 };
    }
    //   lấy thông tin chi tiết
    await cartDocument.populate([
        { path: 'items.product', select: 'name images price stock' },
        { path: 'items.variant', select: 'price stock size color' }
    ]);

    let cartTotal = 0;

    const formattedItems = cartDocument.items.map(item => {
        if (!item.product) return null;

        const isVariant = !!item.variant;

        //const name = item.product.name;
        const price = isVariant && item.variant ? item.variant.price : item.product.price;
        const stock = isVariant && item.variant ? item.variant.stock : item.product.stock;

        const image = (item.product.images && item.product.images.length > 0)
            ? `data:${item.product.images[0].contentType};base64,${item.product.images[0].data.toString('base64')}`
            : null;

        const itemTotal = price * item.quantity;
        cartTotal += itemTotal;
        return {
            cartItemId: item._id,
            productId: item.product._id,
            productVariantId: item.variant?._id,
            name: item.product.name,
            option: isVariant ? `${item.variant.size || ''} ${item.variant.color || ''}`.trim() : null,
            quantity: item.quantity,
            price: price,
            image: image,
            stock: stock,
            itemTotal: itemTotal,
        };
    }).filter(Boolean);

    return {
        items: formattedItems,
        cartTotal: cartTotal,
        subtotal: cartTotal,
        totalItems: formattedItems.reduce((sum, item) => sum + item.quantity, 0)
    };
};
const getCartByUserId = async (userId) => {
    const cart = await Cart.findOne({ user: userId });
    return formatCartResponse(cart);
};
exports.getCartByUserId = getCartByUserId;


exports.addItemToCart = async ({ userId, productId, productVariantId, quantity }) => {
    // check quantity
    if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error('Số lượng phải lớn hơn 0.');
    }
    const product = await Product.findById(productId);
    if (!product) throw new Error('Không tìm thấy sản phẩm.');

    let variant = null;
    if (productVariantId) {
        variant = await ProductVariant.findById(productVariantId);
        if (!variant || !variant.product.equals(product._id)) {
            throw new Error('Phân loại sản phẩm không hợp lệ.');
        }
    } else {
        const hasVariants = await ProductVariant.exists({ product: productId });
        if (hasVariants) {
            throw new Error('Vui lòng chọn một phân loại cho sản phẩm này.');
        }
    }

    const stockAvailable = variant ? variant.stock : product.stock;
    if (stockAvailable < quantity) {
        throw new Error('Số lượng sản phẩm trong kho không đủ.');
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
        cart = new Cart({ user: userId, items: [] });
    }

    let existingItemIndex;
    if (variant) {
        existingItemIndex = cart.items.findIndex(item => item.variant && item.variant.equals(variant._id));
    } else {
        existingItemIndex = cart.items.findIndex(item => item.product.equals(product._id) && !item.variant);
    }

    if (existingItemIndex > -1) {
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;
        if (newQuantity > stockAvailable) {
            throw new Error(`Vượt quá số lượng tồn kho. Chỉ còn ${stockAvailable} sản phẩm.`);
        }
        cart.items[existingItemIndex].quantity = newQuantity;
    } else {
        cart.items.push({
            product: productId,
            variant: variant ? variant._id : null,
            quantity,
        });
    }

    await cart.save();

    return await getCartByUserId(userId);
};


exports.updateItemQuantity = async ({ userId, cartItemId, quantity }) => {
    // check quantity
    if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error('Số lượng phải lớn hơn  0.');
    }
    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw new Error('Không tìm thấy giỏ hàng.');

    const itemToUpdate = cart.items.find(i => i._id.equals(cartItemId));
    if (!itemToUpdate) throw new Error('Sản phẩm không có trong giỏ hàng.');

    await cart.populate([
        { path: 'items.product', select: 'stock name' },
        { path: 'items.variant', select: 'stock size color' }
    ]);

    // Tìm lại item sau khi đã populate để lấy được thông tin stock
    const populatedItem = cart.items.find(i => i._id.equals(cartItemId));

    // Lấy số lượng tồn kho từ sản phẩm hoặc biến thể tương ứng
    const stockAvailable = itemToUpdate.variant ? itemToUpdate.variant.stock : itemToUpdate.product.stock;

    if (stockAvailable < quantity) {
        throw new Error('Số lượng sản phẩm trong kho không đủ.');
    }

    itemToUpdate.quantity = quantity;

    // Lưu lại toàn bộ giỏ hàng
    await cart.save();

    // Trả về giỏ hàng đã được định dạng lại
    return getCartByUserId(userId);
};



exports.removeItemFromCart = async ({ userId, cartItemId }) => {
    await Cart.updateOne(
        { user: userId },
        { $pull: { items: { _id: cartItemId } } }
    );
    return getCartByUserId(userId);
};


exports.clearCart = async (userId) => {
    await Cart.updateOne({ user: userId }, { $set: { items: [] } });
    return { items: [], cartTotal: 0, totalItems: 0 };
};