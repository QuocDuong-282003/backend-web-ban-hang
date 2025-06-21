// --- TẠO FILE MỚI: controllers/dashboardController.js ---

const dashboardService = require('../services/dashboardService');

exports.getOverviewStats = async (req, res) => {
    try {
        const stats = await dashboardService.getOverviewStats();
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
};

exports.getSalesStats = async (req, res) => {
    try {
        const { period } = req.query;
        const stats = await dashboardService.getSalesStats(period);
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
};

exports.getOrderStatusStats = async (req, res) => {
    try {
        const stats = await dashboardService.getOrderStatusStats();
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
};