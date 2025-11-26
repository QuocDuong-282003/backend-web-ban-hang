const statService = require('../services/statService');

exports.trackLogin = async (req, res) => {
    const { type } = req.body;
    if (!['user', 'admin'].includes(type)) return res.status(400).json({ message: 'Loại không hợp lệ' });
    await statService.increaseLoginCount(type);
    res.json({ message: 'Đã ghi nhận' });
};

exports.getLoginToday = async (req, res) => {
    const data = await statService.getLoginByDate();
    res.json(data);
};

exports.getLoginThisMonth = async (req, res) => {
    const data = await statService.getLoginByMonth();
    res.json(data);
};

exports.getLoginSummary = async (req, res) => {
    const summary = await statService.getSummary();
    res.json(summary);
};
