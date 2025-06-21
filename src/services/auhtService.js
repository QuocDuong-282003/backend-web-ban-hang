const User = require('../models/User');
const bcrypt = require('bcryptjs');
const statService = require('./statService');
exports.loginUser = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error('Tài khoản không tồn tại');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Mật khẩu không đúng');
    // Ghi nhận thống kê login
    await statService.increaseLoginCount(user.role);
    const { password: _, ...userData } = user._doc;
    return userData;
};


exports.registerUser = async (email, password, name, role = 'user') => {
    const exist = await User.findOne({ email });
    if (exist) throw new Error('Email đã tồn tại');

    const hash = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hash, name, role });
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
    user.password = hashed; // chưa mã hóa. nên hash ở đây
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
