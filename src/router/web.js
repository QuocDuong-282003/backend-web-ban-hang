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
const contactController = require('../controller/contactController');

// === MIDDLEWARE ===
const uploadImagesMiddleware = require('../../src/config/upLoadImg');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const { otpRateLimiter, loginRateLimiter, registerRateLimiter } = require('../middleware/rateLimiter');
const uploadImage = require('../../src/config/uploadNewsImageForNew');
const uploadAvatar = require('../middleware/uploadAvatar');

// ============================================
// AUTH - Đăng nhập, đăng ký, quản lý tài khoản
// ============================================

// --- Đăng nhập/Đăng ký cơ bản ---
router.post('/login', loginRateLimiter, authController.login);
router.post('/register', registerRateLimiter, uploadAvatar, authController.register);

// --- Đăng ký với OTP (Flow mới - có password) ---
// POST /api/auth/register - Nhận email, name, password (JSON) → Gửi OTP qua email
router.post('/auth/register', registerRateLimiter, otpRateLimiter, authController.registerWithEmail);
// POST /api/auth/verify-otp - Verify OTP và tạo user với password (JSON only, không có avatar)
// Avatar sẽ được upload sau trong phần "Cập nhật hồ sơ" qua route /api/upload-avatar
router.post('/auth/verify-otp', authController.verifyOTPAndRegister);

// --- Đăng ký với Email + Password + OTP (Lưu OTP vào User model) ---
// POST /api/auth/register-send-otp - Nhận email, password, name → Hash password → Tạo OTP → Lưu vào User → Gửi OTP
router.post('/auth/register-send-otp', registerRateLimiter, otpRateLimiter, authController.registerWithEmailPasswordOTP);
// POST /api/auth/verify-register-otp - Nhận email, OTP → Verify OTP → Set isVerified = true
router.post('/auth/verify-register-otp', authController.verifyOTPForRegister);

// --- Đăng nhập/Đăng ký với OTP (Flow cũ - không có password) ---
router.post('/send-otp', otpRateLimiter, authController.sendOTP);
router.post('/register-with-otp', registerRateLimiter, uploadAvatar, authController.registerWithOTP);
router.post('/login-with-otp', loginRateLimiter, otpRateLimiter, authController.loginWithOTP);

// --- Đăng nhập với Google ---
// POST /api/auth/google - Verify Google ID token and set HttpOnly cookie
router.post('/auth/google', authController.googleLoginWithToken);

// --- Quản lý session ---
// POST /api/auth/logout - Clear HttpOnly cookie and logout
router.post('/auth/logout', authController.logout);
// GET /api/me - Returns user info based on HttpOnly cookie
router.get('/me', authController.getMe);

// --- Quản lý profile (cần đăng nhập) ---
router.post('/upload-avatar', verifyToken, uploadAvatar, authController.uploadAvatar);
router.get('/profile', verifyToken, authController.getProfile);
router.put('/users/profile', verifyToken, authController.updateProfile);

