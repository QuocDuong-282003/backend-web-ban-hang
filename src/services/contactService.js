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
// exports.getAllContact = async () => {
//     return await Contact.find().sort({ createdAt: -1 });
// }
exports.getAllContact = async (filters = {}) => {
    const queryCondition = {};
    if (filters.status && filters.status !== 'all') {
        queryCondition.status = filters.status;
    }
    const contacts = await Contact.find(queryCondition).sort({ createdAt: -1 });
    return contacts;
}
exports.updateStatusContact = async (contactId, newStatus) => {
    if (newStatus !== "replied") {
        throw new Error('Hành động không hợp lệ.');
    }
    const contact = await Contact.findById(contactId);
    if (!contact) {
        throw new Error('Không tìm thất liên hệ !');
    }
    contact.status = newStatus;
    const updateContact = await contact.save();
    return updateContact;
}