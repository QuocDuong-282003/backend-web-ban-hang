const productService = require('../services/productService');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Discount = require('../models/Discount');
const multer = require('multer');
// exports.assignDiscountsToProduct = async (req, res) => {
//     try {
//         const productId = req.params.id;
//         const { discountIds } = req.body; // 1. Tên biến phải là `discountIds` để khớp với frontend

//         if (!Array.isArray(discountIds)) { // 2. Kiểm tra `discountIds`
//             return res.status(400).json({ message: 'discountIds phải là một mảng.' });
//         }

//         const result = await productService.assignDiscounts(productId, discountIds); // 3. Truyền `discountIds`
//         res.status(200).json(result);

//     } catch (error) {
//         console.error("Lỗi khi gán mã giảm giá cho sản phẩm:", error);
//         res.status(500).json({ message: error.message || 'Lỗi server khi gán mã giảm giá.' });
//     }
// };


// FIX: Đã sửa lại hàm này để chỉ gán MỘT mã giảm giá cho sản phẩm
exports.assignDiscountsToProduct = async (req, res) => {
    try {
        const productId = req.params.id;

        const { discountId } = req.body;
        if (Array.isArray(discountId)) {
            return res.status(400).json({
                message: 'Dữ liệu không hợp lệ. Chỉ có thể gán một mã giảm giá cho mỗi sản phẩm.'
            });
        }
        const result = await productService.assignDiscount(productId, discountId);
        res.status(200).json(result);

    } catch (error) {
        console.error("Lỗi khi gán mã giảm giá cho sản phẩm:", error);
        res.status(error.statusCode || 500).json({ message: error.message || 'Lỗi server khi gán mã giảm giá.' });
    }
};

exports.createProduct = async (req, res) => {
    try {

        const { name, description, price, stock, category } = req.body;
        const imageFiles = req.files.images;

        console.log(' [Controller] Dữ liệu text:', req.body);
        console.log(' [Controller] Dữ liệu file:', imageFiles);

        if (!name || !description || !price || !stock || !category) {
            return res.status(400).json({ message: ' Vui lòng điền đầy đủ thông tin sản phẩm.' });
        }
        if (!imageFiles || imageFiles.length === 0) {
            return res.status(400).json({ message: ' Sản phẩm phải có ít nhất một ảnh.' });
        }

        // Chuyển đổi các file từ multer sang định dạng lưu trong DB
        const formattedImages = imageFiles.map(file => ({
            data: file.buffer,         // Dữ liệu Buffer của ảnh
            contentType: file.mimetype // Kiểu file, vd: 'image/jpeg'
        }));

        const productData = {
            name,
            description,
            price,
            stock,
            category,
            images: formattedImages
        };

        const product = await productService.createProduct(productData);
        res.status(201).json(product);

    } catch (err) {
        console.error(' [Controller] Lỗi khi tạo sản phẩm:', err);
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: `Lỗi Multer: ${err.message}` });
        }
        res.status(500).json({ message: 'Lỗi server khi tạo sản phẩm', error: err.message });
    }
};
exports.getAllProducts = async (req, res) => {
    try {
        // Toàn bộ logic phức tạp đã được chuyển vào service
        const productsWithDetails = await productService.getAllProducts();
        res.status(200).json(productsWithDetails);
    } catch (err) {
        console.error('[ Controller] Lỗi khi lấy sản phẩm:', err.message);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách sản phẩm' });
    }
};
// Hàm getAllProducts của bạn đã đúng, chỉ cần đảm bảo Model dùng Buffer
// exports.getAllProducts = async (req, res) => {
//     try {
//         const products = await productService.getAllProducts();

//         const productsWithBase64 = products.map((product) => {
//             const productObject = product.toObject();

//             if (productObject.images && productObject.images.length > 0) {
//                 const image = productObject.images[0];
//                 const base64Image = image.data.toString('base64');
//                 productObject.imageBase64 = `data:${image.contentType};base64,${base64Image}`;
//             }

