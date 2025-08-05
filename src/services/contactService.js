const Contact = require('../models/Contact');

exports.createContact = async (data) => {
    const { name, email, phone, content } = data;
    if (!name || !email || !phone || !content) {
        throw new Error('Vui lòng nhập đầy đủ thông tin !');
    }
    const newMessage = new Contact({
        name, phone, email, content
    });
    await newMessage.save();
    return newMessage;
}
exports.deleteContact = async (id) => {
    const deleteContact = await Contact.findByIdAndDelete(id);
    if (!deleteContact) {
        throw new Error('Không tìm thấy thư để xóa !');

    }
    return true;
}
exports.getAllContact = async () => {
    return await Contact.find().sort({ createdAt: -1 });
}