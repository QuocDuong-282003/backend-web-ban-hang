const categoryService = require('../services/categoryService');

exports.createCategory = async (req, res) => {
    try {
        const category = await categoryService.createCategory(req.body);
        res.status(201).json(category);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await categoryService.getAllCategories();
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getCategoryById = async (req, res) => {
    try {
        const category = await categoryService.getCategoryById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
        res.json(category);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const updated = await categoryService.updateCategory(req.params.id, req.body);
        if (!updated) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const deleted = await categoryService.deleteCategory(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
        res.json({ message: 'Xóa danh mục thành công' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
