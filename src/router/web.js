const express = require('express');
const router = express.Router();

// === CONTROLLERS ===
const authController = require('../controller/authController');
const visitStatController = require('../controller/visitStatController');
const productController = require('../controller/productController');
const categoryController = require('../controller/categoryController');
const discountController = require('../controller/discountController');
const orderController = require('../controller/orderController');
const dashboardController = require('../controller/dashboardController');
const reviewController = require('../controller/reviewController');
const newController = require('../controller/newController');
const cartController = require('../controller/cartController');
// === MIDDLEWARE ===
const uploadImagesMiddleware = require('../../src/config/upLoadImg');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const uploadImage = require('../../src/config/uploadNewsImageForNew');
// ============================================================
//  AUTH - Đăng nhập, đăng ký, quản lý tài khoản người dùng
// ============================================================

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/users', authController.getAllUsersTable);
router.delete('/users/:id', authController.deleteUserById);
router.get('/profile', verifyToken, authController.getProfile);

// Tài khoản cá nhân (cần đăng nhập)
router.put('/users/profile', verifyToken, authController.updateProfile);
router.post('/users/change-password', verifyToken, authController.changePassword);

// Quên mật khẩu
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// ============================================================
//  THỐNG KÊ LƯỢT TRUY CẬP / ĐĂNG NHẬP
// ============================================================

router.post('/stat', visitStatController.trackLogin);
router.get('/date', visitStatController.getLoginToday);
router.get('/month', visitStatController.getLoginThisMonth);
router.get('/summary', visitStatController.getLoginSummary);

// ============================================================
//  PRODUCT - Quản lý sản phẩm
// ============================================================

router.post('/add-product', uploadImagesMiddleware, productController.createProduct);
router.get('/product-all', productController.getAllProducts);
router.get('/product/:id', productController.getProductById);
router.put('/product/:id', uploadImagesMiddleware, productController.updateProduct);
router.delete('/product/:id', productController.deleteProduct);
router.post('/products/:id/assign-discounts', productController.assignDiscountsToProduct);

// Sản phẩm cho trang chủ
router.get('/products/newest', productController.getNewestProducts);
router.get('/products/hot', productController.getHotProducts);
router.get('/products/popular', productController.getPopularProducts);
router.get('/products/related/:id', productController.getRelatedProducts);
router.get('/products/slug/:slug', productController.getProductBySlug);
//
router.get('/products/filters-data', productController.getFilterOptions);
router.get('/products/filter', productController.filterProducts);
// ============================================================
//  CATEGORY - Danh mục sản phẩm
// ============================================================

router.post('/add-category', categoryController.createCategory);
router.get('/category-all', categoryController.getAllCategories);
router.get('/category/:id', categoryController.getCategoryById);
router.put('/category/:id', categoryController.updateCategory);
router.delete('/category/:id', categoryController.deleteCategory);

// ============================================================
//  DISCOUNT - Mã giảm giá
// ============================================================

router.post('/add-discount', discountController.createDiscount);
router.get('/discount-all', discountController.getAllDiscountTable);
router.get('/discount/:id', discountController.getDiscountByID);
router.put('/discount/:id', discountController.updateDiscount);
router.delete('/discount/:id', discountController.deleteDiscount);

// ============================================================
//  ORDER - Đơn hàng
// ============================================================

router.post('/add-order', orderController.createOrder);
router.get('/order-all', orderController.getAllOrders);
router.put('/update-order/:id/status', orderController.updateOrderStatus);

// ============================================================
//  DASHBOARD - Thống kê tổng quan
// ============================================================

router.get('/stats/overview', dashboardController.getOverviewStats);
router.get('/stats/sales', dashboardController.getSalesStats);
router.get('/stats/order-status', dashboardController.getOrderStatusStats);

// ============================================================
//  REVIEW - Đánh giá sản phẩm
// ============================================================

// Admin
router.get('/admin/reviews', verifyToken, verifyAdmin, reviewController.adminGetAllReviews);
router.post('/reviews/export', verifyToken, verifyAdmin, reviewController.adminExportReview);

// User
router.post('/reviews', verifyToken, reviewController.userCreateReview);
router.put('/reviews/:id', verifyToken, reviewController.userUpdateReview);
router.delete('/reviews/:id', verifyToken, reviewController.userDeleteReview);

// Public
router.get('/products/:productId/reviews', reviewController.publicGetProductReview);

// new
router.post('/admin/news', uploadImage, newController.createNews); // Đã xóa verifyToken, verifyAdmin
router.get('/admin/news', newController.getAllNewsAdmin); // Đã xóa verifyToken, verifyAdmin
router.get('/admin/news/:id', newController.getNewById); // Đã xóa verifyToken, verifyAdmin
router.put('/admin/news/:id', uploadImage, newController.updateNews); // Đã xóa verifyToken, verifyAdmin
router.delete('/admin/news/:id', newController.deleteNews); //

// --- Client/Public Routes (Không cần xác thực) ---
router.get('/news', newController.getAllNews); // Lấy danh sách tin tức (có phân trang)
router.get('/news/:slug', newController.getNewsBySlug); // Lấy chi tiết một bài viết


// cart
router.get('/cart-all', verifyToken, cartController.getCart);
router.post('/add-cart', verifyToken, cartController.addToCart);
router.put('/update-cart/:id', verifyToken, cartController.updateCartItem);
router.delete('/delete-cart/:id', verifyToken, cartController.removeCartItem)
module.exports = router;
