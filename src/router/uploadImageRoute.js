// --- File: router/uploadImageRoute.js (SỬA LẠI HOÀN TOÀN) ---

const express = require('express');
const router = express.Router();

// 1. Import các handler từ đúng file
const newsController = require('../controller/newController');
const contentImageUpload = require('../middleware/contentImageUpload');

// 2. Sử dụng các handler đã import
// Endpoint sẽ là /api/upload/content-image
router.post(
    '/content-image',
    contentImageUpload,        // Đây là middleware, là một function
    newsController.uploadContentImage // Đây là controller, là một function
);

module.exports = router;