// server.js

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/router/web');

// Load biến môi trường từ file .env
dotenv.config();

// Kết nối tới MongoDB hoặc cơ sở dữ liệu khác
connectDB();

const app = express();

// Cho phép CORS
app.use(cors());

// Cấu hình giới hạn payload lớn hơn mặc định để tránh lỗi 413 (Payload Too Large)
app.use(express.json({ limit: '50mb' })); // cho dữ liệu kiểu JSON
app.use(express.urlencoded({ limit: '50mb', extended: true })); // cho form data

// Định tuyến API
app.use('/api', authRoutes);

// Cổng chạy server
const PORT = process.env.PORT || 5000;

// Khởi chạy server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
