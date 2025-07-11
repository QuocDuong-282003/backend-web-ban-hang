const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const moment = require('moment-timezone');


exports.getOverviewStats = async () => {

    const [
        totalRevenueResult,
        totalOrders,
        totalCancelledOrders,
        totalUsers,
        totalProducts,
    ] = await Promise.all([
        // Tính tổng doanh thu của các đơn hàng đã giao thành công
        Order.aggregate([
            { $match: { status: 'delivered' } },
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


    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].totalRevenue : 0;


    return { totalRevenue, totalOrders, totalCancelledOrders, totalUsers, totalProducts };
};



exports.getSalesStats = async (period = 'day') => {
    let groupByFormat;
    let startDate;
    const endDate = moment().tz('Asia/Ho_Chi_Minh').endOf('day');

    switch (period) {
        case 'month':
            groupByFormat = '%Y-%m'; // Nhóm theo tháng, 

            startDate = moment().tz('Asia/Ho_Chi_Minh').subtract(12, 'months').startOf('month');
            break;
        case 'day':
        default:
            groupByFormat = '%Y-%m-%d'; // Nhóm theo ngày,
            // Giới hạn dữ liệu trong 30 ngày gần nhất
            startDate = moment().tz('Asia/Ho_Chi_Minh').subtract(30, 'days').startOf('day');
            break;
    }

    // Thực hiện truy vấn aggregation
    const salesData = await Order.aggregate([
        // Lọc các đơn hàng trong khoảng thời gian và có trạng thái "đã giao"
        {
            $match: {
                status: 'delivered',
                createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() }
            }
        },
        //  Nhóm theo ngày hoặc tháng
        {
            $group: {
                _id: { $dateToString: { format: groupByFormat, date: '$createdAt', timezone: "Asia/Ho_Chi_Minh" } },
                totalRevenue: { $sum: '$totalPrice' },
                totalOrders: { $sum: 1 }
            }
        },
        // Sắp xếp kết quả theo thời gian tăng dần
        { $sort: { '_id': 1 } }
    ]);


    const labels = salesData.map(item => item._id);

    return {
        labels,
        datasets: [
            {
                type: 'line',
                label: 'Doanh thu (VND)',
                data: salesData.map(item => item.totalRevenue),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                yAxisID: 'y_revenue',
                tension: 0.1
            },
            {
                type: 'bar',
                label: 'Số đơn hàng thành công',
                data: salesData.map(item => item.totalOrders),
                backgroundColor: 'rgba(255, 159, 64, 0.7)',
                yAxisID: 'y_orders',
            }
        ]
    };
};


exports.getOrderStatusStats = async () => {
    const statusData = await Order.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id': 1 } }
    ]);

    const statusLabels = {
        pending: 'Chờ xử lý',
        processing: 'Đang xử lý',
        shipped: 'Đang giao',
        delivered: 'Đã giao',
        cancelled: 'Đã hủy',
        refunded: 'Hoàn tiền'
    };

    return {
        labels: statusData.map(item => statusLabels[item._id] || item._id),
        datasets: [{
            label: 'Số lượng đơn hàng',
            data: statusData.map(item => item.count),
            backgroundColor: [
                '#FFC107',
                '#1E88E5',
                '#00ACC1',
                '#43A047',
                '#F4511E',
                '#8D6E63',
            ],
            hoverOffset: 4
        }]
    };
};