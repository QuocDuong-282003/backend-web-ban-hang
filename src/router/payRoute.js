// src/routes/vnpay.route.js

const express = require('express');
const router = express.Router();
const vnpayController = require('../controller/vpnController');
const momoController = require('../controller/momoController');

// Route để tạo URL thanh toán
router.post('/create_payment_url', vnpayController.createPaymentUrl);

// Route để VNPay gọi lại (IPN)
router.get('/vnpay_ipn', vnpayController.handleIpn);
//momo
router.post('/momo/create-aio', momoController.createAioPayment);

// Route để MoMo gọi về -> xử lý IPN cho AIO
router.post('/momo-aio-ipn', momoController.handleAioIpn);

module.exports = router;