//             delete productObject.images;
//             return productObject;
//         });

//         res.status(200).json(productsWithBase64);
//     } catch (err) {
//         console.error('[ Controller] Lỗi khi lấy sản phẩm:', err.message);
//         res.status(500).json({ message: 'Lỗi server khi lấy danh sách sản phẩm' });
//     }
// };

// exports.getAllProducts = async (req, res) => {
//     try {
//         const products = await productService.getAllProducts();

//         // Lấy danh sách ID của tất cả sản phẩm
//         const productIds = products.map(p => p._id);

//         // Tìm tất cả các mã giảm giá đang được áp dụng cho các sản phẩm này
//         const relevantDiscounts = await Discount.find({ appliesTo: { $in: productIds } }).select('code appliesTo');

//         // Tạo một map để tra cứu nhanh: productId -> [mã code, mã code]
//         const productDiscountMap = {};
//         relevantDiscounts.forEach(discount => {
//             discount.appliesTo.forEach(pid => {
//                 const productIdStr = pid.toString();
//                 if (!productDiscountMap[productIdStr]) {
//                     productDiscountMap[productIdStr] = [];
//                 }
//                 productDiscountMap[productIdStr].push(discount.code);
//             });
//         });

//         const productsWithDetails = products.map((product) => {
//             const productObject = product.toObject();

//             // Xử lý ảnh
//             if (productObject.images && productObject.images.length > 0) {
//                 const image = productObject.images[0];
//                 const base64Image = image.data.toString('base64');
//                 productObject.imageBase64 = `data:${image.contentType};base64,${base64Image}`;
//             }
//             delete productObject.images;

//             // Gán thông tin mã giảm giá vào sản phẩm
//             productObject.appliedDiscounts = productDiscountMap[productObject._id.toString()] || [];

//             return productObject;
//         });

//         res.status(200).json(productsWithDetails);
//     } catch (err) {
//         console.error('[ Controller] Lỗi khi lấy sản phẩm:', err.message);
//         res.status(500).json({ message: 'Lỗi server khi lấy danh sách sản phẩm' });
//     }
// };
exports.getProductById = async (req, res) => {
    try {
        const product = await productService.getProductById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// exports.updateProduct = async (req, res) => {
//     try {
//         const updated = await productService.updateProduct(req.params.id, req.body);
//         if (!updated) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
//         res.json(updated);
//     } catch (err) {
//         res.status(400).json({ message: err.message });
//     }
// };
exports.updateProduct = async (req, res) => {
    try {
        const productId = req.params.id;

        const updateData = req.body;

        const files = req.files;

        //  Kiểm tra trùng tên
        if (updateData.name) {
            // hàm isProductNameDuplicate trong service
            const isDuplicate = await productService.isProductNameDuplicate(updateData.name.trim(), productId);
            if (isDuplicate) {
                return res.status(409).json({ message: `Tên sản phẩm "${updateData.name.trim()}" đã tồn tại.` });
            }
            updateData.name = updateData.name.trim();
        }
        //  Xử lý ảnh mới nếu có
        if (files && files.images && files.images.length > 0) {
            updateData.images = files.images.map(file => ({
                data: file.buffer,
                contentType: file.mimetype
            }));
        }
        // Gọi service để cập nhật vào DB
        const updatedProduct = await productService.updateProduct(productId, updateData);
        if (!updatedProduct) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm để cập nhật' });
        }
        res.status(200).json(updatedProduct);

    } catch (err) {
        // Bắt lỗi từ multer
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: `Lỗi Multer: ${err.message}` });
        }
        console.error(' [Controller] Lỗi khi cập nhật sản phẩm:', err);
        res.status(500).json({ message: 'Lỗi server khi cập nhật sản phẩm', error: err.message });
    }
};
exports.deleteProduct = async (req, res) => {
    try {
        const deleted = await productService.deleteProduct(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        res.json({ message: 'Xóa thành công' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};