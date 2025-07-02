
const productService = require('../services/productService');
const multer = require('multer');

exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, stock, category, brand, options } = req.body;


        if (!req.files || !req.files.images || req.files.images.length === 0) {
            return res.status(400).json({ message: 'Vui lòng tải lên ít nhất một ảnh cho sản phẩm (trường "images").' });
        }

        // Chuyển đổi file ảnh sang định dạng để lưu vào DB (Buffer)
        const imageBuffers = req.files.images.map(file => ({
            data: file.buffer,
            contentType: file.mimetype
        }));


        if (req.files.coverImage && req.files.coverImage.length > 0) {
            const coverImage = {
                data: req.files.coverImage[0].buffer,
                contentType: req.files.coverImage[0].mimetype
            };

            imageBuffers.unshift(coverImage);
        }

        const productData = {
            name,
            description,
            price: Number(price),
            stock: Number(stock),
            category,
            brand,
            options: options ? JSON.parse(options) : [],
            images: imageBuffers
        };

        // Gọi service để thực hiện logic tạo sản phẩm
        const newProduct = await productService.createProductWithOptions(productData);

        // Trả về thành công
        res.status(201).json({ message: 'Tạo sản phẩm thành công!', data: newProduct });

    } catch (error) {
        console.error('[Controller] Lỗi khi tạo sản phẩm:', error);
        res.status(500).json({ message: error.message || 'Lỗi server khi tạo sản phẩm.' });
    }
};



// exports.updateProduct = async (req, res) => {
//     try {
//         const productId = req.params.id;
//         const updateData = { ...req.body };

//         if (updateData.price) updateData.price = Number(updateData.price);
//         if (updateData.stock) updateData.stock = Number(updateData.stock);
//         if (updateData.options) updateData.options = JSON.parse(updateData.options);

//         // Chỉ cập nhật ảnh nếu có file mới được tải lên
//         if (req.files && Object.keys(req.files).length > 0) {
//             updateData.images = [];
//             if (req.files.coverImage && req.files.coverImage.length > 0) {
//                 updateData.images.push({
//                     data: req.files.coverImage[0].buffer,
//                     contentType: req.files.coverImage[0].mimetype
//                 });
//             }
//             if (req.files.images && req.files.images.length > 0) {
//                 const otherImages = req.files.images.map(file => ({
//                     data: file.buffer,
//                     contentType: file.mimetype
//                 }));
//                 updateData.images.push(...otherImages);
//             }
//         }

//         const updatedProduct = await productService.updateProductWithOptions(productId, updateData);
//         if (!updatedProduct) {
//             return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
//         }
//         res.status(200).json({ message: 'Cập nhật sản phẩm thành công!', data: updatedProduct });
//     } catch (error) {
//         console.error('[Controller] Lỗi khi cập nhật sản phẩm:', error);
//         res.status(500).json({ message: error.message || 'Lỗi server khi cập nhật sản phẩm.' });
//     }
// };
// --- THAY THẾ HÀM updateProduct TRONG: controllers/productController.js ---

// --- THAY THẾ HÀM updateProduct TRONG: controllers/productController.js ---

exports.updateProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const updateData = { ...req.body };

        console.log('[Controller] Dữ liệu nhận được từ body:', req.body);
        console.log('[Controller] Files nhận được từ multer:', req.files); // Kiểm tra xem có file không

        if (updateData.price) updateData.price = Number(updateData.price);
        if (updateData.stock) updateData.stock = Number(updateData.stock);
        if (updateData.sold) updateData.sold = Number(updateData.sold);
        if (updateData.options) updateData.options = JSON.parse(updateData.options);

        // Xử lý ảnh MỘT CÁCH CẨN THẬN
        if (req.files && Object.keys(req.files).length > 0) {
            const newImages = [];
            // Giả sử middleware của bạn đặt tên file là 'images'
            if (req.files.images) {
                const imageFiles = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
                imageFiles.forEach(file => {
                    newImages.push({ data: file.buffer, contentType: file.mimetype });
                });
            }

            if (newImages.length > 0) {
                updateData.images = newImages;
                console.log(`[Controller] Đã chuẩn bị ${newImages.length} ảnh để cập nhật.`);
            }
        }

        const updatedProduct = await productService.updateProductWithOptions(productId, updateData);

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm để cập nhật' });
        }
        res.status(200).json({ message: 'Cập nhật sản phẩm thành công!', data: updatedProduct });
    } catch (error) {
        console.error('[Controller] Lỗi khi cập nhật sản phẩm:', error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật sản phẩm', error: error.message });
    }
};

exports.getAllProducts = async (req, res) => {
    try {
        const products = await productService.getAllProducts();
        res.status(200).json({ message: 'Lấy danh sách sản phẩm thành công', data: products });
    } catch (error) {
        console.error('[Controller] Lỗi khi lấy tất cả sản phẩm:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách sản phẩm' });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const product = await productService.getProductById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
        res.status(200).json({ message: 'Lấy sản phẩm thành công', data: product });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const deletedProduct = await productService.deleteProduct(req.params.id);
        if (!deletedProduct) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm để xóa' });
        }
        res.status(200).json({ message: 'Xóa sản phẩm thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi xóa sản phẩm' });
    }
};

exports.assignDiscountsToProduct = async (req, res) => {
    try {
        const productId = req.params.id; // Lấy id từ params
        const { discountId } = req.body;
        const result = await productService.assignDiscount(productId, discountId);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || 'Lỗi server' });
    }
};

// === CONTROLLERS CHO CLIENT-SIDE ===
exports.getProductBySlug = async (req, res) => {
    try {
        const product = await productService.generateUniqueSlug(req.params.slug);
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
//
exports.filterProducts = async (req, res) => {
    try {
        const result = await productService.getFilterProducts(req.query);
        res.status(200).json(result);
    } catch (error) {
        console.log("check san pham", error);
        res.status(500).json({ message: 'Loi server khi loc san pham', error: error.message });

    }
}
// 
exports.getFilterOptions = async (req, res) => {
    try {
        const options = await productService.getFilterOptions();
        res.status(200).json(options);
    } catch (error) {
        console.log("check data options", error);
        res.status(500).json({ message: 'Loi server khi loc', error: error.message });

    }
};
