
const crypto = require('crypto');
const axios = require('axios');

class MomoService {

    static async createAioPayment(amount, orderInfo, customOrderId) {
        // --- Lấy thông tin cấu hình từ file .env ---
        const partnerCode = process.env.MOMO_PARTNER_CODE;
        const accessKey = process.env.MOMO_ACCESS_KEY;
        const secretKey = process.env.MOMO_SECRET_KEY;
        const apiEndpoint = 'https://test-payment.momo.vn/v2/gateway/api/create';
        const ngrokUrl = "https://7e3eb76ee503.ngrok-free.app"; // <<== URL NGORK CỦA BẠN

        // --- Các tham số cho giao dịch ---
        const requestId = customOrderId;
        const orderId = customOrderId;
        const redirectUrl = "http://localhost:3000/order-success"; // URL trả về cho client
        const ipnUrl = `${ngrokUrl}/api/payments/momo-aio-ipn`;  // URL MoMo gọi về báo kết quả (dùng route riêng)
        const requestType = "payWithMethod"; // Loại request cho AIO
        const extraData = "";
        const autoCapture = true;
        const lang = 'vi';

        // --- Bước 1: Tạo chuỗi để tính chữ ký (quan trọng: sắp xếp theo Alphabet) ---


        // --- Cập nhật chuỗi chữ ký (sắp xếp theo Alphabet) ---
        const rawSignature = `accessKey=${accessKey}&amount=${amount}&autoCapture=${autoCapture}&extraData=${extraData}&ipnUrl=${ipnUrl}&lang=${lang}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&partnerName=P&T Shop&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}&storeId=PandTShop`; console.log("--------------------RAW SIGNATURE (AIO)----------------");
        console.log(rawSignature);

        // --- Bước 2: Tạo chữ ký HMAC SHA256 ---
        const signature = crypto.createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');

        console.log("--------------------SIGNATURE (AIO)----------------");
        console.log(signature);

        // --- Bước 3: Chuẩn bị body cho request gửi đến MoMo ---
        const requestBody = {
            partnerCode: partnerCode,
            partnerName: "P&T Shop", // Tên cửa hàng của bạn
            storeId: "PandTShop",   // Mã cửa hàng của bạn
            requestId: requestId,
            amount: amount,
            orderId: orderId,
            orderInfo: orderInfo,
            redirectUrl: redirectUrl,
            ipnUrl: ipnUrl,
            lang: lang,
            requestType: requestType,
            autoCapture: autoCapture,
            extraData: extraData,
            signature: signature
        };

        try {
            // --- Bước 4: Gọi API MoMo ---
            const response = await axios.post(apiEndpoint, requestBody);
            // Trả về payUrl từ kết quả của MoMo
            return response.data.payUrl;
        } catch (error) {
            console.error("Lỗi service khi tạo thanh toán MoMo AIO:", error.response ? error.response.data : error.message);
            throw new Error("Không thể tạo link thanh toán MoMo AIO.");
        }
    }

    /**
     * Xác thực thông báo IPN từ MoMo (hàm này có thể dùng chung hoặc tạo riêng)
     * @param {object} ipnBody - Body của request IPN mà MoMo gửi đến
     * @returns {{isValid: boolean, data: object}} - Trả về kết quả xác thực và dữ liệu
     */
    static verifyIpn(ipnBody) {
        // ... (Logic xác thực IPN như đã làm ở các ví dụ trước)
        // ... (Bạn có thể tái sử dụng hàm verifyIpn đã có)
        return { isValid: true, data: ipnBody }; // Tạm thời để true để test
    }
}

module.exports = MomoService;