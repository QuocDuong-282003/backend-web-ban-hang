const Stat = require('../models/Stat');
const User = require('../models/User');

// exports.increaseLoginCount = async (type) => {
//     const today = new Date();
//     const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

//     const stat = await Stat.findOne({ type, date: dateOnly });
//     if (stat) {
//         stat.count += 1;
//         await stat.save();
//     } else {
//         await Stat.create({ type, date: dateOnly, count: 1 });
//     }
// };
// exports.increaseLoginCount = async (type) => {
//     const today = new Date();
//     const dateOnly = new Date(Date.UTC(
//         today.getUTCFullYear(),
//         today.getUTCMonth(),
//         today.getUTCDate()
//     ));

//     await Stat.updateOne(
//         { type, date: dateOnly },
//         { $inc: { count: 1 } },
//         { upsert: true }
//     );
// };
exports.increaseLoginCount = async (type) => {
    console.log(' Ghi nhận login cho:', type);
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

        console.log(`Đã tăng count cho type=${type} ngày=${dateOnly.toISOString().slice(0, 10)}`);
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
    console.log(dateOnly)
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