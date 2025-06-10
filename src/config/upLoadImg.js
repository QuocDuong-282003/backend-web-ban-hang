const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận định dạng PNG, JPG hoặc JPEG'), false);
    }
};

// Tạo middleware từ multer. Bản thân nó đã là một hàm middleware hoàn chỉnh.
const uploadImages = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter,
}).fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'images', maxCount: 10 }
]);

// Gán middleware của multer cho biến bạn muốn export.
// Đây là cách sửa lỗi chính.
const uploadImagesMiddleware = uploadImages;

module.exports = uploadImagesMiddleware;