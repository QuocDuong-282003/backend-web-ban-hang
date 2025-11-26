// --- THAY THẾ TOÀN BỘ FILE: backend/src/services/emailService.js ---

const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const path = require('path');

// Tạo transporter cho email (ưu tiên SendGrid, fallback Gmail)
const getTransporter = () => {
    // Nếu có SENDGRID_API_KEY thì dùng SendGrid
    if (process.env.SENDGRID_API_KEY) {
        const transport = require('nodemailer-sendgrid-transport');
        return nodemailer.createTransport(
            transport({
                auth: {
                    api_key: process.env.SENDGRID_API_KEY,
                },
            })
        );
    }
    // Nếu không thì dùng Gmail
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.FROM_EMAIL,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

const transporter = getTransporter();

// Cấu hình Handlebars để dùng template HTML
const handlebarOptions = {
    viewEngine: {
        extName: '.hbs',
        // Dùng path.join và __dirname để xây dựng đường dẫn tuyệt đối, an toàn
        // __dirname là thư mục services, đi ngược ra 1 cấp ('../') để vào thư mục views
        layoutsDir: path.join(__dirname, '../views/emails/layout/'), // Sửa cho đúng cây thư mục của bạn
        defaultLayout: 'default',
    },
    viewPath: path.join(__dirname, '../views/emails/'),
    extName: '.hbs',
};

// Sử dụng biến `hbs` đã được import
transporter.use('compile', hbs(handlebarOptions));

// Hàm gửi email xác nhận đơn hàng
exports.sendOrderConfirmationEmail = async (order, customerEmail) => {
    try {
        // Populate lại items của order để có đủ thông tin
        const detailedOrder = await order.populate('items');

        const mailOptions = {
            from: `"${process.env.SHOP_NAME}" <${process.env.FROM_EMAIL}>`,
            to: customerEmail,
            subject: `[${process.env.SHOP_NAME}] Xác nhận đơn hàng #${detailedOrder.orderCode}`,
            template: 'orderConfirmation',
            context: {
                shopName: process.env.SHOP_NAME,
                orderCode: detailedOrder.orderCode,
                orderDate: new Date(detailedOrder.createdAt).toLocaleDateString('vi-VN'),
                customerName: detailedOrder.shippingInfo.fullName,
                shippingAddress: `${detailedOrder.shippingInfo.address}, ${detailedOrder.shippingInfo.city}`,
                paymentMethod: detailedOrder.paymentInfo.method,
                items: detailedOrder.items.map(item => ({
                    ...item.toObject(),
                    price: item.price.toLocaleString('vi-VN'),
                    itemTotal: (item.price * item.quantity).toLocaleString('vi-VN'),
                })),
                subtotal: detailedOrder.itemsPrice.toLocaleString('vi-VN'),
                shippingFee: detailedOrder.shippingPrice.toLocaleString('vi-VN'),
                total: detailedOrder.totalPrice.toLocaleString('vi-VN'),
                trackingUrl: `${process.env.CLIENT_URL}/order-tracking/${detailedOrder._id}`,
            },
        };

        await transporter.sendMail(mailOptions);

    } catch (error) {
        console.error(`!!! LỖI KHI GỬI EMAIL cho đơn hàng ${order.orderCode} !!!`);
        if (error.response) {
            console.error('Lỗi từ SendGrid:', JSON.stringify(error.response.body, null, 2));
        } else {
            console.error('Lỗi Nodemailer/HBS:', error);
        }
    }
};