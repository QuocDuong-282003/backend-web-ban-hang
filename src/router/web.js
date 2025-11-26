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
const contactController = require('../controller/contactController');
const uploadImage = require('../../src/config/uploadNewsImageForNew');
const uploadAvatar = require('../middleware/uploadAvatar');

// avatar
router.post('/upload-avatar', verifyToken, uploadAvatar, authController.uploadAvatar);
//  AUTH - Đăng nhập, đăng ký, quản lý tài khoản người dùng

// Đăng nhập/Đăng ký truyền thống (với mật khẩu)
router.post('/login', authController.login);
router.post('/register', uploadAvatar, authController.register);

// ============ ĐĂNG KÝ VỚI EMAIL + PASSWORD + OTP (FLOW MỚI) ============
// Lưu ý: KHÔNG có multer middleware - chỉ nhận JSON, không nhận file avatar
// Avatar có thể upload sau khi đăng ký thành công trong phần "Cập nhật hồ sơ"

// POST /api/auth/register - Nhận email, name, password (JSON) → Gửi OTP qua email
router.post('/auth/register', authController.registerWithEmail);

// POST /api/auth/verify-otp - Verify OTP và tạo user với password (JSON only, không có avatar)
// Avatar sẽ được upload sau trong phần "Cập nhật hồ sơ" qua route /api/upload-avatar
router.post('/auth/verify-otp', authController.verifyOTPAndRegister);

// Đăng nhập/Đăng ký với OTP (Flow cũ - không có password)
router.post('/send-otp', authController.sendOTP);
router.post('/register-with-otp', uploadAvatar, authController.registerWithOTP);
router.post('/login-with-otp', authController.loginWithOTP);

// Google Login with ID Token (for @react-oauth/google)
// POST /api/auth/google - Verify Google ID token and set HttpOnly cookie
router.post('/auth/google', authController.googleLoginWithToken);

// Logout - Clear HttpOnly cookie
// POST /api/auth/logout - Clear cookie and logout
router.post('/auth/logout', authController.logout);

// Get current authenticated user from cookie
// GET /api/me - Returns user info based on HttpOnly cookie
router.get('/me', authController.getMe);

router.get('/users', authController.getAllUsersTable);
router.delete('/users/:id', authController.deleteUserById);
router.get('/profile', verifyToken, authController.getProfile);

// Tài khoản cá nhân (cần đăng nhập)
router.put('/users/profile', verifyToken, authController.updateProfile);
router.post('/users/change-password', verifyToken, authController.changePassword);

// Quên mật khẩu
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

//  THỐNG KÊ LƯỢT TRUY CẬP / ĐĂNG NHẬP

router.post('/stat', visitStatController.trackLogin);
router.get('/date', visitStatController.getLoginToday);
router.get('/month', visitStatController.getLoginThisMonth);
router.get('/summary', visitStatController.getLoginSummary);

//  PRODUCT - Quản lý sản phẩm

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

//
router.get('/products/filters-data', productController.getFilterOptions);
router.get('/products/filter', productController.filterProducts);
router.post('/products/by-id', productController.getProductsByIds)
//  CATEGORY - Danh mục sản phẩm

router.post('/add-category', categoryController.createCategory);
router.get('/category-all', categoryController.getAllCategories);
router.get('/category/:id', categoryController.getCategoryById);
router.put('/category/:id', categoryController.updateCategory);
router.delete('/category/:id', categoryController.deleteCategory);

//  DISCOUNT - Mã giảm giá

router.post('/add-discount', discountController.createDiscount);
router.get('/discount-all', discountController.getAllDiscountTable);
router.get('/discount/:id', discountController.getDiscountByID);
router.put('/discount/:id', discountController.updateDiscount);
router.delete('/discount/:id', discountController.deleteDiscount);

//  ORDER - Đơn hàng

router.post('/add-order', verifyToken, orderController.createOrder);
router.get('/order-all', orderController.getAllOrders);
router.put('/update-order/:id/status', orderController.updateOrderStatus);
router.get('/orders/:id', verifyToken, orderController.getOrderByIdForUser);
//cancel order
router.put('/orders/:id/cancel-by-user', verifyToken, orderController.cancelOrderByUser);
// Dùng cho trang Theo dõi đơn hàng
router.get('/orders-detail/:id', verifyToken, orderController.getOrderByIdForUser);

// Dùng cho trang "Đơn hàng của tôi"
router.get('/my-orders', verifyToken, orderController.getMyOrders);
//  DASHBOARD - Thống kê tổng quan

router.get('/stats/overview', dashboardController.getOverviewStats);
router.get('/stats/sales', dashboardController.getSalesStats);
router.get('/stats/order-status', dashboardController.getOrderStatusStats);

//  REVIEW - Đánh giá sản phẩm

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
router.post('/admin/news', uploadImage, newController.createNews);
router.get('/admin/news', newController.getAllNewsAdmin);
router.get('/admin/news/:id', newController.getNewById);
router.put('/admin/news/:id', uploadImage, newController.updateNews);
router.delete('/admin/news/:id', newController.deleteNews);

// --- Client/Public Routes (Không cần xác thực) ---
router.get('/news', newController.getAllNews); // Lấy danh sách tin tức (có phân trang)
router.get('/news/:slug', newController.getNewsBySlug); // Lấy chi tiết một bài viết


// cart
router.get('/cart-all', verifyToken, cartController.getCart);
router.post('/add-cart', verifyToken, cartController.addToCart);
router.put('/update-cart/:id', verifyToken, cartController.updateCartItem);
router.delete('/delete-cart/:id', verifyToken, cartController.removeCartItem);

// contact
router.post('/contact', contactController.submitContactForm);
router.delete('/delete-contact/:id', contactController.deleteContact);
router.get('/contact-all', contactController.getAllContact);
router.put('/update-status/:id/status', contactController.updateStatusController);
module.exports = router;
