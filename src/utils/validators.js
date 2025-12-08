/**
 * Validation Utilities
 * Các hàm validation chung cho toàn bộ ứng dụng
 */

/**
 * Validate email format
 * @param {string} email - Email cần validate
 * @returns {boolean} true nếu email hợp lệ
 */
const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') {
        return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
};

/**
 * Validate password strength
 * @param {string} password - Password cần validate
 * @param {Object} options - Tùy chọn validation
 * @param {number} options.minLength - Độ dài tối thiểu (mặc định: 6)
 * @param {number} options.maxLength - Độ dài tối đa (mặc định: 128)
 * @returns {Object} { valid: boolean, message: string }
 */
const validatePassword = (password, options = {}) => {
    const { minLength = 6, maxLength = 128 } = options;

    if (!password || typeof password !== 'string') {
        return {
            valid: false,
            message: 'Mật khẩu là bắt buộc'
        };
    }

    if (password.length < minLength) {
        return {
            valid: false,
            message: `Mật khẩu phải có ít nhất ${minLength} ký tự`
        };
    }

    if (password.length > maxLength) {
        return {
            valid: false,
            message: `Mật khẩu không được vượt quá ${maxLength} ký tự`
        };
    }

    return {
        valid: true,
        message: 'Mật khẩu hợp lệ'
    };
};

/**
 * Validate name
 * @param {string} name - Tên cần validate
 * @param {Object} options - Tùy chọn validation
 * @param {number} options.minLength - Độ dài tối thiểu (mặc định: 2)
 * @param {number} options.maxLength - Độ dài tối đa (mặc định: 100)
 * @returns {Object} { valid: boolean, message: string }
 */
const validateName = (name, options = {}) => {
    const { minLength = 2, maxLength = 100 } = options;

    if (!name || typeof name !== 'string') {
        return {
            valid: false,
            message: 'Tên là bắt buộc'
        };
    }

    const trimmedName = name.trim();

    if (trimmedName.length < minLength) {
        return {
            valid: false,
            message: `Tên phải có ít nhất ${minLength} ký tự`
        };
    }

    if (trimmedName.length > maxLength) {
        return {
            valid: false,
            message: `Tên không được vượt quá ${maxLength} ký tự`
        };
    }

    return {
        valid: true,
        message: 'Tên hợp lệ'
    };
};

/**
 * Validate OTP code (6 digits)
 * @param {string} otp - Mã OTP cần validate
 * @returns {Object} { valid: boolean, message: string }
 */
const validateOTP = (otp) => {
    if (!otp || typeof otp !== 'string') {
        return {
            valid: false,
            message: 'Mã OTP là bắt buộc'
        };
    }

    const otpRegex = /^\d{6}$/;
    if (!otpRegex.test(otp)) {
        return {
            valid: false,
            message: 'Mã OTP phải là 6 chữ số'
        };
    }

    return {
        valid: true,
        message: 'Mã OTP hợp lệ'
    };
};

/**
 * Sanitize string input (loại bỏ khoảng trắng thừa)
 * @param {string} str - Chuỗi cần sanitize
 * @returns {string} Chuỗi đã được sanitize
 */
const sanitizeString = (str) => {
    if (!str || typeof str !== 'string') {
        return '';
    }
    return str.trim();
};

module.exports = {
    isValidEmail,
    validatePassword,
    validateName,
    validateOTP,
    sanitizeString
};

