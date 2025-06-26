const mongoose = require('mongoose');
const slugify = require('slugify');
const NewsContent = require('./NewsContent'); // Import model content

const newsSchema = new mongoose.Schema({
    title: {
        type: String,
        require: [true, 'Tieu de khong duoc de trong'],
        trim: true,
    },
    excerpt: {
        type: String,
        required: [true, 'Đoạn trích không được để trống'],
    },
    slug: {
        type: String,
        unique: true,
        index: true,
    },
    content: { type: String, require: [true, 'Noi dung khong duoc de trong'] },
    image: { data: Buffer, contentType: String },
    author: {
        type: String,
        default: 'admin',
    },
    status: {
        type: String,
        enum: ['published', 'draft'],
        default: 'published',
    }

}, { timeseries: true }
);
// tu dong tao slug trc khi luu
newsSchema.pre('save', function (next) {
    if (this.isModified('title')) {
        this.slug = slugify(this.title, { lower: true, strict: true, locate: 'vi' })
    }
    next();
});

module.exports = mongoose.model('News', newsSchema);
