const mongoose = require('mongoose');
const discountSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    description: { type: String },
    discountType: { type: String, enum: ['percent', 'fixed'], required: true },
    value: { type: Number, required: true, min: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    searchCount: { type: Number, default: 0 },
    // appliesTo: [{
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Product'
    // }]
}, { timestamps: true });
discountSchema.index({ code: "text", description: "text" });
module.exports = mongoose.model('Discount', discountSchema);