const Product = require('../models/Product');
const Category = require('../models/Category');
const multer = require('multer');
exports.createProduct = async (data) => {
    console.log(' [Service] Dữ liệu nhận được để tạo sản phẩm.');

    const category = await Category.findById(data.category);
    if (!category) {
        throw new Error('Danh mục không tồn tại');
    }

    // Dữ liệu `data.images` từ controller đã đúng định dạng [{data: Buffer, contentType: String}]
    // Model sẽ lưu nó một cách chính xác.
    const product = await Product.create({
        name: data.name,
        description: data.description,
        price: data.price,
        stock: data.stock,
        category: data.category,
        images: data.images // <-- Sửa ở đây, không còn là base64
    });

    console.log(' [Service] Sản phẩm đã tạo thành công.');
    return product;
};

// --- Các hàm khác giữ nguyên ---
exports.getAllProducts = async () => {
    return await Product.find().populate('category');
};

exports.getProductById = async (id) => {
    return await Product.findById(id).populate({
        path: 'category',
        select: 'name slug -_id'
    });
};

exports.updateProduct = async (id, data) => {
    // Logic cập nhật cũng cần sửa nếu bạn muốn cập nhật ảnh
    return await Product.findByIdAndUpdate(id, data, { new: true });
};
// check trùng tên trong db
exports.isProductNameDuplicate = async (name, excludeProductId) => {
    const nameRegex = new RegExp(`^${name}$`, 'i');// Tạo regex không phân biệt hoa thường
    let query = { name: nameRegex };

    if (excludeProductId !== null && excludeProductId !== undefined) {
        query._id = { $ne: excludeProductId };
    }

    const product = await Product.findOne(query);
    return product !== null;
};



exports.deleteProduct = async (id) => {
    return await Product.findByIdAndDelete(id);
};