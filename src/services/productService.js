
const Product = require('../models/Product');
const Category = require('../models/Category');
const Discount = require('../models/Discount');
const ProductVariant = require('../models/productVariant');
const slugify = require('slugify');

// =================================================================
// SECTION: HELPER & TRANSFORMER FUNCTIONS
// =================================================================

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

const transformProductForClient = (product) => {
    if (!product) return null;

    const now = new Date();
    let finalPrice = product.price;
    let discountInfo = null;
    let discountPercent = 0;
    const discount = product.discount;

    if (discount && discount.isActive && now >= new Date(discount.startDate) && now <= new Date(discount.endDate)) {
        const discountAmount = discount.discountType === 'percent'
            ? product.price * (discount.value / 100)
            : discount.value;
        finalPrice = Math.max(0, product.price - discountAmount);
        if (product.price > 0) {
            discountPercent = Math.round((discountAmount / product.price) * 100);
        }
        discountInfo = { code: discount.code, description: discount.description, value: discount.value, type: discount.discountType };
    }

    let totalStock = 0;
    if (Array.isArray(product.variants) && product.variants.length > 0) {
        totalStock = product.variants.reduce((sum, variant) => sum + (variant?.stock || 0), 0);
    } else {
        totalStock = product.stock || 0;
    }

    const imageBase64 = (product.images && product.images.length > 0 && product.images[0]?.data)
        ? `data:${product.images[0].contentType};base64,${product.images[0].data.toString('base64')}`
        : null;

    return {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        finalPrice,
        stock: totalStock,
        category: product.category,
        brand: product.brand,
        options: product.options,
        sold: product.sold,
        rating: product.rating,
        numReviews: product.numReviews,
        variants: product.variants,
        discountInfo,
        discountPercent,
        images: (product.images || []).filter(img => img?.data).map(img => `data:${img.contentType};base64,${img.data.toString('base64')}`),
        imageBase64
    };
};

// =================================================================
// SECTION: EXPORTED ADMIN SERVICES
// =================================================================

exports.getAllProducts = async () => {
    const products = await Product.find({})
        .populate('category', 'name')
        .populate('discount')
        .populate('variants')
        .sort({ createdAt: -1 })
        .lean();
    return products.map(transformProductForClient);
};

exports.createProductWithOptions = async (data) => {
    if (data.brand) {
        data.brand = data.brand.trim().toUpperCase();
    }
    const { name, description, price, stock, category, brand, images, options } = data;
    const uniqueSlug = await generateUniqueSlug(name);
    const product = new Product({
        name,
        slug: uniqueSlug,
        description,
        price,
        stock, category,
        brand,
        images,
        options
    });
    await product.save();

    const stockPerVariant = options.length > 0 ? Math.floor(stock / options.length) : stock;
    const variantsToCreate = (options && options.length > 0)
        ? options.map(opt => ({ product: product._id, size: opt, price, stock: stockPerVariant, sku: `${uniqueSlug.toUpperCase()}-${opt.replace(/\s+/g, '-')}` }))
        : [{ product: product._id, price, stock, sku: `${uniqueSlug.toUpperCase()}-DEFAULT` }];

    const savedVariants = await ProductVariant.insertMany(variantsToCreate);
    product.variants = savedVariants.map(v => v._id);
    product.stock = savedVariants.reduce((sum, v) => sum + v.stock, 0);

    await product.save();
    return product;
};

exports.updateProductWithOptions = async (productId, updateData) => {
    const { options, images, ...productFields } = updateData;
    const productToUpdate = await Product.findById(productId);
    if (productFields.brand) {
        productFields.brand = productFields.brand.trim().toUpperCase();
    }
    if (!productToUpdate) throw new Error('Không tìm thấy sản phẩm để cập nhật');

    Object.assign(productToUpdate, productFields);
    if (images && images.length > 0) {
        productToUpdate.images = images;
    }
    if (options !== undefined) {
        await ProductVariant.deleteMany({ product: productId });
        const slug = productToUpdate.slug;
        const stockPerVariant = options.length > 0 ? Math.floor(productToUpdate.stock / options.length) : productToUpdate.stock;

        const variantsToCreate = (options.length > 0)
            ? options.map(opt => ({ product: productId, size: opt, price: productToUpdate.price, stock: stockPerVariant, sku: `${slug.toUpperCase()}-${opt.replace(/\s+/g, '-')}` }))
            : [{ product: productId, price: productToUpdate.price, stock: productToUpdate.stock, sku: `${slug.toUpperCase()}-DEFAULT` }];

        const savedVariants = await ProductVariant.insertMany(variantsToCreate);
        productToUpdate.variants = savedVariants.map(v => v._id);
        productToUpdate.stock = savedVariants.reduce((sum, v) => sum + v.stock, 0);
        productToUpdate.options = options;
    }
    if (productToUpdate.isModified('name')) {
        productToUpdate.slug = await generateUniqueSlug(productToUpdate.name, productId);
    }

    await productToUpdate.save();
    return Product.findById(productId).populate('category', 'name').populate('discount');
};

