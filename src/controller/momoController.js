// --- THAY THẾ TOÀN BỘ FILE: src/controllers/momo.controller.js ---

const MomoService = require('../services/momoService');

class momoController {
    /**
     * Xử lý yêu cầu tạo link thanh toán MoMo AIO
     * [POST] /api/payments/momo/create-aio
     */
    static async createAioPayment(req, res) {
        try {
            const { amount } = req.body;
            if (!amount) {
                return res.status(400).json({ message: "Thiếu tham số 'amount'" });
            }

            const orderInfo = "Thanh toán đơn hàng tại P and T Shop";
            const orderId = "momo-aio-" + new Date().getTime(); // Tạo mã đơn hàng duy nhất cho AIO

            // Gọi service để tạo link thanh toán AIO
            const payUrl = await MomoService.createAioPayment(amount, orderInfo, orderId);

            // Trả về payUrl cho frontend
            res.status(200).json({ payUrl });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * Xử lý IPN mà MoMo gọi về cho giao dịch AIO
     * [POST] /api/payments/momo-aio-ipn
     */
    static handleAioIpn(req, res) {
        console.log("=============== IPN từ MoMo AIO ================");
        console.log(req.body);

        // Gọi service để xác thực chữ ký (tái sử dụng hoặc viết hàm riêng)
        const verification = MomoService.verifyIpn(req.body);

        if (verification.isValid) {
            console.log("Xác thực IPN MoMo AIO thành công!");
            const { orderId, message, resultCode } = verification.data;

            if (resultCode === 0) {
                console.log(`Giao dịch AIO THÀNH CÔNG cho đơn hàng ${orderId}`);
                // TODO: Cập nhật trạng thái đơn hàng trong DB
            } else {
                console.log(`Giao dịch AIO THẤT BẠI cho đơn hàng ${orderId}. Lý do: ${message}`);
            }
        } else {
            console.error("Xác thực IPN MoMo AIO thất bại!");
        }

        // Luôn phải trả về status 204 cho MoMo
        res.status(204).send();
    }
}

module.exports = momoController;