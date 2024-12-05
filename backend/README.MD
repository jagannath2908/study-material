# Study Material Portal - Development Guide

## Project Setup
### 0. Prerequisites
- Node.js and npm installed

Change the directory to backend
```bash
cd backend
OR
open integrated terminal by right-clicking server.js in VS Code
```

### 1. Installation
```bash
# Install dependencies
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/study_portal
PORT=5000
```

### 3. Running the Project
```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start

```

### 4. Required Dependencies
```json
{
  "dependencies": {
    "express": "^4.17.1",
    "multer": "^1.4.5-lts.1",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.15"
  }
}
```

### 5. Pre-run Checklist
- Ensure all dependencies are installed
- Verify `.env` file exists with correct values
- Check if upload directories exist and have proper permissions

### 6. Common Issues
- **Upload fails**: Check directory permissions and file size limits
- **CORS errors**: Verify CORS configuration in server setup
- **Port conflicts**: Change PORT in .env if 5000 is in use

## API Endpoints

### 1. Upload a File
```javascript
POST http://localhost:5000/api/materials

// Form Data:
{
    branch: "CSE",          // Branch name (CSD, IoT, CCE, AI/ML, CSE)
    semester: "1",          // Semester number (1, 2, 3)
    file: [binary file]     // Any file type, max 25MB
}

// Example using fetch:
const formData = new FormData();
formData.append('branch', branch);
formData.append('semester', semester);
formData.append('file', fileInput.files[0]);

fetch('http://localhost:5000/api/materials', {
    method: 'POST',
    body: formData
})
```

**Response:**
```json
{
    "branch": "CSE",
    "semester": "1",
    "fileName": "1732458392730-158392307-example.pdf",
    "originalName": "example.pdf",
    "filePath": "/uploads/CSE/1732458392730-158392307-example.pdf",
    "fileType": "application/pdf",
    "uploadDate": "2024-03-14T12:00:00.000Z"
}
```

### 2. Get Materials by Branch
```javascript
GET http://localhost:5000/api/materials/:branch

// Example:
GET http://localhost:5000/api/materials/CSE

// Example using fetch:
fetch('http://localhost:5000/api/materials/CSE')
    .then(response => response.json())
    .then(materials => console.log(materials));
```

**Response:**
```json
[
    {
        "branch": "CSE",
        "semester": "1",
        "fileName": "1732458392730-158392307-example.pdf",
        "originalName": "example.pdf",
        "filePath": "/uploads/CSE/1732458392730-158392307-example.pdf",
        "fileType": "application/pdf",
        "uploadDate": "2024-03-14T12:00:00.000Z"
    }
]
```

### 3. Download a File
```javascript
GET http://localhost:5000/api/download/:branch/:filename

// Example:
GET http://localhost:5000/api/download/CSE/1732458392730-158392307-example.pdf

// Example using fetch:
fetch('http://localhost:5000/api/download/CSE/1732458392730-158392307-example.pdf')
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "example.pdf";
        a.click();
    });
```

### 4. Direct File Access
```javascript
GET http://localhost:5000/uploads/:branch/:filename

// Example:
GET http://localhost:5000/uploads/CSE/1732458392730-158392307-example.pdf

// Can be used directly in HTML:
<a href="http://localhost:5000/uploads/CSE/1732458392730-158392307-example.pdf" 
   target="_blank">
    Download File
</a>
```

## File Storage Structure
```
backend/
  ├── uploads/
  │   ├── temp/                  # Temporary upload directory
  │   ├── CSE/                   # Branch directories
  │   │   └── [files]
  │   ├── CSD/
  │   │   └── [files]
  │   └── ...
  └── materials.json            # File metadata storage
```

## Error Responses
```json
{
    "message": "Error message here"
}
```

## HTTP Status Codes
- 200: Success (GET requests)
- 201: Created (successful upload)
- 400: Bad Request (invalid input, file too large)
- 404: Not Found (file doesn't exist)
- 500: Server Error

## File Limits
- Maximum file size: 25MB
- Accepted file types: All file types
- File naming: timestamp-random-originalname

## Testing with cURL
```bash
# Upload a file
curl -X POST \
  -F "branch=CSE" \
  -F "semester=1" \
  -F "file=@/path/to/your/file.pdf" \
  http://localhost:5000/api/materials

# Get materials for a branch
curl http://localhost:5000/api/materials/CSE

# Download a file
curl -O http://localhost:5000/api/download/CSE/1732458392730-158392307-example.pdf
```

## Development Setup
1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm run dev
```

The server will start on port 5000 by default. You can change this by setting the PORT environment variable.





```
{
  "name": "Rushikesh Bhomale",
  "email": "rushikesh@gmail.com",
  "password": "9518933542",
  "department": "CSD",
  "role": "student"
}
```