exports.deleteProduct = async (id) => {
    await ProductVariant.deleteMany({ product: id });
    return await Product.findByIdAndDelete(id);
};

exports.assignDiscount = async (productId, discountId) => {
    const product = await Product.findById(productId);
    if (!product) throw new Error('Không tìm thấy sản phẩm');
    if (discountId) {
        const discountExists = await Discount.findById(discountId);
        if (!discountExists) throw new Error('Mã giảm giá không tồn tại');
    }
    product.discount = discountId || null;
    await product.save();
    return { success: true, message: 'Cập nhật mã giảm giá cho sản phẩm thành công.' };
};

// SECTION: EXPORTED CLIENT-SIDE SERVICES


exports.getProductById = async (id) => {
    const product = await Product.findById(id)
        .populate('category', 'name')
        .populate('discount')
        .populate('variants') // Đã có
        .lean();
    return transformProductForClient(product);
};

exports.getFilterProducts = async (filters) => {

    const { page = 1, limit = 13, sort = 'popular', priceRange, brands, search } = filters;
    let query = {};
    if (priceRange) {
        const [min, max] = priceRange.split('-').map(Number);
        query.price = { $gte: min, $lte: max };
    }
    // if (brands && brands.length > 0) {
    //     query.brand = { $in: Array.isArray(brands) ? brands : brands.split(',') };
    // }
    if (brands && brands.length > 0) {

        const brandRegex = (Array.isArray(brands) ? brands : brands.split(',')).map(b => new RegExp('^' + b + '$', 'i'));
        query.brand = { $in: brandRegex };
    }
    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }
    let sortOption = {};
    switch (sort) {
        case 'price-asc': sortOption.price = 1; break;
        case 'price-desc': sortOption.price = -1; break;
        case 'newest': sortOption.createdAt = -1; break;
        case 'best-selling': sortOption.sold = -1; break;
        default: sortOption = { sold: -1 }; break;
    }

    const [products, totalItems] = await Promise.all([
        Product.find(query)
            .populate('category', 'name')
            .populate('discount')
            .populate('variants')
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Product.countDocuments(query)
    ]);

    return {
        data: products.map(transformProductForClient),
        pagination: { currentPage: page, totalPages: Math.ceil(totalItems / limit), totalItems }
    };
};




//cách 2 .xem thêm

// const [products, totalItems] = await Promise.all([
//     Product.find(query)
//         .populate('category', 'name')
//         .populate('discount')
//         .populate('variants')
//         .sort(sortOption)
//         .skip((page - 1) * limit)
//         .limit(Number(limit)) // Đảm bảo limit là số
//         .lean(),
//     Product.countDocuments(query)
// ]);

// return {
//     data: products.map(transformProductForClient),
//     pagination: {
//         currentPage: Number(page),
//         totalPages: Math.ceil(totalItems / limit),
//         totalItems,
//         limit: Number(limit)
//     }
// };
// };
exports.getRelatedProducts = async (productId) => {
    const currentProduct = await Product.findById(productId).select('category');
    if (!currentProduct || !currentProduct.category) return [];
    const products = await Product.find({ category: currentProduct.category, _id: { $ne: productId } })
        .limit(4)
        .populate('category', 'name')
        .populate('discount')
        .populate('variants')
        .lean();
    return products.map(transformProductForClient);
};

exports.getNewestProducts = async (limit = 8) => {
    const products = await Product.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('category', 'name')
        .populate('discount')
        .populate('variants')
        .lean();
    return products.map(transformProductForClient);
};

exports.getHotProducts = async (limit = 8) => {
    const products = await Product.find({})
        .sort({ sold: -1 })
        .limit(limit)
        .populate('category', 'name')
        .populate('discount')
        .populate('variants') // SỬA LỖI: THÊM DÒNG NÀY
        .lean();
    return products.map(transformProductForClient);
};

exports.getPopularProducts = async (limit = 3) => {
    const products = await Product.find({})
        .sort({ rating: -1, numReviews: -1 })
        .limit(limit)
        .populate('category', 'name')
        .populate('discount')
        .populate('variants') // SỬA LỖI: THÊM DÒNG NÀY
        .lean();
    return products.map(p => {
        const transformed = transformProductForClient(p);
        return {
            _id: transformed._id,
            name: transformed.name,
            description: transformed.description,
            imageBase64: transformed.imageBase64
        };
    });
};

exports.getProductSuggestion = async (query) => {
    const limit = 5;
    const searchRegex = new RegExp(query, 'i');
    const products = await Product.find({ name: searchRegex, stock: { $gt: 0 } })
        .sort({ sold: -1 })
        .limit(limit)
        .populate('variants')
        .lean();
    return products.map(p => {
        const transformed = transformProductForClient(p);
        return {
            _id: transformed._id,
            name: transformed.name,
            image: transformed.imageBase64,
            finalPrice: transformed.finalPrice
        };
    });
};

exports.getFilterOptions = async () => {

    const rawBrands = await Product.distinct('brand');
    const cleanedAndUniqueBrands = Array.from(new Set(rawBrands.map(b => b.trim())));

    cleanedAndUniqueBrands.sort();

    return { brands: cleanedAndUniqueBrands };
};