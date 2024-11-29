const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Multer Configuration
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function(req, file, cb) {
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Only PDF and Word documents are allowed!'));
        }
        cb(null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Models
const Material = require('./models/material.model');
const Chat = require('./models/chat.model');

// Routes
app.post('/api/materials', upload.single('file'), async (req, res) => {
    try {
        console.log('Received upload request:', req.body);
        console.log('File:', req.file);

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const material = new Material({
            branch: req.body.branch,
            semester: req.body.semester,
            fileName: req.file.filename,
            originalName: req.file.originalname,
            filePath: `/uploads/${req.file.filename}`
        });

        await material.save();
        console.log('Material saved:', material);
        res.status(201).json(material);
    } catch (error) {
        console.error('Upload error:', error);
        res.status(400).json({ message: error.message });
    }
});

// Get materials by branch
app.get('/api/materials/:branch', async (req, res) => {
    try {
        const materials = await Material.find({ branch: req.params.branch });
        res.json(materials);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Upload directory:', path.resolve(__dirname, 'uploads'));
});
