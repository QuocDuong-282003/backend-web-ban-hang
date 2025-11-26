const auhtService = require('../services/auhtService');
const otpService = require('../services/otpService');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const streamifier = require('streamifier');
const cloudinary = require('../utils/cloudinary');
const upload = require('../middleware/uploadAvatar');
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await auhtService.loginUser(email, password);

        if (!process.env.JWT_SECRET) {
            console.error("FATAL ERROR: JWT_SECRET is not defined in .env file.");
            return res.status(500).json({ message: "Server configuration error." });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role, avatar: user.avatar } });
    } catch (err) {
        res.status(401).json({ message: err.message });
    }
};
///  AVATAR
exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'Chưa chọn file ảnh.' });
        //upload to cloudinary
        const streamUpload = (buffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'avatars' },
                    (error, result) => {
                        if (result) resolve(result);
                        else reject(error);

                    }
                );
                streamifier.createReadStream(buffer).pipe(stream);

            });
        };
        const result = await streamUpload(req.file.buffer);

        //save URL to user
        const user = await User.findByIdAndUpdate(req.user.id, {
            avatar: result.secure_url
        },
            { new: true }).select('-password');
        res.status(200).json({ message: 'Upload avatar thành công .', user });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi uppload avatar', error: error.message });

    }
}

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        // Kiểm tra trường bắt buộc
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin.' });
        }

        let avatarUrl = '';
        if (req.file) {
            // Upload lên Cloudinary
            const streamUpload = (buffer) => {
                return new Promise((resolve, reject) => {
                    let stream = cloudinary.uploader.upload_stream(
                        { folder: 'avatars' },
                        (error, result) => {
                            if (result) resolve(result);
                            else reject(error);
                        }
                    );
                    streamifier.createReadStream(buffer).pipe(stream);
                });
            };
            const result = await streamUpload(req.file.buffer);
            avatarUrl = result.secure_url;
        }

        const user = await auhtService.registerUser(email, password, name, 'user', avatarUrl);
        res.status(201).json({ user });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
// Gửi OTP cho đặt lại mật khẩu
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        if (!email) {
            return res.status(400).json({ message: 'Email là bắt buộc' });
        }
        // Gửi OTP cho reset password
        const result = await auhtService.sendOTPForAuth(email, 'reset-password');
        res.json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Đặt lại mật khẩu với OTP
