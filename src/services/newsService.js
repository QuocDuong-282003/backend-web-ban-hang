const News = require('../models/News');
const slugify = require('slugify');
const fs = require('fs');
const path = require('path')
// func helper for client/admin
const processNewForClient = (newsItem) => {
    if (!newsItem) return null;
    const newsObject = newsItem;
    if (newsObject.image && newsObject.image.data) {
        newsObject.imageBase64 = `data:${newsObject.image.contentType}; base64,${newsObject.image.data.toString('base64')}`;

    }
    delete newsObject.image;
    return newsObject;
};
exports.createNews = async (data, file) => {
    const { title, excerpt, content, author, status } = data;
    const newsData = { title, excerpt, content, author, status };
    if (file) {
        newsData.image = {
            data: file.buffer,
            contentType: file.mimetype,
        };
    }
    const newArticle = new News(newsData);
    await newArticle.save();
    return newArticle;
};
exports.getAllNewsAdmin = async () => {
    const articles = await News.find({}).sort({ createdAt: -1 }).lean();
    return articles.map(processNewForClient);
}
exports.getNewById = async (id) => {
    const article = await News.findById(id).lean();
    return processNewForClient(article);
}

exports.updateNews = async (id, data, file) => {
    const { title, excerpt, author, content, status } = data;
    const updateData = { title, excerpt, author, content, status };
    if (title) {
        updateData.slug = slugify(title, { lower: true, strict: true, locate: 'vi' });
    }
    if (file) {
        updateData.image = {
            data: file.buffer,
            contentType: file.mimetype,
        };
    }
    return News.findByIdAndUpdate(id, updateData, { new: true });
}
exports.deleteNews = async (id) => {

    const article = await News.findById(id).lean();
    if (!article) {
        return null;
    }

    // xuất và xóa các file ảnh từ content
    const content = article.content || '';
    const imageUrls = content.match(/http[s]?:\/\/[^\s")]+\/uploads\/[^\s")]+/g);

    if (imageUrls && imageUrls.length > 0) {
        imageUrls.forEach(url => {
            try {
                // Chuyển URL thành đường dẫn file trên server
                const urlObject = new URL(url);

                const filePath = path.join(process.cwd(), urlObject.pathname);

                if (fs.existsSync(filePath)) {
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error(`Lỗi khi xóa file content: ${filePath}`, err);
                        }
                    });
                }
            } catch (e) {
                console.error(`URL không hợp lệ, không thể xóa file: ${url}`, e);
            }
        });
    }

    return News.findByIdAndDelete(id);
};

// get all new for client

exports.getAllNews = async (options = {}) => {
    const { page = 1, limit = 10 } = options;
    const query = { status: 'published' };

    const articles = await News.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .select('-content')
        .lean();

    const totalArticles = await News.countDocuments(query);

    return {
        data: articles.map(processNewForClient),
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalArticles / limit),
        totalArticles
    };
};
//
exports.getNewsBySlug = async (slug) => {
    // Hàm này phải lấy tất cả các trường
    const article = await News.findOne({ slug: slug, status: 'published' }).lean();
    return processNewForClient(article);
};