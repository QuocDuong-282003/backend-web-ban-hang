const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const visitStatController = require('../controller/visitStatController');
const productController = require('../controller/productController');
const categoryController = require('../controller/categoryController');
const uploadImagesMiddleware = require('../../src/config/upLoadImg');
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
//category
router.post('/add-category', categoryController.createCategory);
router.get('/category-all', categoryController.getAllCategories);
router.get('/category/:id', categoryController.getCategoryById);
router.put('/category/:id', categoryController.updateCategory);
router.delete('/category/:id', categoryController.deleteCategory);
module.exports = router;




