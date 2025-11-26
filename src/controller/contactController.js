const contactService = require('../services/contactService');

exports.submitContactForm = async (req, res) => {
    try {
        const messageData = req.body;
        const newMessageData = await contactService.createContact(messageData);
        res.status(200).json({
            success: true,
            message: 'Gửi tin nhắn liên hệ thành công ! Chúng tôi sẽ phản hồi sớm nhất có thể !',
            data: newMessageData
        });

    } catch (error) {
        res.status(400).json({ success: false, message: error.message || 'Có lỗi xảy ra khi gửi tin ! Vui lòng thử lại ! ' })
    }
}
exports.deleteContact = async (req, res) => {

    // const { id } = req.params;
    try {
        const result = await contactService.deleteContact(req.params.id);
        if (!result) {
            return res.status(404).json({ message: 'Không tìm thấy tin để xóa !' });
        }
        res.json({ message: 'Đã xóa thành công !' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi xóa tin !' });
    }
}
exports.getAllContact = async (req, res) => {
    try {
        const contact = await contactService.getAllContact();
        res.json(contact);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy danh sách " })
    }
}
exports.updateStatusController = async (req, res) => {

    try {
        const contactId = req.params.id;
        const newStatus = req.body.status;
        const updateContact = await contactService.updateStatusContact(contactId, newStatus);
        res.status(200).json({ success: true, message: 'Cập nhật thành công', data: updateContact });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });

    }
}