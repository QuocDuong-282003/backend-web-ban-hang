const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const moment = require('moment-timezone'); // Dùng moment để xử lý ngày tháng dễ dàng và chính xác hơn

/**
 * API 1: Lấy các chỉ số tổng quan (Overview Cards)
 * Mục đích: Hiển thị các con số quan trọng trên đầu trang dashboard.
 */
exports.getOverviewStats = async () => {
    // Thực thi các truy vấn không phụ thuộc nhau một cách song song để tăng tốc độ
    const [
        totalRevenueResult,
        totalOrders, // FIX: Sửa tên biến thành số nhiều cho nhất quán
        totalCancelledOrders,
        totalUsers,
        totalProducts,
    ] = await Promise.all([
        // Tính tổng doanh thu của các đơn hàng đã giao thành công
        Order.aggregate([
            { $match: { status: 'delivered' } }, // FIX: Sửa $math thành $match
            { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } }
        ]),
        // Đếm tổng số đơn hàng đã được tạo
        Order.countDocuments(),
        // Đếm số đơn hàng đã bị hủy
        Order.countDocuments({ status: 'cancelled' }),
        // Đếm tổng số người dùng
        User.countDocuments(),
        // Đếm tổng số sản phẩm
        Product.countDocuments()
    ]);

    // Lấy kết quả từ aggregate, nếu không có đơn nào thì trả về 0
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].totalRevenue : 0;

    // FIX: Đảm bảo các biến trả về khớp với các biến đã tính toán
    return { totalRevenue, totalOrders, totalCancelledOrders, totalUsers, totalProducts };
};


/**
 * API 2: Lấy thống kê doanh thu và số lượng đơn hàng theo chu kỳ
 * Mục đích: Cung cấp dữ liệu cho biểu đồ kết hợp Line & Bar.
 */
exports.getSalesStats = async (period = 'day') => {
    let groupByFormat;
    let startDate;
    const endDate = moment().tz('Asia/Ho_Chi_Minh').endOf('day');

    switch (period) {
        case 'month':
            groupByFormat = '%Y-%m'; // Nhóm theo tháng, ví dụ: "2024-07"
            // IMPROVEMENT: Giới hạn dữ liệu trong 12 tháng gần nhất để tối ưu hiệu năng
            startDate = moment().tz('Asia/Ho_Chi_Minh').subtract(12, 'months').startOf('month');
            break;
        case 'day':
        default:
            groupByFormat = '%Y-%m-%d'; // Nhóm theo ngày, ví dụ: "2024-07-28"
            // Giới hạn dữ liệu trong 30 ngày gần nhất
            startDate = moment().tz('Asia/Ho_Chi_Minh').subtract(30, 'days').startOf('day');
            break;
    }

    // Thực hiện truy vấn aggregation
    const salesData = await Order.aggregate([
        // Bước 1: Lọc các đơn hàng trong khoảng thời gian và có trạng thái "đã giao"
        {
            $match: {
                status: 'delivered',
                createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() }
            }
        },
        // Bước 2: Nhóm theo ngày hoặc tháng
        {
            $group: {
                _id: { $dateToString: { format: groupByFormat, date: '$createdAt', timezone: "Asia/Ho_Chi_Minh" } },
                totalRevenue: { $sum: '$totalPrice' },
                totalOrders: { $sum: 1 }
            }
        },
        // Bước 3: Sắp xếp kết quả theo thời gian tăng dần
        { $sort: { '_id': 1 } }
    ]);

    // IMPROVEMENT: Cấu trúc dữ liệu trả về để hỗ trợ biểu đồ kết hợp (Line + Bar)
    const labels = salesData.map(item => item._id);

    return {
        labels,
        datasets: [
            {
                type: 'line', // <-- Định nghĩa loại biểu đồ là Line
                label: 'Doanh thu (VND)',
                data: salesData.map(item => item.totalRevenue),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                yAxisID: 'y_revenue', // Gán vào trục Y bên trái
                tension: 0.1 // Làm cho đường line mềm mại hơn
            },
            {
                type: 'bar', // <-- Định nghĩa loại biểu đồ là Bar
                label: 'Số đơn hàng thành công',
                data: salesData.map(item => item.totalOrders),
                backgroundColor: 'rgba(255, 159, 64, 0.7)',
                yAxisID: 'y_orders', // Gán vào trục Y bên phải
            }
        ]
    };
};

/**
 * API 3: Lấy thống kê tỷ lệ các trạng thái đơn hàng
 * Mục đích: Cung cấp dữ liệu cho biểu đồ tròn (Doughnut/Pie).
 * NOTE: Code này đã rất tốt, giữ nguyên.
 */
exports.getOrderStatusStats = async () => {
    const statusData = await Order.aggregate([
        {
            $group: {
                _id: '$status', // Nhóm các đơn hàng theo trường 'status'
                count: { $sum: 1 } // Đếm số lượng trong mỗi nhóm
            }
        },
        { $sort: { '_id': 1 } }
    ]);

    // Ánh xạ key từ DB sang nhãn Tiếng Việt để hiển thị đẹp hơn
    const statusLabels = {
        pending: 'Chờ xử lý',
        processing: 'Đang xử lý',
        shipped: 'Đang giao',
        delivered: 'Đã giao',
        cancelled: 'Đã hủy',
        refunded: 'Hoàn tiền'
    };

    return {
        labels: statusData.map(item => statusLabels[item._id] || item._id), // Nếu có trạng thái mới chưa dịch, vẫn hiển thị key gốc
        datasets: [{
            label: 'Số lượng đơn hàng',
            data: statusData.map(item => item.count),
            backgroundColor: [
                '#FFC107', // pending - Vàng
                '#1E88E5', // processing - Xanh dương
                '#00ACC1', // shipped - Xanh ngọc
                '#43A047', // delivered - Xanh lá
                '#F4511E', // cancelled - Đỏ cam
                '#8D6E63', // refunded - Nâu
            ],
            hoverOffset: 4
        }]
    };
};