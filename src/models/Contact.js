const mongoose = require('mongoose');
const ContactSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Tên người gửi là bắt buộc!'] },
    email: { type: String, required: true, unique: true },
    phone: {
        type: String,
        trim: true
    },
    content: {
        type: String,
        require: true
    },
    status: {
        type: String,
        enum: ['new', 'read', 'replied'],
        default: 'new'
    }
}, { timestamps: true });
module.exports = mongoose.model('Contact', ContactSchema);