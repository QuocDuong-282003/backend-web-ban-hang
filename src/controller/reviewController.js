const reviewService = require('../services/reviewService');
// admin

exports.adminGetAllReviews = async (req, res) => {
    try {
        const result = await reviewService.getAllReviewForAdmin(req.query);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });

    }
}
exports.adminExportReview = async (req, res) => {
    try {
        const { reviewIds } = req.body;
        if (!reviewIds || !Array.isArray(reviewIds) || reviewIds.length == 0)
            return res.status(400).json({ message: "Vui lòng cung cấp danh sách ID." });

        const workbook = await reviewService.exportReviewToExcel(reviewIds);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="reviews_${Date.now()}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};
//user
exports.userCreateReview = async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;
        const userId = req.user.id;
        const review = await reviewService.createReviewByUser(userId, productId, rating, comment);
        res.status(201).json(review);
    } catch (error) {
        res.status(400).json({ message: error.message });

    }
};
// 
exports.userUpdateReview = async (req, res) => {
    try {
        const reviewId = req.params.id;
        const userId = req.user.id;
        const { rating, comment } = req.body;
        const updateReview = await reviewService.updateReviewByUser(reviewId, userId, rating, comment);
        res.status(200).json(updateReview);
    } catch (error) {
        res.status(400).json({ message: error.message });

    }
}
// 
exports.userDeleteReview = async (req, res) => {
    try {
        const reviewId = req.params.id;
        const userId = req.user.id;
        const deleteReview = await reviewService.deleteReviewByUser(reviewId, userId);
        res.status(200).json(deleteReview);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}
// 
// exports.publicGetProductReview = async (req, res) => {
//     try {
//         const productId = req.params.productId;
//         const reviews = await reviewService.getReviewsForProduct(productId);
//         res.status(200).json(reviews);
//     } catch (error) {
//         res.status(500).json({ message: error.message });

//     }
// }


// --- THAY THẾ HÀM publicGetProductReview TRONG: controller/reviewController.js ---

exports.publicGetProductReview = async (req, res) => {
    try {
        const productId = req.params.productId;
        // Lấy các tham số page, limit từ query string (ví dụ: /reviews?page=2&limit=10)
        const options = {
            page: req.query.page,
            limit: req.query.limit || 5 // Mặc định là 5 nếu không có
        };
        const result = await reviewService.getReviewsForProduct(productId, options);
        console.log('Check data reniew', result)

        res.status(200).json(result); // Trả về object hoàn chỉnh
    } catch (error) {
        console.error("Lỗi trong publicGetProductReview:", error);
        res.status(500).json({ message: error.message });
    }
}