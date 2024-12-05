const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const auth = require('./models/auth');
const connectDB = require('./config/db');
const app = express();
app.use(cors());
// Middleware
// app.use(cors({
//    // origin: ['http://localhost:5000', 'https://study-portal-backend.onrender.com'],
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization']
// }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Test route (unprotected)
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is running!' });
});

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

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 25 * 1024 * 1024
    }
});

// Protected Routes
app.post('/api/materials', auth, upload.single('file'), async (req, res) => {
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
            fileType: req.file.mimetype,
            uploadedBy: {
                userId: req.user.userId,
                name: req.user.name,
                role: req.user.role
            },
            uploadDate: new Date()
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

app.get('/api/materials/:branch', auth, async (req, res) => {
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

app.get('/api/download/:branch/:filename', auth, (req, res) => {
    const filePath = path.join(uploadsDir, req.params.branch, req.params.filename);
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ message: 'File not found' });
    }
});

// Auth Routes
app.post('/api/register', async (req, res) => {
    try {
        console.log("hEY THERE");
        
        const { name, email, password, department, role } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        if (role !== 'student' && role !== 'teacher') {
            return res.status(400).json({ message: 'Invalid role' });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user
        const user = new User({
            name,
            email,
            password: hashedPassword,
            department,
            role: role || 'user' // Default role if not provided
        });
        
        await user.save();

        // Generate token for immediate login
        const token = jwt.sign(
            { userId: user._id, name: user.name, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({ 
            message: 'User registered successfully',
            token,
            user: { 
                name: user.name, 
                email: user.email,
                role: user.role 
            }
        });
    } catch (error) {
        console.log(error);
        res.status(400).json({ message: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Generate token
        const token = jwt.sign(
            { 
                userId: user._id, 
                name: user.name, 
                role: user.role,
                email: user.email 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({ 
            token, 
            user: { 
                name: user.name, 
                email: user.email,
                role: user.role 
            } 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Verify token route
app.get('/api/verify-token', auth, (req, res) => {
    res.json({ 
        user: { 
            userId: req.user.userId,
            name: req.user.name,
            role: req.user.role,
            email: req.user.email
        } 
    });
});

const PORT = 5000;
app.listen(PORT, async () => {
   try {
    await connectDB();
    console.log('Connected to MongoDB');
    console.log(`Server running on port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
   }
   catch(err) {
    console.log(err);
    console.log('Error in connecting to MongoDB');
   }
});
