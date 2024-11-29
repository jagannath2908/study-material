const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Configuration
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const tempDir = path.join(uploadsDir, 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

// Updated multer configuration to accept all file types
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 25 * 1024 * 1024 // Increased to 25MB limit
    }
});

// Routes
app.post('/api/materials', upload.single('file'), async (req, res) => {
    try {
        console.log('Received upload request:', req.body);
        console.log('File:', req.file);

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Create branch directory
        const branchDir = path.join(uploadsDir, req.body.branch);
        if (!fs.existsSync(branchDir)) {
            fs.mkdirSync(branchDir, { recursive: true });
        }

        // Move file from temp to branch directory
        const oldPath = req.file.path;
        const newPath = path.join(branchDir, req.file.filename);
        
        // Use fs.rename to move the file
        fs.renameSync(oldPath, newPath);
        console.log('File moved from', oldPath, 'to', newPath);

        // Update file information
        const material = {
            branch: req.body.branch,
            semester: req.body.semester,
            fileName: req.file.filename,
            originalName: req.file.originalname,
            filePath: `/uploads/${req.body.branch}/${req.file.filename}`,
            fileType: req.file.mimetype // Added file type information
        };

        // Save to materials.json
        const materialsFile = path.join(__dirname, 'materials.json');
        let materials = [];
        if (fs.existsSync(materialsFile)) {
            materials = JSON.parse(fs.readFileSync(materialsFile));
        }
        materials.push({ ...material, uploadDate: new Date() });
        fs.writeFileSync(materialsFile, JSON.stringify(materials, null, 2));

        console.log('Material saved:', material);
        res.status(201).json(material);
    } catch (error) {
        console.error('Upload error:', error);
        // If there's an error, try to clean up the temp file
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(400).json({ message: error.message });
    }
});

// Get materials by branch
app.get('/api/materials/:branch', async (req, res) => {
    try {
        const materialsFile = path.join(__dirname, 'materials.json');
        if (!fs.existsSync(materialsFile)) {
            return res.json([]);
        }

        const materials = JSON.parse(fs.readFileSync(materialsFile));
        const branchMaterials = materials.filter(m => m.branch === req.params.branch);
        res.json(branchMaterials);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Download route
app.get('/api/download/:branch/:filename', (req, res) => {
    const filePath = path.join(uploadsDir, req.params.branch, req.params.filename);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ message: 'File not found' });
    }
});

const PORT = 5000
app.listen(PORT, (req,res) => {
   try{
    console.log("*** res ***" , res)
    console.log(`Server running on port ${PORT}`);
   }
   catch(err){
    console.log(err);
   }
});
