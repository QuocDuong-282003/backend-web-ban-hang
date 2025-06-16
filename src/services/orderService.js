const Discount = require('../models/Discount');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { options } = require('../router/web');


// exports.createOrder = async (orderInput) => {
//     // === 1. Lấy dữ liệu đầu vào ===
//     const { userId, cartItems, shippingInfo, paymentMethod, notes } = orderInput;

//     if (!cartItems || cartItems.length === 0) {
//         throw new Error('Giỏ hàng không được để trống.');
//     }

//     // === 2. Lấy thông tin sản phẩm từ DB để xác thực ===
//     const productIds = cartItems.map(item => item.productId);
//     // Dùng .populate('discount') để lấy luôn thông tin mã giảm giá của từng sản phẩm
//     const productsFromDB = await Product.find({ _id: { $in: productIds } }).populate('discount');

//     // Tạo một Map để tra cứu sản phẩm nhanh hơn, tránh lặp lồng nhau
//     const productMap = new Map(productsFromDB.map(p => [p._id.toString(), p]));

//     let calculatedItemsPrice = 0;
//     const finalOrderItems = [];
//     const now = new Date();

//     // === 3. Lặp qua giỏ hàng để xác thực và tính toán ===
//     for (const cartItem of cartItems) {
//         const product = productMap.get(cartItem.productId);

//         // Xác thực
//         if (!product) {
//             throw new Error(`Sản phẩm với ID ${cartItem.productId} không tồn tại hoặc đã bị xóa.`);
//         }
//         if (product.stock < cartItem.quantity) {
//             throw new Error(`Sản phẩm "${product.name}" không đủ số lượng trong kho (chỉ còn ${product.stock}).`);
//         }

//         // Tính toán lại giá cuối cùng của sản phẩm tại server
//         let finalPricePerItem = product.price;
//         if (product.discount && product.discount.isActive && new Date(product.discount.startDate) <= now && new Date(product.discount.endDate) >= now) {
//             const discount = product.discount;
//             const discountAmount = discount.discountType === 'percentage'
//                 ? product.price * (discount.value / 100)
//                 : discount.value;
//             finalPricePerItem = Math.max(0, product.price - discountAmount);
//         }

//         // Thêm sản phẩm đã được xác thực vào mảng item của đơn hàng
//         finalOrderItems.push({
//             product: product._id,
//             name: product.name,
//             image: product.images && product.images.length > 0 ? `data:${product.images[0].contentType};base64,${product.images[0].data.toString('base64')}` : null,
//             price: finalPricePerItem, // << Lưu giá đã giảm tại thời điểm mua
//             quantity: cartItem.quantity,
//         });

//         // Cộng dồn vào tổng tiền hàng
//         calculatedItemsPrice += finalPricePerItem * cartItem.quantity;
//     }

//     // === 4. Tính toán các chi phí của toàn bộ đơn hàng ===
//     const shippingPrice = 30000; // Ví dụ: phí ship cố định
//     const totalPrice = calculatedItemsPrice + shippingPrice;

//     // === 5. Tạo đối tượng Order hoàn chỉnh để lưu vào DB ===
//     const orderToCreate = new Order({
//         user: userId,
//         items: finalOrderItems,
//         itemsPrice: calculatedItemsPrice,
//         shippingPrice: shippingPrice,
//         totalPrice: totalPrice,
//         shippingInfo: shippingInfo,
//         paymentInfo: {
//             method: paymentMethod,
//             status: 'pending' // Mặc định là 'chờ thanh toán'
//         },
//         notes: notes,
//         status: 'pending' // Trạng thái ban đầu của đơn hàng
//     });

//     // Lưu đơn hàng vào DB
//     const createdOrder = await orderToCreate.save();

//     // === 6. Cập nhật lại tồn kho sản phẩm (bước cuối cùng) ===
//     const stockUpdatePromises = finalOrderItems.map(item => {
//         return Product.findByIdAndUpdate(item.product, {
//             $inc: { stock: -item.quantity, sold: +item.quantity }
//         });
//     });
//     await Promise.all(stockUpdatePromises);

//     return createdOrder;
// };
//get all order

// --- FILE: services/orderService.js (FINAL DEBUG VERSION) ---



