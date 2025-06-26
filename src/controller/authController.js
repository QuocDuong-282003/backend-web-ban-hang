const auhtService = require('../services/auhtService');
const jwt = require('jsonwebtoken');
// exports.login = async (req, res) => {
//     const { email, password } = req.body;
//     try {
//         const user = await auhtService.loginUser(email, password);
//         res.json({
//             user: {
//                 id: user._id,
//                 email: user.email,
//                 name: user.name,
//                 role: user.role // role được gửi về FE
//             }
//         });
//     } catch (err) {
//         res.status(401).json({ message: err.message });
//     }
// };


//const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key'; // nên dùng biến môi trường

// exports.login = async (req, res) => {
//     const { email, password } = req.body;
//     try {
//         const user = await auhtService.loginUser(email, password);

//         // 🔐 Tạo JWT token
//         const token = jwt.sign(
//             {
//                 id: user._id,
//                 role: user.role
//             },
//             process.env.JWT_SECRET,
//             { expiresIn: '7d' }
//         );

//         // Trả về cả token + user
//         res.json({
//             token,
//             user: {
//                 id: user._id,
//                 email: user.email,
//                 name: user.name,
//                 role: user.role
//             }
//         });
//     } catch (err) {
//         res.status(401).json({ message: err.message });
//     }
// };
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

exports.register = async (req, res) => {
    const { email, password, name, role } = req.body;
    try {
        const user = await auhtService.registerUser(email, password, name, role);
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