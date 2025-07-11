
const moment = require('moment');
const qs = require('qs');
const crypto = require('crypto');
const sortObject = require('../cron/sortObject');

class VnpayService {
    createPaymentUrl(req) {
        process.env.TZ = 'Asia/Ho_Chi_Minh';

        const tmnCode = process.env.VNP_TMNCODE;
        const secretKey = process.env.VNP_HASHSECRET;
        const vnpUrl = process.env.VNP_URL;
        const returnUrl = process.env.VNP_RETURN_URL;

        let date = new Date();
        let createDate = moment(date).format('YYYYMMDDHHmmss');
        let orderId = moment(date).format('DDHHmmss');
        let amount = req.body.amount;
        let orderInfo = req.body.orderDescription || 'Thanh toan don hang';

        let ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || (req.connection.socket ? req.connection.socket.remoteAddress : null);
        if (ipAddr === '::1') {
            ipAddr = '127.0.0.1';
        }

        let vnp_Params = {
            'vnp_Version': '2.1.0',
            'vnp_Command': 'pay',
            'vnp_TmnCode': tmnCode,
            'vnp_Locale': 'vn',
            'vnp_CurrCode': 'VND',
            'vnp_TxnRef': orderId,
            'vnp_OrderInfo': orderInfo,
            'vnp_OrderType': 'other',
            'vnp_Amount': amount * 100,
            'vnp_ReturnUrl': returnUrl,
            'vnp_IpAddr': ipAddr,
            'vnp_CreateDate': createDate,
        };

        vnp_Params = sortObject(vnp_Params);

        let signData = qs.stringify(vnp_Params, { encode: false });

        let hmac = crypto.createHmac("sha512", secretKey);
        let signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");

        vnp_Params['vnp_SecureHash'] = signed;

        const finalUrl = vnpUrl + '?' + qs.stringify(vnp_Params, { encode: false });
        return finalUrl;
    }

    handleIpn(req) {
        let vnp_Params = req.query;
        let secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);
        let secretKey = process.env.VNP_HASHSECRET;
        let signData = qs.stringify(vnp_Params, { encode: false });

        let hmac = crypto.createHmac("sha512", secretKey);
        let signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");

        if (secureHash === signed) {
            return { RspCode: '00', Message: 'success' };
        } else {
            return { RspCode: '97', Message: 'Fail checksum' };
        }
    }
}

module.exports = new VnpayService();