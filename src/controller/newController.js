const newsService = require('../services/newsService');
exports.createNews = async (req, res) => {
    try {
        const article = await newsService.createNews(req.body, req.file);
        console.log('check data new', article);
        res.status(201).json({ message: 'Tao bai viet thanh cong', data: article });
    } catch (error) {
        res.status(400).json({ message: 'Tao bai viet that bai', error: error.message });


    }
};
exports.getNewById = async (req, res) => {
    try {
        const article = await newsService.getNewById(req.params.id);
        if (!article)
            res.status(404).json({ message: 'Khong tim thay bai viets' });
        res.status(200).json(article);
    } catch (error) {
        res.status(500).json({ message: 'Loi server', error: error.message });
    }
}
exports.updateNews = async (req, res) => {
    try {
        const article = await newsService.updateNews(req.params.id, req.body, req.file);
        if (!article) return res.status(404).json({ message: 'Khong tim thay bai viet' });
        res.status(200).json({ message: 'Cap nhat thanh cong !', data: article });

    } catch (error) {
        res.status(400).json({ message: 'Cap nhat that bai', error: error.message });
    }
};
exports.deleteNews = async (req, res) => {
    try {
        const article = await newsService.deleteNews(req.params.id);
        if (!article) return res.status(404).json({ message: 'Khong tim thay bai viet' });
        res.status(200).json({ message: 'xoa thanh cong' });
    } catch (error) {
        res.status(500).json({ message: 'Loi server', error: error.message });
    }
}
exports.getAllNewsAdmin = async (req, res) => {
    try {
        const articles = await newsService.getAllNewsAdmin();
        res.status(200).json(articles);
    } catch (error) {
        res.status(500).json({ message: 'Loi server', error: error.message });
    }
};
// client
exports.getAllNews = async (req, res) => {
    try {
        const articles = await newsService.getAllNews(req.query);
        res.status(200).json(articles);
    } catch (error) {
        res.status(500).json({ message: 'Loi server', error: error.message });

    }
}
exports.getNewsBySlug = async (req, res) => {
    try {
        const article = await newsService.getNewsBySlug(req.params.slug);
        if (!article) return res.status(404).json({ message: "khong tim thay bai viet" });
        res.status(200).json(article);
    } catch (error) {
        res.status(500).json({ message: 'Loi server', error: error.message });
    }
}