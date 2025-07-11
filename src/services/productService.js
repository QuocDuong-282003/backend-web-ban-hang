
const Product = require('../models/Product');
const Category = require('../models/Category');
const Discount = require('../models/Discount');
const slugify = require('slugify');
const ProductVariant = require('../models/productVariant');

const generateUniqueSlug = async (name, excludeProductId = null) => {
    const baseSlug = slugify(name, { lower: true, strict: true, locale: 'vi' });
    let slug = baseSlug;
    let counter = 0;

    let query = { slug: slug };
    if (excludeProductId) {
        query._id = { $ne: excludeProductId };
    }

    while (await Product.findOne(query)) {
        counter++;
        slug = `${baseSlug}-${counter}`;
        query.slug = slug;
    }
    return slug;
};
exports.createProductWithOptions = async (data) => {
    const { name, description, price, stock, category, brand, images, options } = data;

    //  Tạo sản phẩm cha với đầy đủ thông tin, bao gồm cả ảnh
    const uniqueSlug = await generateUniqueSlug(name);
    const product = new Product({ name, slug: uniqueSlug, description, price, stock, category, brand, images, options });
    const savedProduct = await product.save();

    //  Tạo các biến thể
    const stockPerVariant = options.length > 0 ? Math.floor(stock / options.length) : stock;
    const variantsToCreate = [];

    if (options && options.length > 0) {
        options.forEach(optionText => {
            variantsToCreate.push({
                product: savedProduct._id,
                size: optionText,
                price: price,
                stock: stockPerVariant,
                sku: `${uniqueSlug.toUpperCase()}-${optionText.replace(/\s+/g, '-')}`
            });
        });
    } else {
        variantsToCreate.push({
            product: savedProduct._id, price: price, stock: stock,
            sku: `${uniqueSlug.toUpperCase()}-DEFAULT`
        });
    }

    const savedVariants = await ProductVariant.insertMany(variantsToCreate);
    savedProduct.variants = savedVariants.map(v => v._id);

    // Cập nhật lại tổng tồn kho c và lưu
    const totalStock = savedVariants.reduce((sum, v) => sum + v.stock, 0);
    savedProduct.stock = totalStock;
    await savedProduct.save();

    return savedProduct;
};

exports.updateProductWithOptions = async (productId, updateData) => {
    const { options, images, ...productFields } = updateData;

    console.log('[Service] Dữ liệu nhận được để cập nhật:', { options, productFields });
    if (images) {
        console.log(`[Service] Nhận được ${images.length} ảnh từ controller.`);
    } else {
        console.log('[Service] Không có ảnh mới nào được gửi từ controller.');
    }

    const productToUpdate = await Product.findById(productId);
    if (!productToUpdate) {
        throw new Error('Không tìm thấy sản phẩm để cập nhật');
    }

    Object.assign(productToUpdate, productFields);

    if (images && images.length > 0) {
        console.log('[Service] Đang tiến hành xóa ảnh cũ và thêm ảnh mới...');
        productToUpdate.images = []; // Xóa sạch mảng ảnh cũ.
        images.forEach(imageObject => {
            productToUpdate.images.push(imageObject);
        });
        console.log('[Service] Đã thêm ảnh mới vào document. Chuẩn bị lưu.');
    }

    if (options !== undefined) {

        await ProductVariant.deleteMany({ product: productId });
        const variantsToCreate = [];
        const slug = productToUpdate.slug;
        const stockPerVariant = options.length > 0 ? Math.floor(productToUpdate.stock / options.length) : productToUpdate.stock;

        const imagesForVariant = productToUpdate.images.map(img => ({
            data: img.data,
            contentType: img.contentType
        }));

        if (options.length > 0) {
            options.forEach(optionText => {
                variantsToCreate.push({
                    product: productId,
                    size: optionText,
                    price: productToUpdate.price,
                    stock: stockPerVariant,
                    sku: `${slug.toUpperCase()}-${optionText.replace(/\s+/g, '-')}`,
                    images: imagesForVariant
                });
            });
        } else {
            variantsToCreate.push({
                product: productId,
                price: productToUpdate.price,
                stock: productToUpdate.stock,
                sku: `${slug.toUpperCase()}-DEFAULT`,
                images: imagesForVariant
            });
        }

        const savedVariants = await ProductVariant.insertMany(variantsToCreate);
        productToUpdate.variants = savedVariants.map(v => v._id);
        productToUpdate.stock = savedVariants.reduce((sum, v) => sum + v.stock, 0);
        productToUpdate.options = options;
    }

    if (productToUpdate.isModified('name')) {
        productToUpdate.slug = await generateUniqueSlug(productToUpdate.name, productId);
    }

    const savedProduct = await productToUpdate.save();
    console.log('[Service] Đã lưu sản phẩm thành công!');

    const result = await Product.findById(savedProduct._id).populate('category', 'name').populate('discount');
    return result;
};



