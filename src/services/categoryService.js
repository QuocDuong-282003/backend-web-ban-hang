const Category = require('../models/Category');
const slugify = require('slugify'); // để tạo slug từ name

exports.createCategory = async (data) => {
    if (!data.name || !data.description) {
        throw new Error('Thiếu tên hoặc mô tả danh mục.');
    }

    const slug = slugify(data.name, { lower: true });

    const existing = await Category.findOne({ slug });
    if (existing) {
        throw new Error('Danh mục đã tồn tại.');
    }

    const category = await Category.create({
        name: data.name,
        description: data.description,
        slug,
        status: data.status || 'Active'
    });

    return category;
};
exports.getAllCategories = async () => {
    // return await Category.find();
    return await Category.find().sort({ createAt: -1 });
};

exports.getCategoryById = async (id) => {
    return await Category.findById(id);
};

exports.updateCategory = async (id, data) => {
    if (data.name) {
        data.slug = slugify(data.name, { lower: true });
    }
    return await Category.findByIdAndUpdate(id, data, { new: true });
};

exports.deleteCategory = async (id) => {
    return await Category.findByIdAndDelete(id);
};
