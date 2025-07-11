const Discount = require('../models/Discount');
const Product = require('../models/Product');
exports.createDiscount = async (data) => {
    const existingCode = await Discount.findOne({ code: data.code });
    if (existingCode) {

        throw new Error('Mã giảm giá đã tồn tại.');
    }
    const discount = await Discount.create({
        code: data.code,
        description: data.description,
        discountType: data.discountType,
        value: data.value,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: data.isActive,

    })
    console.log('Sản phẩm thêm thành công');
    return discount;
}
//
exports.getAllDiscount = async () => {
    return await Discount.find().sort({ createdAt: -1 });
}
// 
exports.getDiscountById = async (discountID) => {
    return await Discount.findById(discountID);

}
//
exports.updateDiscount = async (discountId, data) => {
    return await Discount.findByIdAndUpdate(discountId, data, { new: true });
}
//
exports.deleteDiscount = async (discountID) => {
    return await Discount.findByIdAndDelete(discountID);
}