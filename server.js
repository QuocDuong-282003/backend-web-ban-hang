const dotenv = require('dotenv');
dotenv.config();
console.log("GOOGLE_CLIENT_ID from ENV:", process.env.GOOGLE_CLIENT_ID);

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const validateEnv = require('./src/config/validateEnv');
const connectDB = require('./src/config/db');
const web = require('./src/router/web');
const uploadImageRoute = require('./src/router/uploadImageRoute');
const payRoute = require('./src/router/payRoute');

const { scheduleCleanup } = require('./src/cron/cleanup');

// Validate environment variables before starting
validateEnv();

connectDB();

const app = express();

// Cho phép CORS với credentials - cho phép nhiều origins
const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
].filter(Boolean); // Loại bỏ giá trị undefined/null

app.use(cors({
    origin: function (origin, callback) {
        // Cho phép requests không có origin (như Postman, mobile apps, same-origin requests)
        if (!origin) {
            return callback(null, true);
        }

        // Kiểm tra origin có trong danh sách allowed không
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            // Log để debug nhưng vẫn cho phép trong development
            if (process.env.NODE_ENV === 'development') {

                return callback(null, true);
            } else {
                // Trong production, chặn origin không được phép

                callback(new Error('Not allowed by CORS'));
            }
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// Cookie parser để xử lý cookie
app.use(cookieParser());

// Middleware để log requests (debug)
app.use((req, res, next) => {
    const origin = req.headers.origin || 'no origin';
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} | Origin: ${origin}`);
    next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true })); // cho form data

app.use('/api', uploadImageRoute);
app.use('/api', web);
app.use('/api', payRoute);

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'Backend đang hoạt động!',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Unhandled Error:', err);
    if (!res.headersSent) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

scheduleCleanup();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
    console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
    console.log(`🌐 CORS enabled for origins:`);
    allowedOrigins.forEach(origin => {
        console.log(`   - ${origin}`);
    });
    console.log(`\n✅ Backend is ready to accept requests!\n`);
});