exports.getFilterProducts = async (filters) => {
    const { page = 1, limit = 12, sort = 'popular', priceRange, brands, search } = filters;

    let query = {};

    if (priceRange) {
        const [minPrice, maxPrice] = priceRange.split('-').map(Number);
        query.price = { $gte: minPrice, $lte: maxPrice };
    }

    //  LỌC THƯƠNG HIỆU 
    if (brands && brands.length > 0) {

        const brandsArray = Array.isArray(brands) ? brands : brands.split(',');


        query.brand = { $in: brandsArray };
    }

    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }

    let sortOption = {};
    switch (sort) {
        case 'price-asc': sortOption.price = 1; break;
        case 'price-desc': sortOption.price = -1; break;
        case 'newest': sortOption.createdAt = -1; break;
        case 'oldest': sortOption.createdAt = 1; break;
        case 'best-selling': sortOption.sold = -1; break;
        case 'name-asc': sortOption.name = 1; break;
        case 'name-desc': sortOption.name = -1; break;
        default: sortOption = { sold: -1, rating: -1 }; break;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, totalItems] = await Promise.all([
        Product.find(query)
            .populate('discount')
            .populate('variants', 'size color stock sku')
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit))
            .lean(),
        Product.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalItems / parseInt(limit));
    const processedData = processProductsForClient(products);

    return {
        data: processedData,
        pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems
        }
    };
};

const processProductsForClient = (products) => {
    return products.map(product => {
        let finalPrice = product.price;
        let discountPercent = 0;
        if (product.discount && product.discount.isActive) {
            const discount = product.discount;
            const discountAmount = discount.discountType === 'percent' ? product.price * (discount.value / 100) : discount.value;
            finalPrice = Math.max(0, product.price - discountAmount);
            if (product.price > 0) {
                discountPercent = Math.round((discountAmount / product.price) * 100);
            }
        }
        const imageBase64 = (product.images && product.images.length > 0 && product.images[0].data)
            ? `data:${product.images[0].contentType};base64,${product.images[0].data.toString('base64')}` : null;

        return {
            _id: product._id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            price: product.price,
            finalPrice: finalPrice,
            rating: product.rating,
            sold: product.sold,
            discountPercent: discountPercent,
            imageBase64,
            options: product.options,
            variants: product.variants,
        };
    });
};



exports.getAllProducts = async () => {
    const products = await Product.find().populate('category', 'name').populate('discount').populate('variants').lean();
    const productsWithDetails = products.map(product => {
        let finalPrice = product.price;
        let discountInfo = null;
        if (product.discount && product.discount.isActive) {
            const discount = product.discount;
            let discountAmount = discount.discountType === 'percent' ? product.price * (discount.value / 100) : discount.value;
            finalPrice = Math.max(0, product.price - discountAmount);
            discountInfo = {
                code: discount.code, value: discount.value, type: discount.discountType, description: discount.description
            };
        }
        if (product.images && product.images.length > 0 && product.images[0].data) {
            const image = product.images[0];
            const base64Image = image.data.toString('base64');
            product.imageBase64 = `data:${image.contentType};base64,${base64Image}`;
        }
        delete product.images;
        return { ...product, finalPrice, discountInfo, };
    });
    return productsWithDetails;
};

