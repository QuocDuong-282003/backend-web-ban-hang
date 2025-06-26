// --- THAY THẾ TOÀN BỘ FILE: controllers/productController.js ---

const productService = require('../services/productService');
const multer = require('multer');

// === CONTROLLERS CHO CRUD SẢN PHẨM (ADMIN) ===
exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, stock, category, options } = req.body;
        const imageFiles = req.files.images;
        if (!name || !description || !price || !stock || !category || !imageFiles || imageFiles.length === 0) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin sản phẩm và ảnh.' });
        }
        let parsedOptions = options ? JSON.parse(options) : [];
        const formattedImages = imageFiles.map(file => ({ data: file.buffer, contentType: file.mimetype }));
        const productData = { name, description, price, stock, category, images: formattedImages, options: parsedOptions };
        const product = await productService.createProduct(productData);
        res.status(201).json(product);
    } catch (err) {
        if (err instanceof multer.MulterError) return res.status(400).json({ message: `Lỗi Multer: ${err.message}` });
        console.error(' [Controller] Lỗi khi tạo sản phẩm:', err);
        res.status(500).json({ message: 'Lỗi server khi tạo sản phẩm', error: err.message });
    }
};
exports.getProductById = async (req, res) => {
    try {
        // Gọi thẳng đến service, nhưng hàm này trong service không xử lý ảnh và giá giảm
        // Chúng ta có thể tạo một hàm service riêng cho nó nếu cần, nhưng hiện tại findById là đủ
        const product = await productService.getProductById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
        res.status(200).json(product);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const updateData = req.body;
        const files = req.files;
        if (updateData.options) updateData.options = JSON.parse(updateData.options);
        if (updateData.name) {
            const isDuplicate = await productService.isProductNameDuplicate(updateData.name.trim(), productId);
            if (isDuplicate) return res.status(409).json({ message: `Tên sản phẩm "${updateData.name.trim()}" đã tồn tại.` });
            updateData.name = updateData.name.trim();
        }
        if (files && files.images && files.images.length > 0) {
            updateData.images = files.images.map(file => ({ data: file.buffer, contentType: file.mimetype }));
        }
        const updatedProduct = await productService.updateProduct(productId, updateData);
        if (!updatedProduct) return res.status(404).json({ message: 'Không tìm thấy sản phẩm để cập nhật' });
        res.status(200).json(updatedProduct);
    } catch (err) {
        if (err instanceof multer.MulterError) return res.status(400).json({ message: `Lỗi Multer: ${err.message}` });
        console.error(' [Controller] Lỗi khi cập nhật sản phẩm:', err);
        res.status(500).json({ message: 'Lỗi server khi cập nhật sản phẩm', error: err.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const deleted = await productService.deleteProduct(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        res.json({ message: 'Xóa thành công' });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getAllProducts = async (req, res) => {
    try {
        const productsWithDetails = await productService.getAllProducts();
        res.status(200).json(productsWithDetails);
    } catch (err) {
        console.error('[Controller] Lỗi khi lấy danh sách sản phẩm cho admin:', err.message);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách sản phẩm' });
    }
};

exports.assignDiscountsToProduct = async (req, res) => {
    try {
        const { discountId } = req.body;
        const result = await productService.assignDiscount(req.params.id, discountId);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || 'Lỗi server khi gán mã giảm giá.' });
    }
};

// === CONTROLLERS CHO CLIENT-SIDE ===
exports.getProductBySlug = async (req, res) => {
    try {
        const product = await productService.getProductBySlug(req.params.slug);
        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        res.status(200).json(product);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getRelatedProducts = async (req, res) => {
    try {
        const products = await productService.getRelatedProducts(req.params.id);
        res.status(200).json(products);
    } catch (error) { res.status(500).json({ message: "Lỗi khi lấy sản phẩm liên quan", error: error.message }); }
};

exports.getNewestProducts = async (req, res) => {
    try {
        const products = await productService.getNewestProducts();
        res.status(200).json(products);
    } catch (error) { res.status(500).json({ message: "Lỗi khi lấy sản phẩm mới", error: error.message }); }
};

exports.getHotProducts = async (req, res) => {
    try {
        const products = await productService.getHotProducts();
        res.status(200).json(products);
    } catch (error) { res.status(500).json({ message: "Lỗi khi lấy sản phẩm hot", error: error.message }); }
};

exports.getPopularProducts = async (req, res) => {
    try {
        const products = await productService.getPopularProducts();
        res.status(200).json(products);
    } catch (error) { res.status(500).json({ message: "Lỗi khi lấy sản phẩm phổ biến", error: error.message }); }
};