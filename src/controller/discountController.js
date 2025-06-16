const discountService = require('../services/discountService');

const Discount = require('../models/Discount');
exports.createDiscount = async (req, res) => {
    try {
        const { code, description, discountType, value, startDate,
            endDate, isActive } = req.body;
        console.log('Check discount controller,', req.body);

        if (!code || !description || !discountType || !value || !startDate || !endDate) {
            return res.status(400).json({ message: 'Vui long dien day du thong tin' })

        }
        if (!['percent', 'fixed'].includes(discountType)) {
            return res.status(400).json({ message: "Loại giảm giá không hợp lệ. Chỉ chấp nhận 'percent' hoặc 'fixed'." });
        }

        //  Ép kiểu và Validate `value`
        const numericValue = parseFloat(value);
        if (isNaN(numericValue) || numericValue < 0) {
            return res.status(400).json({ message: 'Giá trị (value) phải là một số không âm.' });
        }

        const discountData = {
            code, description, discountType, value: numericValue, startDate, endDate,
            isActive: isActive !== undefined ? isActive : true // Nếu không có thì mặc định là true
        }
        const discount = await discountService.createDiscount(discountData);
        res.status(201).json(discount);

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi tạo sản phẩm', error: error.message });
    }
}
//
exports.getAllDiscountTable = async (req, res) => {
    try {
        const discounts = await discountService.getAllDiscount();
        console.log("check disucount list", discounts)
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