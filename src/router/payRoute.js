// src/routes/vnpay.route.js

const express = require('express');
const router = express.Router();
const vnpayController = require('../controller/vpnController');

// Route để tạo URL thanh toán
router.post('/create_payment_url', vnpayController.createPaymentUrl);

// Route để VNPay gọi lại (IPN)
router.get('/vnpay_ipn', vnpayController.handleIpn);

module.exports = router;