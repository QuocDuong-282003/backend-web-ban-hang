
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Không tìm thấy token. Yêu cầu xác thực.' });
    }




    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: "Lỗi cấu hình: JWT_SECRET không được tìm thấy trên server." });
    }

    jwt.verify(
        token,
        process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(401).json({ message: 'Vui lòng đăng nhập lại tài khoản của bạn!' });
            }
            req.user = user;
            next();
        });
};

const verifyAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ message: 'Yêu cầu quyền Admin. Truy cập bị từ chối.' });
    }
};

module.exports = { verifyToken, verifyAdmin };