// ... các hàm service khác
exports.createOrder = async (orderInput) => {
    const { userId, cartItems, shippingInfo, paymentMethod, notes } = orderInput;

    if (!cartItems || cartItems.length === 0) {
        throw new Error('Giỏ hàng không được để trống.');
    }

    const productIds = cartItems.map(item => item.productId);
    console.log('---LẤY SẢN PHẨM TỪ DB ---');

    const productsFromDB = await Product.find({ _id: { $in: productIds } }).populate('discount');
    console.log(`Đã tìm thấy ${productsFromDB.length} sản phẩm trong DB.`);

    const productMap = new Map(productsFromDB.map(p => [p._id.toString(), p]));
    let calculatedItemsPrice = 0;
    const finalOrderItems = [];
    const now = new Date();

    console.log('\n--- TÍNH TOÁN GIÁ CHO TỪNG SẢN PHẨM ---');
    for (const cartItem of cartItems) {
        const product = productMap.get(cartItem.productId);

        if (!product) throw new Error(`Sản phẩm với ID ${cartItem.productId} không tồn tại.`);
        if (product.stock < cartItem.quantity) throw new Error(`Sản phẩm "${product.name}" không đủ tồn kho.`);

        console.log(`\n>>> Đang xử lý sản phẩm: "${product.name}" (Giá gốc: ${product.price})`);

        let finalPricePerItem = product.price;

        // Kiểm tra xem có mã giảm giá và mã đó có hợp lệ không
        if (product.discount && product.discount.isActive && new Date(product.discount.startDate) <= now && new Date(product.discount.endDate) >= now) {
            const discount = product.discount;
            console.log(`   -> Tìm thấy mã giảm giá hợp lệ: "${discount.code}"`);
            console.log(`   -> Loại trong DB là: '${discount.discountType}'`);
            let discountAmount = 0;


            if (discount.discountType === 'percent') {
                discountAmount = product.price * (discount.value / 100);
                console.log(`   -> TÍNH THEO PHẦN TRĂM: Giá trị=${discount.value}%, Số tiền giảm=${discountAmount}`);
            } else if (discount.discountType === 'fixed') {
                discountAmount = discount.value;
                console.log(`   -> TÍNH THEO SỐ TIỀN CỐ ĐỊNH: Số tiền giảm=${discountAmount}`);
            }

            finalPricePerItem = Math.max(0, product.price - discountAmount);
        } else {
            console.log(`   -> Không có mã giảm giá hợp lệ được áp dụng.`);
            if (product.discount) {
                console.log(`      (Lý do có thể: isActive=${product.discount.isActive}, endDate=${product.discount.endDate})`);
            }
        }

        console.log(`   -> GIÁ CUỐI CÙNG của sản phẩm này: ${finalPricePerItem}`);

        finalOrderItems.push({
            product: product._id,
            name: product.name,
            price: finalPricePerItem,
            quantity: cartItem.quantity,
        });

        calculatedItemsPrice += finalPricePerItem * cartItem.quantity;
    }

    console.log('\n---  TÍNH TOÁN TỔNG ĐƠN HÀNG ---');
    const shippingPrice = 30000; // handcode ship cố định 30k
    const totalPrice = calculatedItemsPrice + shippingPrice;
    console.log(`   -> Tổng tiền hàng: ${calculatedItemsPrice}`);
    console.log(`   -> Phí ship: ${shippingPrice}`);
    console.log(`   -> TỔNG THANH TOÁN: ${totalPrice}`);

    const orderToCreate = new Order({
        user: userId,
        items: finalOrderItems,
        itemsPrice: calculatedItemsPrice,
        shippingPrice: shippingPrice,
        totalPrice: totalPrice,
        shippingInfo: shippingInfo,
        paymentInfo: { method: paymentMethod, status: 'pending' },
        notes: notes,
        status: 'pending'
    });

    console.log('\n--- : LƯU ĐƠN HÀNG VÀO DB ---');
    const createdOrder = await orderToCreate.save();
    console.log('Đã lưu đơn hàng thành công!');

    const stockUpdatePromises = finalOrderItems.map(item =>
        Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity, sold: +item.quantity } })
    );
    await Promise.all(stockUpdatePromises);
    console.log('Đã cập nhật tồn kho.');

    return createdOrder;
};

exports.getAllOrders = async (options = {}) => {
    // 1. Lấy tham số, đặt giá trị mặc định
    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 10;
    const searchTerm = options.search || '';

    // 2. Tạo query tìm kiếm
    let query = {};
    if (searchTerm) {
        const regex = new RegExp(searchTerm.trim(), 'i');
        query = {
            $or: [
                { orderCode: regex },
                { 'shippingInfo.fullName': regex },
                { 'shippingInfo.phoneNumber': regex }
            ]
        };
    }

    const [orders, totalItems] = await Promise.all([
        Order.find(query)
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Order.countDocuments(query)
    ]);


    const totalPages = Math.ceil(totalItems / limit);
    return {
        data: orders,
        currentPage: page,
        totalPages: totalPages > 0 ? totalPages : 1,
        totalItems: totalItems
    };
};

// update order
exports.updateOrderStatus = async (orderId, status) => {
    const order = await Order.findById(orderId);
    if (!order) {
        throw new Error('khong tim thay san pham');
    }
    order.status = status;
    if (status === 'delivered') {
        order.deliveredAt = new Date();
        // Nếu là COD, khi giao hàng thành công thì coi như đã thanh toán
        if (order.paymentInfo.method === 'COD') {
            order.paymentInfo.status = 'completed';
            order.paidAt = new Date();
        }

    }
    await order.save();
    return order;

};
