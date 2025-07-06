const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const excel = require('exceljs');
const mongoose = require('mongoose');
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

    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 10;


    const safePage = page > 0 ? page : 1;
    const safeLimit = limit > 0 ? limit : 10;

    const [reviews, totalItems] = await Promise.all([
        Review.find({})
            .populate('user', 'name email phone')
            .populate('product', 'name')
            .sort({ createdAt: -1 })

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

    const reviews = await Review.find({ _id: { $in: reviewIds } })
        .populate('user', 'name email phone')
        .populate('product', 'name')
        .sort({ createdAt: -1 })
        .lean(); //   tăng tốc độ

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách đánh giá');

    // các cột mới vào file Excel
    worksheet.columns = [
        { header: 'Ngày tạo', key: 'createdAt', width: 20 },
        { header: 'Sản phẩm', key: 'productName', width: 40 },
        { header: 'Người dùng', key: 'userName', width: 30 },
        { header: 'Email', key: 'userEmail', width: 35 },
        { header: 'Số điện thoại', key: 'userPhone', width: 20 },
        { header: 'Số sao', key: 'rating', width: 10, style: { alignment: { horizontal: 'center' } } },
        { header: 'Bình luận', key: 'comment', width: 60, style: { alignment: { wrapText: true } } }
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };


    reviews.forEach(review => {
        worksheet.addRow({
            createdAt: review.createdAt,
            productName: review.product?.name || 'N/A',
            userName: review.user?.name || '[Đã xóa]',
            userEmail: review.user?.email || 'N/A',
            userPhone: review.user?.phone || 'N/A',
            rating: review.rating,
            comment: review.comment || ''
        });
    });

    return workbook;
};
// fun for user
exports.createReviewByUser = async (userId, productId, rating, comment) => {
    // Tìm tất cả orderId đã giao của user
    const deliveredOrders = await Order.find({ user: userId, status: 'delivered' }).select('_id');
    if (deliveredOrders.length === 0)
        throw new Error('Bạn chưa có đơn hàng nào giao thành công !');

    const deliveredOrderIds = deliveredOrders.map(order => order._id);
    //  Kiểm tra xem sản phẩm có nằm trong các đơn 
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

exports.getReviewsForProduct = async (productId, options = {}) => {
    //  các tham số phân trang, giá trị mặc định là 5 đánh giá mỗi trang
    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 5;
    const skip = (page - 1) * limit;


    const [reviews, totalReviews, statsRaw] = await Promise.all([

        Review.find({ product: productId })
            .populate('user', 'name images')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),

        Review.countDocuments({ product: productId }),

        Review.aggregate([
            { $match: { product: new mongoose.Types.ObjectId(productId) } },
            { $group: { _id: '$rating', count: { $sum: 1 } } }
        ])
    ]);


    const stats = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    statsRaw.forEach(item => {
        if (stats.hasOwnProperty(item._id)) {
            stats[item._id] = item.count;
        }
    });


    return {
        reviews,
        stats,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalReviews / limit),
            totalReviews: totalReviews,
            limit: limit
        }
    };
};