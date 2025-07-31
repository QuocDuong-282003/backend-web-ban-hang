const discountService = require('../services/discountService');

const Discount = require('../models/Discount');

exports.createDiscount = async (req, res) => {
    try {
        const { code, description, discountType, value, startDate,
            endDate, isActive } = req.body;

        if (!code || !description || !discountType || !value || !startDate || !endDate) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
        }
        if (!['percent', 'fixed'].includes(discountType)) {
            return res.status(400).json({ message: "Loại giảm giá không hợp lệ. Chỉ chấp nhận 'percent' hoặc 'fixed'." });
        }
        const numericValue = parseFloat(value);
        if (isNaN(numericValue) || numericValue < 0) {
            return res.status(400).json({ message: 'Giá trị (value) phải là một số không âm.' });
        }

        const discountData = {
            code, description, discountType, value: numericValue, startDate, endDate,
            isActive: isActive !== undefined ? isActive : true
        };

        const newDiscountFromDB = await discountService.createDiscount(discountData);

        const discountObject = newDiscountFromDB.toObject();

        // 3. Tính toán trường 'status'
        const now = new Date();
        if (!discountObject.isActive) {
            discountObject.status = 'Vô hiệu hoá';
        } else if (now > new Date(discountObject.endDate)) {
            discountObject.status = 'Đã hết hạn';
        } else if (now < new Date(discountObject.startDate)) {
            discountObject.status = 'Chưa bắt đầu';
        } else {
            discountObject.status = 'Đang hoạt động';
        }

        res.status(201).json(discountObject);

    } catch (error) {
        res.status(400).json({ message: error.message || 'Lỗi server khi tạo mã giảm giá' });
    }
};
exports.getAllDiscountTable = async (req, res) => {
    try {
        const discounts = await discountService.getAllDiscount();
        res.json(discounts)
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server lay  sản phẩm', error: error.message });

    }
}
// 
exports.getDiscountByID = async (req, res) => {
    try {
        const discount = await discountService.getDiscountById(req.params.id);
        if (!discount) return res.status(404).json({ message: 'khong tim thay ' });
        res.json(discount);
    } catch (error) {
        res.json(500).json({ message: error.message });
    }
}
//

exports.updateDiscount = async (req, res) => {
    try {
        const discountId = req.params.id;
        const updateData = req.body;
        const updateDiscount = await discountService.updateDiscount(discountId, updateData);
        if (!updateDiscount) {
            return res.status(404).json({ message: 'khong tim thay ma giam gia de cap nhat' });
        }
        res.status(200).json(updateDiscount);
    } catch (error) {
        console.error(' [Controller] Lỗi khi cập nhật ma:', error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật ma', error: error.message });
    }
}
// 
exports.deleteDiscount = async (req, res) => {
    try {
        const deleted = await discountService.deleteDiscount(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: 'khong tim thay ma' })
        }
        res.json({ message: 'xoa thanh cong' });
    } catch (error) {
        res.status(500).json({ message: error.message });

    }
}