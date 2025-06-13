const cron = require('node-cron');
const Discount = require('../models/Discount');
const deleteExpiredDiscount = async () => {
    try {
        const currentDate = new Date();
        const result = await Discount.deleteMany({
            endDate: { $lt: currentDate }
        });
        if (result.deletedCount > 0) {
            console.log(`Successfully deleted ${result.deletedCount} expired discounts.`);
        } else {
            console.log('No expired discounts to delete.');
        }
    } catch (error) {
        console.error('Error deleting expired discounts:', error);
    }
};
// Thiết lập cron job để chạy vào lúc 00:00 (nửa đêm) mỗi ngày
// Cú pháp: 'phút giờ ngày tháng thứ' -> '0 0 * * *'
const scheduleCleanup = () => {
    cron.schedule('0 0 * * *', deleteExpiredDiscount, {
        scheduled: true,
        timezone: "Asia/Ho_Chi_Minh" // Đặt múi giờ cho Việt Nam
    });
    console.log('Scheduled job for deleting expired discounts at midnight.');
};

module.exports = { scheduleCleanup, deleteExpiredDiscount };

