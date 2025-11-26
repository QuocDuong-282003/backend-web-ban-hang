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
        // Gọi service để xác thực chữ ký (tái sử dụng hoặc viết hàm riêng)
        const verification = MomoService.verifyIpn(req.body);

        if (verification.isValid) {
            const { orderId, message, resultCode } = verification.data;

            if (resultCode === 0) {
                // TODO: Cập nhật trạng thái đơn hàng trong DB
                // Log success for payment tracking
            } else {
                console.error(`[MoMo IPN] Giao dịch thất bại cho đơn hàng ${orderId}. Lý do: ${message}`);
            }
        } else {
            console.error("[MoMo IPN] Xác thực IPN thất bại - có thể là request giả mạo!");
        }

        // Luôn phải trả về status 204 cho MoMo
        res.status(204).send();
    }
}

module.exports = momoController;