exports.deleteProduct = async (id) => {
    await ProductVariant.deleteMany({ product: id });
    return await Product.findByIdAndDelete(id);
};

exports.assignDiscount = async (productId, discountId) => {
    const product = await Product.findById(productId);
    if (!product) { const error = new Error('Không tìm thấy sản phẩm'); error.statusCode = 404; throw error; }
    if (discountId) {
        const discountExists = await Discount.findById(discountId);
        if (!discountExists) { const error = new Error('Mã giảm giá không tồn tại'); error.statusCode = 404; throw error; }
    }
    product.discount = discountId || null;
    await product.save();
    return { success: true, message: 'Cập nhật mã giảm giá cho sản phẩm thành công.' };
};

exports.getNewestProducts = async (limit = 8) => {
    const products = await Product.find({}).sort({ createdAt: -1 }).limit(limit).populate('discount').lean();
    return processProductsForClient(products);
};

exports.getHotProducts = async (limit = 8) => {
    const products = await Product.find({}).sort({ sold: -1 }).limit(limit).populate('discount').lean();
    return processProductsForClient(products);
};

exports.getPopularProducts = async (limit = 3) => {
    const products = await Product.find({}).sort({ rating: -1, numReviews: -1 }).limit(limit).lean();
    return products.map(p => ({
        _id: p._id, name: p.name, description: p.description,
        imageBase64: (p.images && p.images.length > 0 && p.images[0].data) ? `data:${p.images[0].contentType};base64,${p.images[0].data.toString('base64')}` : null,
    }));
};

exports.getProductById = async (id) => {
    try {
        const product = await Product.findById(id)
            .populate('category', 'name')
            .populate('discount')
            .populate('variants')
            .lean();
        if (!product) { return null; }
        const cleanVariants = (Array.isArray(product.variants))
            ? product.variants.filter(v => v !== null)
            : [];
        let finalPrice = product.price;
        if (product.discount && product.discount.isActive) {
            const discount = product.discount;
            const discountAmount = discount.discountType === 'percent' ? product.price * (discount.value / 100) : discount.value;
            finalPrice = Math.max(0, product.price - discountAmount);
        }
        const imagesBase64 = product.images && product.images.length > 0 ? product.images.map(img => `data:${img.contentType};base64,${img.data.toString('base64')}`) : [];
        return {
            ...product,
            variants: cleanVariants,

            finalPrice,
            images: imagesBase64
        };
    } catch (error) {

        console.error(`[Service] Lỗi khi xử lý getProductById cho ID ${id}:`, error);
        throw error;
    }
};

exports.getRelatedProducts = async (productId) => {
    const currentProduct = await Product.findById(productId).select('category');
    if (!currentProduct || !currentProduct.category) { return []; }
    const products = await Product.find({ category: currentProduct.category, _id: { $ne: productId } }).limit(4).populate('discount').lean();
    return processProductsForClient(products);
};

exports.getFilterOptions = async () => {
    const brands = await Product.distinct('brand');
    brands.sort();
    return { brands };
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


exports.getProductSuggestion = async (query) => {
    const limit = 5;
    let products = [];

    if (!query) {
        // Nếu không có từ khóa, gợi ý các sản phẩm bán chạy nhất
        products = await Product.find({ stock: { $gt: 0 } })
            .sort({ sold: -1 })
            .limit(limit);
    } else {
        // Nếu có từ khóa, tìm các sản phẩm có tên khớp
        const searchRegex = new RegExp(query, 'i');
        products = await Product.find({ name: searchRegex, stock: { $gt: 0 } })
            .sort({ sold: -1 })
            .limit(limit);
    }

    // XỬ LÝ DỮ LIỆU TRƯỚC KHI TRẢ VỀ CHO CLIENT
    const suggestions = products.map(p => {
        let imageSrc = null;
        if (p.images && p.images.length > 0 && p.images[0].data) {
            imageSrc = `data:${p.images[0].contentType};base64,${p.images[0].data.toString('base64')}`;
        }

        return {
            _id: p._id,
            name: p.name,
            image: imageSrc,
            finalPrice: p.finalPrice || p.price || 0
        };
    });

    return suggestions;
};