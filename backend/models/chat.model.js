const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true
    },
    isUser: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Chat', chatSchema);
