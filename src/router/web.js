const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const visitStatController = require('../controller/visitStatController');
const productController = require('../controller/productController');
const categoryController = require('../controller/categoryController');
const uploadImagesMiddleware = require('../../src/config/upLoadImg');
const discountController = require('../controller/discountController');
const orderController = require('../controller/orderController');
const dashboardController = require('../controller/dashboardController');
const reviewController = require('../controller/reviewController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
// API đăng nhập & đăng ký
router.post('/login', authController.login);
router.post('/register', authController.register);
// Lấy danh sách user
router.get('/users', authController.getAllUsersTable);
router.delete('/users/:id', authController.deleteUserById);


//  Forgot password flow
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
//
router.post('/stat', visitStatController.trackLogin);          // POST /api/stat
router.get('/date', visitStatController.getLoginToday);    // GET /api/stat/date
router.get('/month', visitStatController.getLoginThisMonth); // GET /api/stat/month
router.get('/summary', visitStatController.getLoginSummary);



// product
router.post('/add-product', uploadImagesMiddleware, productController.createProduct);
router.get('/product-all', productController.getAllProducts);
router.get('/product/:id', productController.getProductById);
router.put('/product/:id', uploadImagesMiddleware, productController.updateProduct);
router.delete('/product/:id', productController.deleteProduct);
router.post('/products/:id/assign-discounts', productController.assignDiscountsToProduct);
//category
router.post('/add-category', categoryController.createCategory);
router.get('/category-all', categoryController.getAllCategories);
router.get('/category/:id', categoryController.getCategoryById);
router.put('/category/:id', categoryController.updateCategory);
router.delete('/category/:id', categoryController.deleteCategory);

//discount
router.post('/add-discount', discountController.createDiscount);
router.get('/discount-all', discountController.getAllDiscountTable);
router.get('/discount/:id', discountController.getDiscountByID);
router.put('/discount/:id', discountController.updateDiscount);
router.delete('/discount/:id', discountController.deleteDiscount);
//order
router.post('/add-order', orderController.createOrder);
router.get('/order-all', orderController.getAllOrders);
router.put('/update-order/:id/status', orderController.updateOrderStatus);
// ===================================
router.get('/stats/overview', dashboardController.getOverviewStats);
router.get('/stats/sales', dashboardController.getSalesStats);
router.get('/stats/order-status', dashboardController.getOrderStatusStats);

// === ADMIN REVIEW ROUTES ===
router.get('/admin/reviews', verifyToken, verifyAdmin, reviewController.adminGetAllReviews);
router.post('/reviews/export', verifyToken, verifyAdmin, reviewController.adminExportReview);

// === USER REVIEW ROUTES ===
router.post('/reviews', verifyToken, reviewController.userCreateReview);
router.put('/reviews/:id', verifyToken, reviewController.userUpdateReview);
router.delete('/reviews/:id', verifyToken, reviewController.userDeleteReview);

// === PUBLIC REVIEW ROUTE ===
router.get('/products/:productId/reviews', reviewController.publicGetProductReview);
module.exports = router;




