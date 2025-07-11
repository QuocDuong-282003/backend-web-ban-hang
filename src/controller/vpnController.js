
const vnpayService = require('../services/vpnService');

class VnpayController {

    async createPaymentUrl(req, res, next) {
        try {
            const paymentUrl = vnpayService.createPaymentUrl(req);
            res.json({ code: '00', message: 'Success', url: paymentUrl });
        } catch (error) {
            console.error('Error creating payment URL:', error);
            res.status(500).json({ code: '99', message: 'Unknown error' });
        }
    }

    async handleIpn(req, res, next) {
        try {
            const result = vnpayService.handleIpn(req);
            res.status(200).json(result);
        } catch (error) {
            console.error('Error handling IPN:', error);
            res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
        }
    }
}

module.exports = new VnpayController();