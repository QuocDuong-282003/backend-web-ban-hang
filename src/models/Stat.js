const mongoose = require('mongoose');
const statSchema = new mongoose.Schema({
    type: { type: String, enum: ['user', 'admin'], required: true },
    date: { type: Date, required: true },
    count: { type: Number, default: 1 },
});

statSchema.index({ type: 1, date: 1 }, { unique: true }); // để không lưu trùng

module.exports = mongoose.model('Stat', statSchema);