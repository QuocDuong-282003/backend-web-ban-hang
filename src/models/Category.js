const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    slug: { type: String, unique: true },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active',
    }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
