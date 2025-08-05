const mongoose = require('mongoose');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const cartService = require('./cartService');

const ALLOWED_TRANSITIONS = {
    pending: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered', 'cancelled'],
    delivered: ['refunded'],
    cancelled: [],
    refunded: [],
};


exports.createOrder = async (orderInput) => {
    const { userId, items, shippingInfo, paymentMethod, notes, clearCart = true } = orderInput;
    if (!items || items.length === 0) throw new Error('Giỏ hàng không được để trống.');

    //  Lấy thông tin sản phẩm và tính toán giá )
    const productIds = items.map(item => item.productId);
    const productsFromDB = await Product.find({ _id: { $in: productIds } }).populate('discount');
    const productMap = new Map(productsFromDB.map(p => [p._id.toString(), p]));

    let calculatedItemsPrice = 0;
    let totalDiscountAmount = 0;
    const processedItems = [];

    for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) throw new Error(`Sản phẩm ID ${item.productId} không tồn tại.`);
        if (product.stock < item.quantity) throw new Error(`Sản phẩm "${product.name}" không đủ tồn kho.`);

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
            product: product._id,
            name: product.name,
            image: image,
            price: finalPricePerItem,
            quantity: item.quantity,
            option: item.option,
            variant: item.productVariantId || null,
        });

        calculatedItemsPrice += product.price * item.quantity;
        totalDiscountAmount += itemDiscount * item.quantity;
    }


    try {
        //  Trừ tồn kho 
        const stockUpdatePromises = processedItems.map(item =>
            Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity, sold: +item.quantity }
            })
        );
        await Promise.all(stockUpdatePromises);

        //bản ghi Order
        const shippingPrice = 30000;
        const totalPrice = (calculatedItemsPrice - totalDiscountAmount) + shippingPrice;

        const order = new Order({
            user: userId, items: [], itemsPrice: calculatedItemsPrice, shippingPrice,
            discountAmount: totalDiscountAmount, totalPrice, shippingInfo,
            paymentInfo: { method: paymentMethod, status: 'pending' }, notes, status: 'pending'
        });
        const createdOrder = await order.save();

        // bản ghi OrderItem
        const orderItemsToCreate = processedItems.map(item => ({ ...item, order: createdOrder._id }));
        const createdItems = await OrderItem.insertMany(orderItemsToCreate);


        createdOrder.items = createdItems.map(item => item._id);
        await createdOrder.save();


        if (clearCart) {
            await cartService.clearCart(userId);
        }


        return createdOrder;

    } catch (error) {

        console.error("Lỗi nghiêm trọng khi tạo đơn hàng (không có transaction):", error);
        throw new Error("Đã có lỗi xảy ra trong quá trình xử lý đơn hàng của bạn.");
    }
};

// LẤY DANH SÁCH ĐƠN HÀNG 
exports.getAllOrders = async (options = {}) => {
    const { page = 1, limit = 10, search = '' } = options;
    let query = {};
    if (search) {
        const regex = new RegExp(search.trim(), 'i');
        query = { $or: [{ orderCode: regex }, { 'shippingInfo.fullName': regex }, { 'shippingInfo.phoneNumber': regex }] };
    }

    const [orders, totalItems] = await Promise.all([
        Order.find(query)
            .populate('user', 'name email')
            .populate({
                path: 'items',
                model: 'OrderItem',
                select: 'name quantity price image option'
            })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean(),
        Order.countDocuments(query)
    ]);

    return {
        data: orders,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / limit) || 1,
        totalItems
    };
};

exports.updateOrderStatus = async (orderId, updateData) => {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Không tìm thấy đơn hàng.');

    const { status, estimatedDeliveryDate, shippingProvider, shippingTrackingCode, notes } = updateData;

    if (status) {
        const currentStatus = order.status;
        if (!ALLOWED_TRANSITIONS[currentStatus]?.includes(status)) {
            throw new Error(`Hành động không hợp lệ: Không thể chuyển từ '${currentStatus}' sang '${status}'.`);
        }
        order.status = status;
        order.statusHistory.push({
            status: status,
            notes: notes || `Trạng thái được cập nhật bởi quản trị viên.`
        });
    }

    if (estimatedDeliveryDate) order.estimatedDeliveryDate = estimatedDeliveryDate;
    if (shippingProvider) order.shippingProvider = shippingProvider;
    if (shippingTrackingCode) order.shippingTrackingCode = shippingTrackingCode;

    if (status === 'delivered') {
        order.deliveredAt = new Date();
        if (order.paymentInfo.method === 'COD') {
            order.paymentInfo.status = 'completed';
            order.paidAt = new Date();
        }
    }
    if (status === 'cancelled') {
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

// --- TÌM ĐƠN HÀNG THEO ID HOẶC MÃ ---
exports.findOrderById = async (identifier, userId) => {
    const query = mongoose.Types.ObjectId.isValid(identifier)
        ? { _id: identifier }
        : { orderCode: identifier };

    const order = await Order.findOne(query).populate('items').lean();

    if (!order) return null;

    if (userId && order.user && !order.user.equals(userId)) {
        return null;
    }

    return order;
};

//---LẤY TẤT CẢ ĐƠN HÀNG CỦA USER ---
exports.findOrdersByUserId = async (userId) => {
    if (!userId) {
        throw new Error('Cần có ID người dùng để tìm đơn hàng.');
    }
    const orders = await Order.find({ user: userId })
        .populate({
            path: 'items',
            model: 'OrderItem',
            select: 'name quantity price image option'
        })
        .sort({ createdAt: -1 })
        .lean();
    return orders;
};