// --- Quản lý mật khẩu ---
router.post('/users/change-password', verifyToken, authController.changePassword);
router.post('/forgot-password', otpRateLimiter, authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// --- Quên mật khẩu với OTP (Lưu OTP vào User model) ---
// POST /api/auth/forgot-password-send-otp - Nhận email → Tạo OTP → Lưu vào User → Gửi OTP
router.post('/auth/forgot-password-send-otp', otpRateLimiter, authController.forgotPasswordSendOTP);
// POST /api/auth/verify-forgot-password-otp - Nhận email, OTP, newPassword → Verify OTP → Đặt lại mật khẩu
router.post('/auth/verify-forgot-password-otp', authController.verifyOTPAndResetPassword);

// --- Quản lý users (Admin) ---
router.get('/users', authController.getAllUsersTable);
router.delete('/users/:id', authController.deleteUserById);

// ============================================
// THỐNG KÊ LƯỢT TRUY CẬP / ĐĂNG NHẬP
// ============================================

router.post('/stat', visitStatController.trackLogin);
router.get('/date', visitStatController.getLoginToday);
router.get('/month', visitStatController.getLoginThisMonth);
router.get('/summary', visitStatController.getLoginSummary);

// ============================================
// PRODUCT - Quản lý sản phẩm
// ============================================

// CRUD Products
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
router.get('/products/suggestions', productController.getSuggestions);

// Filter và search
router.get('/products/filters-data', productController.getFilterOptions);
router.get('/products/filter', productController.filterProducts);
router.post('/products/by-id', productController.getProductsByIds);

// ============================================
// CATEGORY - Danh mục sản phẩm
// ============================================

router.post('/add-category', categoryController.createCategory);
router.get('/category-all', categoryController.getAllCategories);
router.get('/category/:id', categoryController.getCategoryById);
router.put('/category/:id', categoryController.updateCategory);
router.delete('/category/:id', categoryController.deleteCategory);

// ============================================
// DISCOUNT - Mã giảm giá
// ============================================

router.post('/add-discount', discountController.createDiscount);
router.get('/discount-all', discountController.getAllDiscountTable);
router.get('/discount/:id', discountController.getDiscountByID);
router.put('/discount/:id', discountController.updateDiscount);
router.delete('/discount/:id', discountController.deleteDiscount);

// ============================================
// ORDER - Đơn hàng
// ============================================

router.post('/add-order', verifyToken, orderController.createOrder);
router.get('/order-all', orderController.getAllOrders);
router.put('/update-order/:id/status', orderController.updateOrderStatus);
router.get('/orders/:id', verifyToken, orderController.getOrderByIdForUser);
router.get('/orders-detail/:id', verifyToken, orderController.getOrderByIdForUser);
router.put('/orders/:id/cancel-by-user', verifyToken, orderController.cancelOrderByUser);
router.get('/my-orders', verifyToken, orderController.getMyOrders);

// ============================================
// DASHBOARD - Thống kê tổng quan
// ============================================

router.get('/stats/overview', dashboardController.getOverviewStats);
router.get('/stats/sales', dashboardController.getSalesStats);
router.get('/stats/order-status', dashboardController.getOrderStatusStats);

// ============================================
// REVIEW - Đánh giá sản phẩm
// ============================================

// Admin
router.get('/admin/reviews', verifyToken, verifyAdmin, reviewController.adminGetAllReviews);
router.post('/reviews/export', verifyToken, verifyAdmin, reviewController.adminExportReview);

// User
router.post('/reviews', verifyToken, reviewController.userCreateReview);
router.put('/reviews/:id', verifyToken, reviewController.userUpdateReview);
router.delete('/reviews/:id', verifyToken, reviewController.userDeleteReview);

// Public
router.get('/products/:productId/reviews', reviewController.publicGetProductReview);

// ============================================
// NEWS - Tin tức
// ============================================

// Admin
router.post('/admin/news', uploadImage, newController.createNews);
router.get('/admin/news', newController.getAllNewsAdmin);
router.get('/admin/news/:id', newController.getNewById);
router.put('/admin/news/:id', uploadImage, newController.updateNews);
router.delete('/admin/news/:id', newController.deleteNews);

// Public
router.get('/news', newController.getAllNews);
router.get('/news/:slug', newController.getNewsBySlug);

// ============================================
// CART - Giỏ hàng
// ============================================

router.get('/cart-all', verifyToken, cartController.getCart);
router.post('/add-cart', verifyToken, cartController.addToCart);
router.put('/update-cart/:id', verifyToken, cartController.updateCartItem);
router.delete('/delete-cart/:id', verifyToken, cartController.removeCartItem);

// ============================================
// CONTACT - Liên hệ
// ============================================

router.post('/contact', contactController.submitContactForm);
router.get('/contact-all', contactController.getAllContact);
router.delete('/delete-contact/:id', contactController.deleteContact);
router.put('/update-status/:id/status', contactController.updateStatusController);

module.exports = router;
