const mongoose = require('mongoose');
const Stat = require('./Stat'); // đúng đường dẫn tới file Stat.js

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: String,
    address: String,
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    createdAt: { type: Date, default: Date.now }
});

//  Hook ghi nhận tạo user mới vào Stat

module.exports = mongoose.model('User', userSchema);
