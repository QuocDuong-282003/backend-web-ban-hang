/**
 * Rate Limiting Middleware
 * Bảo vệ API khỏi spam và brute force attacks
 */

// Lưu trữ request count trong memory (có thể thay bằng Redis trong production)
const requestStore = new Map();

/**
 * Xóa các entries cũ sau mỗi khoảng thời gian
 */
const cleanupOldEntries = () => {
    const now = Date.now();
    for (const [key, data] of requestStore.entries()) {
        if (now > data.resetTime) {
            requestStore.delete(key);
        }
    }
};

// Dọn dẹp mỗi 5 phút
setInterval(cleanupOldEntries, 5 * 60 * 1000);

/**
 * Tạo key duy nhất cho mỗi request (dựa trên IP hoặc email)
 * @param {Object} req - Express request object
 * @param {string} type - Loại rate limit (optional)
 * @returns {string} Key duy nhất
 */
const generateKey = (req, type = 'default') => {
    const identifier = req.body?.email || req.ip || req.headers['x-forwarded-for'] || 'unknown';
    return `${type}:${identifier}`;
};

/**
 * Rate Limiter Middleware
 * @param {Object} options - Cấu hình rate limit
 * @param {number} options.windowMs - Thời gian window (milliseconds)
 * @param {number} options.max - Số request tối đa trong window
 * @param {string} options.type - Loại rate limit
 * @param {string} options.message - Thông báo lỗi
 * @returns {Function} Express middleware
 */
const rateLimiter = (options = {}) => {
    const {
        windowMs = 15 * 60 * 1000, // 15 phút mặc định
        max = 5, // 5 requests mặc định
        type = 'default',
        message = 'Quá nhiều yêu cầu. Vui lòng thử lại sau.'
    } = options;

    return (req, res, next) => {
        const key = generateKey(req, type);
        const now = Date.now();

        // Lấy thông tin hiện tại
        const current = requestStore.get(key);

        // Nếu chưa có hoặc đã hết hạn
        if (!current || now > current.resetTime) {
            requestStore.set(key, {
                count: 1,
                resetTime: now + windowMs,
                firstRequest: now
            });
            return next();
        }

        // Kiểm tra số lượng requests
        if (current.count >= max) {
            const retryAfter = Math.ceil((current.resetTime - now) / 1000);
            return res.status(429).json({
                success: false,
                message,
                retryAfter: `${Math.ceil(retryAfter / 60)} phút`
            });
        }

        // Tăng count
        current.count++;
        requestStore.set(key, current);

        // Thêm headers
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, max - current.count));
        res.setHeader('X-RateLimit-Reset', new Date(current.resetTime).toISOString());

        next();
    };
};

/**
 * Rate limiter cho OTP APIs
 * Giới hạn: 3 requests mỗi 15 phút
 */
const otpRateLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 3, // Tối đa 3 lần gửi OTP
    type: 'otp',
    message: 'Bạn đã gửi quá nhiều yêu cầu OTP. Vui lòng đợi 15 phút trước khi thử lại.'
});

/**
 * Rate limiter cho Login APIs
 * Giới hạn: 5 requests mỗi 15 phút
 */
const loginRateLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 5, // Tối đa 5 lần đăng nhập
    type: 'login',
    message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.'
});

/**
 * Rate limiter cho Register APIs
 * Giới hạn: 3 requests mỗi 30 phút
 */
const registerRateLimiter = rateLimiter({
    windowMs: 30 * 60 * 1000, // 30 phút
    max: 3, // Tối đa 3 lần đăng ký
    type: 'register',
    message: 'Quá nhiều lần đăng ký. Vui lòng thử lại sau 30 phút.'
});

module.exports = {
    rateLimiter,
    otpRateLimiter,
    loginRateLimiter,
    registerRateLimiter
};

