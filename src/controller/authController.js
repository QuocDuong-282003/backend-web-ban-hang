const auhtService = require('../services/auhtService');
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

        // Log để kiểm tra khóa bí mật tại thời điểm ký
        console.log('[AUTH CONTROLLER] Đang KÝ token với khóa bí mật:', process.env.JWT_SECRET);

        if (!process.env.JWT_SECRET) {
            console.error("FATAL ERROR: JWT_SECRET is not defined in .env file.");
            return res.status(500).json({ message: "Server configuration error." });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
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
// exports.register = async (req, res) => {
//     const { email, password, name, role } = req.body;
//     try {
//         const user = await auhtService.registerUser(email, password, name, role);
//         res.status(201).json({ user });
//     } catch (err) {
//         res.status(400).json({ message: err.message });
//     }
// };
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
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        await auhtService.checkEmailExist(email);
        res.json({ message: ' Email hợp lệ!' });
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};
exports.resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;
    try {
        await auhtService.updatePasswordUser(email, newPassword);
        res.json({ message: 'Mật khẩu đã được cập nhật' });
    } catch (error) {
        res.status(400).json({ message: error.message })

    }
}
//  Lấy danh sách tất cả người dùng
exports.getAllUsersTable = async (req, res) => {
    try {
        const users = await auhtService.getAllUsers();
        console.log("check userr", users)
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