const Stat = require('../models/Stat');
const User = require('../models/User');


exports.increaseLoginCount = async (type) => {
    try {
        const today = new Date();
        // Chuẩn hóa date về đầu ngày UTC (00:00:00)
        const dateOnly = new Date(Date.UTC(
            today.getUTCFullYear(),
            today.getUTCMonth(),
            today.getUTCDate()
        ));

        await Stat.updateOne(
            { type, date: dateOnly },
            { $inc: { count: 1 } },
            { upsert: true }
        );
    } catch (error) {
        console.error('Lỗi khi tăng count login:', error);
    }
};

exports.getLoginByDate = async () => {
    const today = new Date();
    const dateOnly = new Date(Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate()
    ));
    const stats = await Stat.find({ date: dateOnly });
    return stats;
};

exports.getLoginByMonth = async () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const stats = await Stat.find({
        date: { $gte: firstDay, $lte: lastDay }
    });

    return stats;
};
exports.getSummary = async () => {
    const totalLogins = await Stat.aggregate([{ $group: { _id: null, total: { $sum: "$count" } } }]);
    return {
        totalLogins: totalLogins[0]?.total || 0,
        totalVisits: totalLogins[0]?.total || 0, // giả định giống nhau
    };
};