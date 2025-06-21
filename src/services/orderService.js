const mongoose = require('mongoose');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');

const ALLOWED_TRANSITIONS = {
    pending: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered', 'cancelled'],
    delivered: ['refunded'],
    cancelled: [],
    refunded: [],
};


// === 1. TẠO ĐƠN HÀNG 
exports.createOrder = async (orderInput) => {
    const { userId, cartItems, shippingInfo, paymentMethod, notes } = orderInput;
    if (!cartItems || cartItems.length === 0) throw new Error('Giỏ hàng không được để trống.');

    // Bước 1: Lấy thông tin sản phẩm và tính toán giá
    const productIds = cartItems.map(item => item.productId);
    const productsFromDB = await Product.find({ _id: { $in: productIds } }).populate('discount');
    const productMap = new Map(productsFromDB.map(p => [p._id.toString(), p]));

    let calculatedItemsPrice = 0;
    let totalDiscountAmount = 0;
    const processedItems = [];

    for (const cartItem of cartItems) {
        const product = productMap.get(cartItem.productId);
        if (!product) throw new Error(`Sản phẩm ID ${cartItem.productId} không tồn tại.`);
        if (product.stock < cartItem.quantity) throw new Error(`Sản phẩm "${product.name}" không đủ tồn kho.`);

        let finalPricePerItem = product.price;
        let itemDiscount = 0;
        const now = new Date();
        if (product.discount && product.discount.isActive && new Date(product.discount.startDate) <= now && new Date(product.discount.endDate) >= now) {
            const discount = product.discount;
            const discountValue = discount.discountType === 'percent' ? product.price * (discount.value / 100) : discount.value;
            itemDiscount = Math.min(discountValue, product.price);
            finalPricePerItem = product.price - itemDiscount;
        }

        const image = product.images && product.images.length > 0 ? `data:${product.images[0].contentType};base64,${product.images[0].data.toString('base64')}` : null;
        processedItems.push({
            product: product._id, name: product.name, image: image,
            price: finalPricePerItem, quantity: cartItem.quantity,
        });

        calculatedItemsPrice += product.price * cartItem.quantity;
        totalDiscountAmount += itemDiscount * cartItem.quantity;
    }

    // Trừ tồn kho trước để giảm thiểu rủi ro
    try {
        const stockUpdatePromises = processedItems.map(item =>
            Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity, sold: +item.quantity }
            })
        );
        await Promise.all(stockUpdatePromises);
    } catch (stockError) {
        throw new Error("Không thể cập nhật tồn kho sản phẩm, vui lòng thử lại.");
    }

    // Tạo Order và OrderItem
    let createdOrder = null;
    try {
        const shippingPrice = 30000;
        const totalPrice = (calculatedItemsPrice - totalDiscountAmount) + shippingPrice;

        const order = new Order({
            user: userId, items: [], itemsPrice: calculatedItemsPrice, shippingPrice,
            discountAmount: totalDiscountAmount, totalPrice, shippingInfo,
            paymentInfo: { method: paymentMethod, status: 'pending' }, notes, status: 'pending'
        });
        createdOrder = await order.save();

        const orderItemsToCreate = processedItems.map(item => ({ ...item, order: createdOrder._id }));
        const createdItems = await OrderItem.insertMany(orderItemsToCreate);

        createdOrder.items = createdItems.map(item => item._id);
        await createdOrder.save();

        return createdOrder;

    } catch (orderError) {
        // Cố gắng hoàn tác tồn kho nếu có lỗi khi tạo đơn hàng
        console.error("Lỗi khi tạo bản ghi đơn hàng, đang cố gắng hoàn tác tồn kho:", orderError);
        const stockRevertPromises = processedItems.map(item =>
            Product.findByIdAndUpdate(item.product, {
                $inc: { stock: +item.quantity, sold: -item.quantity }
            })
        );
        await Promise.all(stockRevertPromises);

        if (createdOrder && createdOrder._id) {
            await Order.findByIdAndDelete(createdOrder._id);
        }

        throw new Error("Đã có lỗi xảy ra trong quá trình tạo đơn hàng, vui lòng thử lại.");
    }
};

// === 2. LẤY DANH SÁCH ĐƠN HÀNG (ĐÃ SỬA ĐỂ LÀM VIỆC VỚI ORDERITEM) ===
exports.getAllOrders = async (options = {}) => {
    const { page = 1, limit = 10, search = '' } = options;
    let query = {};
    if (search) {
        const regex = new RegExp(search.trim(), 'i');
        query = { $or: [{ orderCode: regex }, { 'shippingInfo.fullName': regex }, { 'shippingInfo.phoneNumber': regex }] };
    }

    const [orders, totalItems] = await Promise.all([
        Order.find(query)
            .populate('user', 'name email') // Lấy thông tin người dùng
            .populate({
                path: 'items', // Tên trường trong Order model
                model: 'OrderItem', // Chỉ định model để populate
                select: 'name quantity price image' // Chỉ lấy các trường cần thiết từ OrderItem
            })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Order.countDocuments(query)
    ]);

    return {
        data: orders,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit) || 1,
        totalItems
    };
};

// === 3. CẬP NHẬT TRẠNG THÁI (ĐÃ NÂNG CẤP) ===
exports.updateOrderStatus = async (orderId, newStatus) => {

    const order = await Order.findById(orderId);
    if (!order) throw new Error('Không tìm thấy đơn hàng.');

    const currentStatus = order.status;
    if (!ALLOWED_TRANSITIONS[currentStatus]?.includes(newStatus)) {
        throw new Error(`Hành động không hợp lệ: Không thể chuyển trạng thái từ '${currentStatus}' sang '${newStatus}'.`);
    }

    order.status = newStatus;

    if (newStatus === 'delivered') {
        order.deliveredAt = new Date();
        if (order.paymentInfo.method === 'COD') {
            order.paymentInfo.status = 'completed';
            order.paidAt = new Date();
        }
    }

    if (newStatus === 'cancelled') {
        const orderItems = await OrderItem.find({ order: order._id });
        const stockUpdatePromises = orderItems.map(item =>
            Product.findByIdAndUpdate(item.product, {
                $inc: { stock: +item.quantity, sold: -item.quantity }
            })
        );
        await Promise.all(stockUpdatePromises);
    }

    await order.save();
    return order;
};