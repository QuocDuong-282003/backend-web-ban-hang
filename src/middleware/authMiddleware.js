
const jwt = require('jsonwebtoken');

/**
 * Verify JWT token from either Authorization header or HttpOnly cookie
 * Supports both Bearer token (Authorization header) and cookie-based authentication
 */
const verifyToken = (req, res, next) => {
    // Try to get token from Authorization header first (for backward compatibility)
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];

    // If no token in header, try to get from HttpOnly cookie
    if (!token && req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({ message: 'Không tìm thấy token. Yêu cầu xác thực.' });
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: "Lỗi cấu hình: JWT_SECRET không được tìm thấy trên server." });
    }

    jwt.verify(
        token,
        process.env.JWT_SECRET, 
        (err, user) => {
            if (err) {
                // Clear invalid cookie if present
                if (req.cookies && req.cookies.token) {
                    res.clearCookie('token');
                }
                return res.status(401).json({ message: 'Vui lòng đăng nhập lại tài khoản của bạn!' });
            }
            req.user = user;
            next();
        }
    );
};

const verifyAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ message: 'Yêu cầu quyền Admin. Truy cập bị từ chối.' });
    }
};

module.exports = { verifyToken, verifyAdmin };