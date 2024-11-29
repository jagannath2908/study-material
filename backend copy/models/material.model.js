const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
    branch: {
        type: String,
        required: true
    },
    semester: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    uploadDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Material', materialSchema); 