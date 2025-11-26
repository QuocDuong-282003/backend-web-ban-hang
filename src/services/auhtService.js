const User = require('../models/User');
const bcrypt = require('bcryptjs');
const statService = require('./statService');
const otpService = require('./otpService');
exports.loginUser = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error('Tài khoản không tồn tại');
    if (user.status !== 'active') {
        throw new Error('Tài khoản đã bị khóa. Vui lòng tạo lại mật khẩu hoặc tài khoản !')
    }
    // Kiểm tra user có password không (có thể đăng ký bằng OTP/Google)
    if (!user.password) {
        throw new Error('Tài khoản này không có mật khẩu. Vui lòng đăng nhập bằng OTP hoặc Google.');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Mật khẩu không đúng');
    // Ghi nhận thống kê login
    await statService.increaseLoginCount(user.role);
    const { password: _, ...userData } = user._doc;
    return userData;
};


exports.registerUser = async (email, password, name, role = 'user', avatarUrl = '') => {
    const exist = await User.findOne({ email });
    if (exist) throw new Error('Email đã tồn tại');

    const hash = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hash, name, role, avatar: avatarUrl });
    await user.save();
    await statService.increaseLoginCount(role);
    const { password: _, ...userData } = user._doc;
    return userData;
};

//
exports.checkEmailExist = async (email) => {
    if (!email) throw new Error('Thiếu email');
    const user = await User.findOne({ email });
    if (!user) throw new Error('Email không tồn tại');
    return true;
};
exports.updatePasswordUser = async (email, newPassword) => {
    const user = await User.findOne({ email });
    if (!user)
        throw new Error('Email không tồn tại');
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();
    return true;
}

// Đặt lại mật khẩu với OTP
exports.resetPasswordWithOTP = async (email, otpCode, newPassword) => {
    // Xác thực OTP trước
    await otpService.verifyOTP(email, otpCode, 'reset-password');

    const user = await User.findOne({ email });
    if (!user) throw new Error('Email không tồn tại');

    // Kiểm tra user có password không (nếu không có thì không cần reset)
    if (!user.password) {
        throw new Error('Tài khoản này không có mật khẩu. Vui lòng đăng nhập bằng OTP hoặc Google.');
    }

    // Cập nhật mật khẩu mới
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    return true;
}
//  Lấy tất cả user
exports.getAllUsers = async () => {
    return await User.find().sort({ createdAt: -1 });
};
//
exports.deleteUser = async (id) => {
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) throw new Error('Không tìm thấy user để xóa');
    return true;
};


//
exports.updateUserProfile = async (userId, dataToUpdate) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('Người dùng không tồn tại.');

    if (dataToUpdate.name) user.name = dataToUpdate.name;
    if (dataToUpdate.address) user.address = dataToUpdate.address;
    if (dataToUpdate.phone) user.phone = dataToUpdate.phone;
    if (dataToUpdate.avatar) user.avatar = dataToUpdate.avatar;

    await user.save();

    // Trả về dữ liệu người dùng đã cập nhật, loại bỏ mật khẩu
    const { password, ...updatedUserData } = user._doc;
    return updatedUserData;
};

exports.changeUserPassword = async (userId, oldPassword, newPassword) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('Người dùng không tồn tại.');

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) throw new Error('Mật khẩu cũ không đúng.');

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return true;
};
exports.getUserProfile = async (userId) => {
    const user = await User.findById(userId).select('-password'); // .select('-password') để không trả về mật khẩu
    if (!user) throw new Error('Không tìm thấy người dùng.');
    return user;
};

// ============ OTP AUTHENTICATION ============

// Gửi OTP cho đăng ký hoặc đăng nhập
exports.sendOTPForAuth = async (email, type = 'register') => {
    if (!email) throw new Error('Email là bắt buộc');

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Email không hợp lệ');
    }

    if (type === 'register') {
        // Kiểm tra email đã tồn tại chưa
        const exist = await User.findOne({ email });
        if (exist) throw new Error('Email đã được sử dụng. Vui lòng đăng nhập.');
    } else if (type === 'login') {
        // Kiểm tra email có tồn tại không
        const user = await User.findOne({ email });
        if (!user) throw new Error('Email chưa được đăng ký. Vui lòng đăng ký trước.');
    } else if (type === 'reset-password') {
        // Kiểm tra email có tồn tại không
        const user = await User.findOne({ email });
        if (!user) throw new Error('Email chưa được đăng ký. Vui lòng đăng ký trước.');
        // Kiểm tra user có password không (không thể reset nếu đăng ký bằng OTP/Google)
        if (!user.password) {
            throw new Error('Tài khoản này không có mật khẩu. Vui lòng đăng nhập bằng OTP hoặc Google.');
        }
    }

    return await otpService.sendOTP(email, type);
};

// Xác thực OTP
exports.verifyOTPForAuth = async (email, code, type = 'register') => {
    return await otpService.verifyOTP(email, code, type);
};