exports.resetPassword = async (req, res) => {
    const { email, otpCode, newPassword } = req.body;
    try {
        if (!email || !otpCode || !newPassword) {
            return res.status(400).json({ message: 'Email, mã OTP và mật khẩu mới là bắt buộc' });
        }

        // Validate password strength
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
        }

        await auhtService.resetPasswordWithOTP(email, otpCode, newPassword);
        res.json({ message: 'Mật khẩu đã được đặt lại thành công' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}
//  Lấy danh sách tất cả người dùng
exports.getAllUsersTable = async (req, res) => {
    try {
        const users = await auhtService.getAllUsers();
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách người dùng' });
    }
};
exports.deleteUserById = async (req, res) => {

    const { id } = req.params;
    try {
        const result = await auhtService.deleteUser(id);
        if (!result) {
            return res.status(404).json({ message: 'Không tìm thấy user để xóa' });
        }
        res.json({ message: 'Đã xóa thành công' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi xóa user' });
    }
};
///
exports.updateProfile = async (req, res) => {
    try {
        // Lấy userId từ token đã được xác thực bởi middleware verifyToken

        const userId = req.user.id;
        const dataToUpdate = req.body; // { name, address, phone }

        const updatedUser = await auhtService.updateUserProfile(userId, dataToUpdate);

        res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin thành công!',
            user: updatedUser // Trả về user đã cập nhật để frontend update Redux
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.changePassword = async (req, res) => {
    try {
        // Lấy userId từ token
        const userId = req.user.id;
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mật khẩu cũ và mới.' });
        }

        await auhtService.changeUserPassword(userId, oldPassword, newPassword);

        res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công!' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        // req.user.id được thêm vào từ middleware verifyToken
        const user = await auhtService.getUserProfile(req.user.id);
        res.status(200).json({ user });
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};

// ============ OTP AUTHENTICATION ============

// Gửi OTP cho đăng ký hoặc đăng nhập
exports.sendOTP = async (req, res) => {
    try {
        const { email, type = 'register' } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email là bắt buộc' });
        }

        if (!['register', 'login', 'reset-password'].includes(type)) {
            return res.status(400).json({ message: 'Loại không hợp lệ. Chỉ chấp nhận "register", "login" hoặc "reset-password"' });
        }

        const result = await auhtService.sendOTPForAuth(email, type);
        res.status(200).json(result);
    } catch (err) {
        const errorMessage = err.message || 'Không thể gửi OTP. Vui lòng thử lại sau.';
        res.status(400).json({
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// Đăng ký với OTP
exports.registerWithOTP = async (req, res) => {
    try {
        const { name, email, otpCode } = req.body;

        if (!name || !email || !otpCode) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin (name, email, otpCode)' });
        }

        let avatarUrl = '';
        if (req.file) {
            // Upload lên Cloudinary
            const streamUpload = (buffer) => {
                return new Promise((resolve, reject) => {
                    let stream = cloudinary.uploader.upload_stream(
                        { folder: 'avatars' },
                        (error, result) => {
                            if (result) resolve(result);
                            else reject(error);
                        }
                    );
                    streamifier.createReadStream(buffer).pipe(stream);
                });
            };
            const result = await streamUpload(req.file.buffer);
            avatarUrl = result.secure_url;
        }

        const user = await auhtService.registerWithOTP(email, name, otpCode, avatarUrl);

        // Tạo JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Đăng ký thành công!',
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar,
                isEmailVerified: user.isEmailVerified
            }
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Đăng nhập với OTP
exports.loginWithOTP = async (req, res) => {
    try {
        const { email, otpCode } = req.body;

        if (!email || !otpCode) {
            return res.status(400).json({ message: 'Email và mã OTP là bắt buộc' });
        }

        const user = await auhtService.loginWithOTP(email, otpCode);

        if (!process.env.JWT_SECRET) {
            console.error("FATAL ERROR: JWT_SECRET is not defined in .env file.");
            return res.status(500).json({ message: "Server configuration error." });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Đăng nhập thành công!',
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar,
                isEmailVerified: user.isEmailVerified
            }
        });
    } catch (err) {
        res.status(401).json({ message: err.message });
    }
};

// ============ EMAIL + OTP REGISTRATION ============

/**
 * POST /api/auth/register
 * Đăng ký với Email + OTP (Bước 1: Gửi OTP)
 * 
 * Flow:
 * 1. Nhận email, name, password từ frontend (JSON only, không có file avatar)
 * 2. Kiểm tra email đã tồn tại chưa
 * 3. Sinh OTP 6 số, lưu DB với expiresAt 5 phút
 * 4. Gửi email OTP bằng NodeMailer
 * 5. Trả về thông báo OTP đã gửi
 * 
 * Lưu ý: 
 * - Route này KHÔNG có multer middleware → chỉ nhận JSON
 * - Avatar sẽ được upload sau khi đăng ký thành công trong phần "Cập nhật hồ sơ"
 * 
 * @param {Object} req.body - { email, name, password } (JSON only)
 * @returns {Object} { success: true, message: "OTP đã gửi vào email của bạn" }
 */
exports.registerWithEmail = async (req, res) => {
    try {
        // Debug: Log request body và content-type để đảm bảo nhận đúng JSON
        console.log('[POST /api/auth/register] Request body:', req.body);
        console.log('[POST /api/auth/register] Content-Type:', req.headers['content-type']);
        
        // Đảm bảo request là JSON (không phải FormData)
        const contentType = req.headers['content-type'] || '';
        if (contentType.includes('multipart/form-data')) {
            return res.status(400).json({
                success: false,
                message: 'API này chỉ nhận JSON. Vui lòng gửi dữ liệu dưới dạng JSON (không có file avatar). Avatar có thể upload sau trong phần "Cập nhật hồ sơ".'
            });
        }

        const { email, name, password } = req.body;

        // Step 1: Validate input
        if (!email || !name || !password) {
            console.log('[POST /api/auth/register] ❌ Missing fields:', {
                email: !!email,
                name: !!name,
                password: !!password
            });
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ thông tin (email, name, password)'
            });
        }

        // Step 2: Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('[POST /api/auth/register] ❌ Invalid email format:', email);
            return res.status(400).json({
                success: false,
                message: 'Email không hợp lệ'
            });
        }

        // Step 3: Validate password length
        if (password.length < 6) {
            console.log('[POST /api/auth/register] ❌ Password too short:', password.length);
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu phải có ít nhất 6 ký tự'
            });
        }

        // Step 4: Kiểm tra email đã tồn tại chưa
        console.log('[POST /api/auth/register] Checking if email exists:', email);
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('[POST /api/auth/register] ❌ Email already exists');
            return res.status(400).json({
                success: false,
                message: 'Email đã được sử dụng. Vui lòng đăng nhập.'
            });
        }

        // Step 5: Gửi OTP qua email
        console.log('[POST /api/auth/register] Sending OTP to:', email);
        // otpService sẽ tự động:
        // - Xóa OTP cũ của email này
        // - Tạo OTP mới 6 số
        // - Lưu vào DB với expiresAt = 5 phút
        // - Gửi email OTP
        await otpService.sendOTP(email, 'register');
        console.log('[POST /api/auth/register] ✅ OTP sent successfully');

        // Step 6: Trả về thông báo thành công
        res.status(200).json({
            success: true,
            message: 'OTP đã gửi vào email của bạn'
        });

    } catch (error) {
        console.error('[POST /api/auth/register] ❌ Error:', error);
        console.error('[POST /api/auth/register] Error message:', error.message);
        console.error('[POST /api/auth/register] Error stack:', error.stack);
        
        // Xử lý lỗi cụ thể từ email service
        let errorMessage = error.message || 'Không thể gửi OTP. Vui lòng thử lại sau.';
        
        // Lỗi SendGrid - Maximum credits exceeded
        if (error.message?.includes('Maximum credits exceeded') || 
            error.message?.includes('credits') ||
            error.message?.includes('quota')) {
            errorMessage = 'Email service đã hết quota. Vui lòng liên hệ admin hoặc thử lại sau.';
        }
        
        // Lỗi Gmail authentication
        if (error.message?.includes('EAUTH') || 
            error.message?.includes('authentication') ||
            error.message?.includes('Invalid login')) {
            errorMessage = 'Lỗi xác thực email. Vui lòng kiểm tra cấu hình EMAIL_PASSWORD trong .env file.';
        }
        
        // Lỗi không có cấu hình email
        if (error.message?.includes('cấu hình email') || 
            error.message?.includes('FROM_EMAIL') ||
            error.message?.includes('EMAIL_PASSWORD')) {
            errorMessage = 'Chưa cấu hình email service. Vui lòng liên hệ admin.';
        }
        
        res.status(400).json({
            success: false,
            message: errorMessage,
            // Chỉ trả về error detail trong development
            ...(process.env.NODE_ENV === 'development' && { 
                error: error.message,
                stack: error.stack 
            })
        });
    }
};

/**
 * POST /api/auth/verify-otp
 * Verify OTP và tạo user mới (Bước 2: Xác thực OTP và đăng ký)
 * 
 * Flow:
 * 1. Nhận email, code, name, password từ frontend (JSON only, không có file avatar)
 * 2. Kiểm tra OTP hợp lệ và chưa hết hạn (5 phút)
 * 3. Nếu đúng, tạo user mới với password đã hash
 * 4. Set isEmailVerified = true
 * 5. Xóa OTP đã dùng
 * 6. Tạo JWT token
 * 7. Set cookie HTTPOnly
 * 8. Trả về user info
 * 
 * Lưu ý:
 * - Route này KHÔNG có multer middleware → chỉ nhận JSON
 * - Avatar sẽ được set mặc định là '' (rỗng)
 * - User có thể upload avatar sau trong phần "Cập nhật hồ sơ" qua route /api/upload-avatar
 * 
 * @param {Object} req.body - { email, code, name, password } (JSON only)
 * @returns {Object} { message: "Đăng ký thành công", user: {...} }
 */
exports.verifyOTPAndRegister = async (req, res) => {
    try {
        // Debug: Log request body và content-type
        console.log('[POST /api/auth/verify-otp] Request body:', req.body);
        console.log('[POST /api/auth/verify-otp] Content-Type:', req.headers['content-type']);
        
        // Đảm bảo request là JSON (không phải FormData)
        const contentType = req.headers['content-type'] || '';
        if (contentType.includes('multipart/form-data')) {
            return res.status(400).json({
                success: false,
                message: 'API này chỉ nhận JSON. Vui lòng gửi dữ liệu dưới dạng JSON (không có file avatar). Avatar có thể upload sau trong phần "Cập nhật hồ sơ".'
            });
        }
        
        const { email, code, name, password } = req.body;

        // Step 1: Validate input
        if (!email || !code || !name || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ thông tin (email, code, name, password)'
            });
        }

        // Step 2: Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Email không hợp lệ'
            });
        }

        // Step 3: Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu phải có ít nhất 6 ký tự'
            });
        }

        // Step 4: Verify OTP và tạo user
        // Service sẽ:
        // - Verify OTP (kiểm tra code, expiresAt, chưa verify)
        // - Kiểm tra email chưa tồn tại
        // - Hash password
        // - Tạo user với isEmailVerified = true
        // - Xóa OTP đã dùng
        const user = await auhtService.registerWithEmailOTP(email, name, password, code);

        // Step 5: Generate JWT token
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: 'JWT_SECRET is not configured. Please set JWT_SECRET in .env file.'
            });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Step 6: Store JWT token in HttpOnly cookie
        // Detect if running on localhost or production
        const isProduction = process.env.NODE_ENV === 'production';
        const isLocalhost = req.get('host')?.includes('localhost') || 
                          req.get('host')?.includes('127.0.0.1') ||
                          !isProduction;
        
        res.cookie('token', token, {
            httpOnly: true,        // Prevents JavaScript access (XSS protection)
            secure: !isLocalhost,  // false for localhost, true for production (HTTPS)
            sameSite: 'lax',       // CSRF protection - allows cross-site requests
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/'              // Available for all paths
        });

        // Step 7: Return success response
        res.status(201).json({
            message: 'Đăng ký thành công',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar,
                isEmailVerified: user.isEmailVerified
            }
        });

    } catch (error) {
        console.error('Verify OTP and register error:', error);
        
        // Handle specific errors
        if (error.message.includes('OTP') || error.message.includes('mã')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        if (error.message.includes('Email đã')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(400).json({
            success: false,
            message: error.message || 'Đăng ký thất bại. Vui lòng thử lại.'
        });
    }
};

// ============ GOOGLE OAUTH ============

/**
 * POST /api/auth/google
 * Verify Google ID token from frontend and create JWT session
 * 
 * This endpoint:
 * 1. Receives Google id_token from @react-oauth/google (popup login)
 * 2. Verifies it using google-auth-library
 * 3. Creates or finds user in database
 * 4. Generates JWT token
 * 5. Stores JWT in HttpOnly cookie
 * 
 * @param {Object} req.body.id_token - Google ID token from frontend
 * @returns {Object} { message: "Login success", user: {...} }
 */
exports.googleLoginWithToken = async (req, res) => {
    try {
        // Step 1: Get Google id_token from request body
        const { id_token } = req.body;

        if (!id_token) {
            return res.status(400).json({
                success: false,
                message: 'Google id_token is required'
            });
        }

        // Step 2: Get Google Client ID from environment variables
        const { OAuth2Client } = require('google-auth-library');
        const clientId = process.env.GOOGLE_CLIENT_ID;

        if (!clientId) {
            return res.status(500).json({
                success: false,
                message: 'Google Client ID is not configured. Please set GOOGLE_CLIENT_ID in .env file.'
            });
        }

        // Step 3: Verify Google ID token
        const client = new OAuth2Client(clientId);
        const ticket = await client.verifyIdToken({
            idToken: id_token,
            audience: clientId
        });

        // Step 4: Extract user information from verified token
        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture: avatar } = payload;

        if (!email || !googleId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Google token: missing email or Google ID'
            });
        }

        // Step 5: Create or find user in database
        const user = await auhtService.loginOrRegisterWithGoogle(googleId, email, name, avatar);

        // Step 6: Generate JWT token
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: 'JWT_SECRET is not configured. Please set JWT_SECRET in .env file.'
            });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Step 7: Store JWT token in HttpOnly cookie
        // Detect if running on localhost or production
        const isProduction = process.env.NODE_ENV === 'production';
        const isLocalhost = req.get('host')?.includes('localhost') || 
                          req.get('host')?.includes('127.0.0.1') ||
                          !isProduction;
        
        res.cookie('token', token, {
            httpOnly: true,        // Prevents JavaScript access (XSS protection)
            secure: !isLocalhost,  // false for localhost, true for production (HTTPS)
            sameSite: 'lax',       // CSRF protection - allows cross-site requests
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/'              // Available for all paths
        });

        // Step 8: Return success response with user info (format theo yêu cầu)
        res.json({
            message: 'Login success',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar,
                isEmailVerified: user.isEmailVerified
            }
        });

    } catch (error) {
        console.error('Google login error:', error);

        if (!res.headersSent) {
            // Handle specific Google token errors
            if (error.message?.includes("Token used too early") ||
                error.message?.includes("Invalid token")) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid Google token. Please try again.'
                });
            }

            res.status(400).json({
                success: false,
                message: error.message || 'Error during Google login',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};

/**
 * GET /api/me
 * Get current authenticated user information from HttpOnly cookie
 * 
 * This endpoint:
 * 1. Reads JWT token from HttpOnly cookie
 * 2. Verifies the token
 * 3. Returns user information from database
 * 
 * @returns {Object} User information
 */
exports.getMe = async (req, res) => {
    try {
        // Debug: Log cookie information
        console.log('[GET /api/me] Cookies received:', req.cookies);
        console.log('[GET /api/me] Token from cookie:', req.cookies?.token ? 'EXISTS' : 'MISSING');
        
        // Step 1: Get JWT token from HttpOnly cookie (set by cookie-parser middleware)
        const token = req.cookies?.token;

        if (!token) {
            console.log('[GET /api/me] ❌ No token found - returning 401');
            return res.status(401).json({
                success: false,
                message: 'No authentication token found. Please login.'
            });
        }

        // Step 2: Verify JWT token
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: 'Server configuration error: JWT_SECRET not set.'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Step 3: Find user in database
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        // Step 4: Check if user account is active
        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Account is disabled.'
            });
        }

        // Step 5: Return user information
        console.log('[GET /api/me] ✅ Success - User:', user.email);
        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar,
                isEmailVerified: user.isEmailVerified,
                phone: user.phone,
                address: user.address
            }
        });
    } catch (error) {
        // Handle JWT verification errors
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            // Clear invalid cookie
            res.clearCookie('token');
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token. Please login again.'
            });
        }

        console.error('Get me error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching user information.'
        });
    }
};

