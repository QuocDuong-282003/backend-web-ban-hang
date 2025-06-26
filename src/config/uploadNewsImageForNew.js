

const multer = require('multer');


const storage = multer.memoryStorage();

// Bộ lọc để đảm bảo chỉ các file ảnh được tải lên.
const fileFilter = (req, file, cb) => {
    // Kiểm tra kiểu MIME của file
    if (file.mimetype.startsWith('image/')) {
        // Chấp nhận file
        cb(null, true);
    } else {
        // Từ chối file với một thông báo lỗi
        cb(new Error('File tải lên không phải là ảnh!'), false);
    }
};

// Khởi tạo multer với các cấu hình đã định nghĩa.
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Giới hạn kích thước file là 5MB
});

module.exports = upload.single('image');