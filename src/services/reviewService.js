const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const excel = require('exceljs');

// function private
const updateProductRating = async (productId) => {
    const reviews = await Review.find({ product: productId });
    const numReviews = reviews.length;
    if (numReviews > 0) {
        const avg = reviews.reduce((acc, item) => item.rating + acc, 0) / numReviews;
        await Product.findByIdAndUpdate(productId, { rating: avg.toFixed(1), numReviews })
    } else {
        await Product.findByIdAndUpdate(productId, { rating: 0, numReviews: 0 });
    }
};

// function for admin
exports.getAllReviewForAdmin = async (options) => {
    // 1. Phân tích và chuyển đổi các tham số từ chuỗi sang số.
    // Đặt giá trị mặc định nếu tham số không hợp lệ hoặc bị thiếu.
    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 10;

    // 2. Kiểm tra để đảm bảo giá trị là số dương
    const safePage = page > 0 ? page : 1;
    const safeLimit = limit > 0 ? limit : 10;

    const [reviews, totalItems] = await Promise.all([
        Review.find({})
            .populate('user', 'name email phone')
            .populate('product', 'name')
            .sort({ createdAt: -1 })
            // 3. Sử dụng các giá trị số đã được làm sạch trong câu truy vấn
            .skip((safePage - 1) * safeLimit)
            .limit(safeLimit)
            .lean(),
        Review.countDocuments({})
    ]);

    return {
        data: reviews,
        currentPage: safePage,
        totalPages: Math.ceil(totalItems / safeLimit) || 1,
        totalItems
    };
};


exports.exportReviewToExcel = async (reviewIds) => {
    // Bước 1: Lấy dữ liệu review, POPULATE thêm email và phone từ User
    const reviews = await Review.find({ _id: { $in: reviewIds } })
        .populate('user', 'name email phone') // <-- SỬA Ở ĐÂY
        .populate('product', 'name')
        .sort({ createdAt: -1 })
        .lean(); // Dùng lean() để tăng tốc độ

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách đánh giá');

    // Bước 2: Thêm các cột mới vào file Excel
    worksheet.columns = [
        { header: 'Ngày tạo', key: 'createdAt', width: 20 },
        { header: 'Sản phẩm', key: 'productName', width: 40 },
        { header: 'Người dùng', key: 'userName', width: 30 },
        { header: 'Email', key: 'userEmail', width: 35 },        // <-- CỘT MỚI
        { header: 'Số điện thoại', key: 'userPhone', width: 20 }, // <-- CỘT MỚI
        { header: 'Số sao', key: 'rating', width: 10, style: { alignment: { horizontal: 'center' } } },
        { header: 'Bình luận', key: 'comment', width: 60, style: { alignment: { wrapText: true } } }
    ];

    // Tùy chỉnh header cho đẹp hơn
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Bước 3: Thêm dữ liệu vào các hàng, bao gồm cả các trường mới
    reviews.forEach(review => {
        worksheet.addRow({
            createdAt: review.createdAt,
            productName: review.product?.name || 'N/A',
            userName: review.user?.name || '[Đã xóa]',
            userEmail: review.user?.email || 'N/A',      // <-- DỮ LIỆU MỚI
            userPhone: review.user?.phone || 'N/A',      // <-- DỮ LIỆU MỚI
            rating: review.rating,
            comment: review.comment || ''
        });
    });

    return workbook;
};
// fun for user
exports.createReviewByUser = async (userId, productId, rating, comment) => {
    // 1. Tìm tất cả orderId đã giao của user
    const deliveredOrders = await Order.find({ user: userId, status: 'delivered' }).select('_id');
    if (deliveredOrders.length === 0)
        throw new Error('Bạn chưa có đơn hàng nào giao thành công !');

    const deliveredOrderIds = deliveredOrders.map(order => order._id);
    // 2. Kiểm tra xem sản phẩm có nằm trong các đơn ?
    const hasPurchasedItem = await OrderItem.findOne({ order: { $in: deliveredOrderIds }, product: productId });
    if (!hasPurchasedItem)
        throw new Error("Bạn chỉ có thể đánh giá sản phẩm đã mua thành công.");
    if (await Review.findOne({ user: userId, product: productId, }))
        throw new Error("Bạn đã đánh giá sản phẩm này rồi.");
    const review = new Review({ user: userId, product: productId, rating, comment });
    await review.save();
    await updateProductRating(productId);
    return review;
}
exports.updateReviewByUser = async (reviewId, userId, rating, comment) => {
    const review = await Review.findById(reviewId);
    if (!review) throw new Error("Không tìm thấy đánh giá.");
    if (review.user.toString() !== userId.toString())
        throw new Error("Bạn không có quyền sửa đánh giá này.");
    review.rating = rating;
    review.comment = comment;
    await review.save();
    await updateProductRating(review.product);
    return review;
};
exports.deleteReviewByUser = async (reviewId, userId) => {
    const review = await Review.findById(reviewId);
    if (!review) throw new Error("Không tìm thấy đánh giá.");
    if (review.user.toString() !== userId.toString())
        throw new Error("Bạn không có quyền xoa đánh giá này.");
    const productId = review.product;
    await Review.findByIdAndDelete(reviewId);
    await updateProductRating(productId);
    return { message: "Xóa đánh giá thành công." };
};
exports.getReviewsForProduct = async (productId) =>
    Review.find({ product: productId }).populate('user', 'name avatar').sort({ createdAt: -1 });