/**
 * POST /api/auth/logout
 * Logout - Xóa cookie HTTPOnly
 * 
 * Endpoint này sẽ:
 * 1. Clear cookie 'token' (HTTPOnly) với cùng settings như khi set
 * 2. Trả về success message
 * 
 * QUAN TRỌNG: Phải clear cookie với cùng domain, path, secure, sameSite như khi set
 * để đảm bảo cookie được xóa hoàn toàn
 * 
 * @returns {Object} { success: true, message: "Logout successful" }
 */
exports.logout = async (req, res) => {
    try {
        // Detect if running on localhost or production để clear cookie đúng cách
        const isProduction = process.env.NODE_ENV === 'production';
        const isLocalhost = req.get('host')?.includes('localhost') || 
                          req.get('host')?.includes('127.0.0.1') ||
                          !isProduction;

        // Log để debug
        console.log('[POST /api/auth/logout] Clearing cookie...');
        console.log('[POST /api/auth/logout] Is localhost:', isLocalhost);
        console.log('[POST /api/auth/logout] Cookie before clear:', req.cookies?.token ? 'EXISTS' : 'NOT FOUND');

        // Clear cookie với CÙNG settings như khi set cookie
        // QUAN TRỌNG: Phải match chính xác với settings khi set cookie
        res.clearCookie('token', {
            httpOnly: true,        // Phải match với khi set
            secure: !isLocalhost,   // Phải match với khi set (false cho localhost)
            sameSite: 'lax',       // Phải match với khi set
            path: '/'              // Phải match với khi set
        });

        // Set cookie với expires trong quá khứ để đảm bảo xóa hoàn toàn
        // (Một số browser cần cả 2 cách)
        res.cookie('token', '', {
            httpOnly: true,
            secure: !isLocalhost,
            sameSite: 'lax',
            path: '/',
            expires: new Date(0)  // Expires ngay lập tức
        });

        console.log('[POST /api/auth/logout] ✅ Cookie cleared successfully');

        res.json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('[POST /api/auth/logout] ❌ Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during logout'
        });
    }
};