// Đăng ký với OTP (không cần mật khẩu)
exports.registerWithOTP = async (email, name, otpCode, avatarUrl = '') => {
    // Xác thực OTP trước
    await otpService.verifyOTP(email, otpCode, 'register');

    // Kiểm tra email đã tồn tại chưa
    const exist = await User.findOne({ email });
    if (exist) throw new Error('Email đã được sử dụng');

    // Tạo user mới (không có password)
    const user = new User({
        email,
        name,
        avatar: avatarUrl,
        isEmailVerified: true,
        role: 'user'
    });
    await user.save();
    await statService.increaseLoginCount('user');

    const { password, ...userData } = user._doc;
    return userData;
};

// Đăng nhập với OTP (không cần mật khẩu)
exports.loginWithOTP = async (email, otpCode) => {
    // Xác thực OTP trước
    await otpService.verifyOTP(email, otpCode, 'login');

    const user = await User.findOne({ email });
    if (!user) throw new Error('Tài khoản không tồn tại');

    if (user.status !== 'active') {
        throw new Error('Tài khoản đã bị khóa. Vui lòng liên hệ admin.');
    }

    // Cập nhật isEmailVerified
    user.isEmailVerified = true;
    await user.save();

    // Ghi nhận thống kê login
    await statService.increaseLoginCount(user.role);

    const { password, ...userData } = user._doc;
    return userData;
};

// ============ GOOGLE OAUTH ============

// Đăng ký/Đăng nhập với Google
exports.loginOrRegisterWithGoogle = async (googleId, email, name, avatar) => {
    console.log("=== SERVICE loginOrRegisterWithGoogle START ===");
    console.log("Input:", { googleId, email, name, avatar });

    // Validate required fields
    if (!email) {
        throw new Error('Email là bắt buộc');
    }
    if (!googleId) {
        throw new Error('Google ID là bắt buộc');
    }
    if (!name) {
        throw new Error('Tên là bắt buộc');
    }

    try {
        let user = await User.findOne({ email });
        console.log("User found by email:", user ? "YES" : "NO");

        if (user) {
            console.log("User exists → updating googleId if missing");
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
                console.log("Updated existing user googleId:", user.googleId);
            }
            // Update avatar if provided and different
            if (avatar && user.avatar !== avatar) {
                user.avatar = avatar;
                await user.save();
                console.log("Updated user avatar");
            }
            console.log("Returning existing user:", user._id);
            return user;
        }

        console.log("User does not exist → creating new user");
        user = new User({
            googleId,
            email,
            name,
            avatar: avatar || '',
            role: "user",
            isEmailVerified: true,
            status: 'active'
        });

        await user.save();
        console.log("New user created successfully:", user._id);
        console.log("User details:", {
            id: user._id,
            email: user.email,
            name: user.name,
            googleId: user.googleId
        });

        return user;
    } catch (error) {
        console.error("❌ ERROR in loginOrRegisterWithGoogle:", error);
        console.error("Error details:", {
            message: error.message,
            code: error.code,
            name: error.name
        });

        // Handle duplicate key error
        if (error.code === 11000) {
            if (error.keyPattern?.email) {
                throw new Error('Email đã được sử dụng');
            }
            if (error.keyPattern?.googleId) {
                throw new Error('Google ID đã được sử dụng');
            }
        }

        throw error;
    }
};

// ============ EMAIL + OTP REGISTRATION ============

/**
 * Đăng ký với Email + OTP
 * Flow: User nhập email, name, password → Gửi OTP → Verify OTP → Tạo user
 * 
 * Lưu ý: Avatar không được gửi trong quá trình đăng ký
 * - Avatar mặc định là '' (rỗng)
 * - User có thể upload avatar sau trong phần "Cập nhật hồ sơ"
 * 
 * @param {string} email - Email của user
 * @param {string} name - Tên của user
 * @param {string} password - Password (sẽ được hash)
 * @param {string} otpCode - Mã OTP đã verify
 * @param {string} avatarUrl - URL avatar (optional, mặc định là '')
 * @returns {Object} User data (không có password)
 */
exports.registerWithEmailOTP = async (email, name, password, otpCode, avatarUrl = '') => {
    // Validate input
    if (!email || !name || !password || !otpCode) {
        throw new Error('Vui lòng nhập đầy đủ thông tin (email, name, password, otpCode)');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Email không hợp lệ');
    }

    // Validate password length
    if (password.length < 6) {
        throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
    }

    // Kiểm tra email đã tồn tại chưa
    const exist = await User.findOne({ email });
    if (exist) {
        throw new Error('Email đã được sử dụng. Vui lòng đăng nhập.');
    }

    // Verify OTP
    await otpService.verifyOTP(email, otpCode, 'register');

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Tạo user mới
    // Lưu ý: avatar mặc định là '' (rỗng) - user có thể upload sau trong phần "Cập nhật hồ sơ"
    const user = new User({
        email,
        name,
        password: hash,
        avatar: avatarUrl || '', // Avatar mặc định là rỗng, có thể upload sau
        isEmailVerified: true, // Email đã được verify qua OTP
        role: 'user',
        status: 'active'
    });

    await user.save();
    await statService.increaseLoginCount('user');

    // Trả về user data (không có password)
    const { password: _, ...userData } = user._doc;
    return userData;
};


