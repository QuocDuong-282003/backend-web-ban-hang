const mongoose = require('mongoose');

const newsContentSchema = new mongoose.Schema({
    content: { type: String, required: true },
    // Tạo mối quan hệ 1-1 với collection 'News'
    news_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'News',
        required: true,
        unique: true,
    },
});

module.exports = mongoose.model('NewsContent', newsContentSchema);