const Product = require('../models/Product');
const Category = require('../models/Category');
const Discount = require('../models/Discount');
const multer = require('multer');
exports.createProduct = async (data) => {
    console.log(' [Service] Dữ liệu nhận được để tạo sản phẩm.');
    const category = await Category.findById(data.category);
    if (!category) {
        throw new Error('Danh mục không tồn tại');
    }

    const product = await Product.create({
        name: data.name,
        description: data.description,
        price: data.price,
        stock: data.stock,
        category: data.category,
        images: data.images
    });
    console.log(' [Service] Sản phẩm đã tạo thành công.');
    return product;
};
exports.getAllProducts = async () => {
    //  Lấy sản phẩm,  lấy luôn thông tin category và discount 
    const products = await Product.find()
        .populate('category', 'name')
        .populate('discount')
        .lean(); //  .lean()  tăng tốc độ truy vấn

    // Xử lý dữ liệu trả về cho client
    const productsWithDetails = products.map(product => {
        let finalPrice = product.price;
        let discountInfo = null;

        // Nếu sản phẩm có mã giảm giá (product.discount không phải là null)
        if (product.discount && product.discount.isActive) {
            const discount = product.discount;
            let discountAmount = 0;
            if (discount.discountType === 'percent') {
                discountAmount = product.price * (discount.value / 100);
            } else { // 'fixed'
                discountAmount = discount.value;
            }

            finalPrice = product.price - discountAmount;
            finalPrice = finalPrice < 0 ? 0 : finalPrice; // Đảm bảo giá không bị âm

            discountInfo = {
                code: discount.code,
                value: discount.value,
                type: discount.discountType,
                description: discount.description
            };
        }

        // Xử lý ảnh base64
        if (product.images && product.images.length > 0 && product.images[0].data) {
            const image = product.images[0];
            const base64Image = image.data.toString('base64');
            product.imageBase64 = `data:${image.contentType};base64,${base64Image}`;
        }
        delete product.images; // Xóa field nặng nề không cần thiết

        return {
            ...product, // Giữ lại tất cả các trường của product
            finalPrice,
            discountInfo,
        };
    });

    return productsWithDetails;
};
exports.assignDiscount = async (productId, discountId) => {
    const product = await Product.findById(productId);
    if (!product) {
        const error = new Error('Không tìm thấy sản phẩm');
        error.statusCode = 404;
        throw error;
    }

    // Nếu có discountId, kiểm tra xem nó có tồn tại không
    if (discountId) {
        const discountExists = await Discount.findById(discountId);
        if (!discountExists) {
            const error = new Error('Mã giảm giá không tồn tại');
            error.statusCode = 404;
            throw error;
        }
    }


    product.discount = discountId || null;
    await product.save();

    return { success: true, message: 'Cập nhật mã giảm giá cho sản phẩm thành công.' };
};

// exports.getAllProducts = async () => {


//     // . Lấy tất cả sản phẩm và tất cả mã giảm giá
//     const [products, allDiscounts] = await Promise.all([
//         Product.find().populate('category').lean(),
//         // Lấy đầy đủ thông tin của discount để tính toán
//         Discount.find({ isActive: true }).lean()
//     ]);
//     const productDiscountMap = new Map();
//     allDiscounts.forEach(discount => {
//         if (discount.appliesTo && discount.appliesTo.length > 0) {
//             discount.appliesTo.forEach(pid => {
//                 const productIdStr = pid.toString();
//                 if (!productDiscountMap.has(productIdStr)) {
//                     productDiscountMap.set(productIdStr, []);
//                 }
//                 productDiscountMap.get(productIdStr).push(discount.code);
//             });
//         }
//     });
//     // Xử lý và gán dữ liệu vào từng sản phẩm
//     const productsWithDetails = products.map(product => {
//         let finalPrice = product.price;
//         let discountInfo = null;
//         let maxDiscountAmount = -1;
//         // Tìm các mã giảm giá áp dụng cho sản phẩm này từ danh sách đã lấy
//         const applicableDiscounts = allDiscounts.filter(d =>
//             d.appliesTo.some(pid => pid.equals(product._id))
//         );
//         // Tìm ra mã giảm giá tốt nhất
//         if (applicableDiscounts.length > 0) {
//             applicableDiscounts.forEach(discount => {
//                 let currentDiscountAmount = 0;
//                 if (discount.discountType === 'percent') {
//                     currentDiscountAmount = product.price * (discount.value / 100);
//                 } else { // 'fixed_amount'
//                     currentDiscountAmount = discount.value;
//                 }

//                 if (currentDiscountAmount > maxDiscountAmount) {
//                     maxDiscountAmount = currentDiscountAmount;
//                     discountInfo = { // Lưu thông tin của mã tốt nhất
//                         code: discount.code,
//                         value: discount.value,
//                         type: discount.discountType
//                     };
//                 }
//             });
//         }

//         // Nếu tìm thấy giảm giá, tính lại giá cuối cùng
//         if (maxDiscountAmount > 0) {
//             finalPrice = product.price - maxDiscountAmount;
//             finalPrice = finalPrice < 0 ? 0 : finalPrice;
//         }
//         // Xử lý ảnh base64 
//         if (product.images && product.images.length > 0 && product.images[0].data) {
//             const image = product.images[0];
//             const base64Image = image.data.toString('base64');
//             product.imageBase64 = `data:${image.contentType};base64,${base64Image}`;
//         }
//         delete product.images;

//         // Gán thông tin mã giảm giá đã được tra cứu từ map 
//         product.appliedDiscounts = productDiscountMap.get(product._id.toString()) || [];


//         product.finalPrice = finalPrice;
//         product.discountInfo = discountInfo;


//         return product;
//     });

//     return productsWithDetails;
// };

// 
// exports.assignDiscounts = async (productId, discountIds) => {
//     const product = await Product.findById(productId);
//     if (!product) {
//         throw new Error('Không tìm thấy sản phẩm');
//     }

//     await Discount.updateMany(
//         { appliesTo: productId },
//         { $pull: { appliesTo: productId } }
//     );

//     if (discountIds && discountIds.length > 0) {
//         await Discount.updateMany(
//             { _id: { $in: discountIds } },
//             { $addToSet: { appliesTo: productId } }
//         );
//     }

//     return { success: true, message: 'Cập nhật mã giảm giá cho sản phẩm thành công.' };
// };
exports.getProductById = async (id) => {
    return await Product.findById(id).populate({
        path: 'category',
        select: 'name slug -_id'
    });
};

exports.updateProduct = async (id, data) => {

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
// add discount
// exports.assignDiscounts = async (productId, discountIds) => {
//     const product = await Product.findById(productId);
//     if (!product) {
//         throw new Error('Khong tim thay san pham');
//     }
//     await Discount.updateMany({ appliesTo: productId },
//         { $pull: { appliesTo: productId } }
//     );

//     if (discountIds && discountIds.length > 0) {
//         await Discount.updateMany(
//             { _id: { $in: discountIds } },
//             { $addToSet: { appliesTo: productId } }
//         );
//     }

//     return { success: true, message: 'Cập nhật mã giảm giá cho sản phẩm thành công.' };
// }