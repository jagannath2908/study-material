// Global variables
// const API_URL = 'http://localhost:5000/api';
const API_URL = 'https://study-portal-backend.onrender.com/api';
let branchDataLoaded = {};

// Check authentication
const token = localStorage.getItem('token');
console.log(token);
if (!token) {
    window.location.href = 'login.html';
}

// Add logout handler
document.getElementById('logout-btn').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
});

// File upload handling with validation
function validateFile(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    // const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (file.size > maxSize) {
        showNotification('File size must be less than 5MB', 'error');
        return false;
    }
    // if (!allowedTypes.includes(file.type)) {
    //     showNotification('Only PDF and Word documents are allowed', 'error');
    //     return false;
    // }
    return true;
}

// Handle File Upload
document.getElementById("uploadForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const branch = document.getElementById("branch").value;
    const semester = document.getElementById("semester").value;
    const fileInput = document.getElementById("file");

    if (!fileInput.files.length) {
        showNotification('Please select a file', 'error');
        return;
    }

    if (!validateFile(fileInput.files[0])) return;

    const formData = new FormData();
    formData.append('branch', branch);
    formData.append('semester', semester);
    formData.append('file', fileInput.files[0]);

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        showLoader();
        const response = await fetch(`${API_URL}/materials`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();

        if (response.status === 201) {  // Check for successful creation status
            showNotification('File uploaded successfully!', 'success');
            loadMaterialsForBranch(branch);
            document.getElementById("uploadForm").reset();
        } else {
            throw new Error(data.message || 'Upload failed');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showNotification(error.message || 'Error uploading file', 'error');
    } finally {
        hideLoader();
    }
});

// Load materials for a branch
async function loadMaterialsForBranch(branch) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/materials/${branch}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const materials = await response.json();
        
        const branchMaterials = document.getElementById(branch).querySelector(".materials");
        branchMaterials.innerHTML = ''; // Clear existing content
        
        if (materials.length === 0) {
            branchMaterials.innerHTML = '<p class="no-materials">No materials available</p>';
            return;
        }
        
        materials.forEach(material => {
            const materialCard = createMaterialCard(material);
            branchMaterials.appendChild(materialCard);
        });
    } catch (error) {
        console.error('Error loading materials:', error);
        showNotification('Error loading materials', 'error');
    }
}

// Create material card
function createMaterialCard(material) {
    const card = document.createElement("div");
    card.className = "material-card";
    
    // Get file extension
    const fileExtension = material.originalName.split('.').pop().toLowerCase();
    
    // Choose icon based on file type
    let fileIcon = '📄'; // Default icon
    if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) fileIcon = '🖼️';
    if (['pdf'].includes(fileExtension)) fileIcon = '📕';
    if (['doc', 'docx'].includes(fileExtension)) fileIcon = '📝';
    if (['xls', 'xlsx'].includes(fileExtension)) fileIcon = '📊';
    if (['zip', 'rar'].includes(fileExtension)) fileIcon = '📦';
    if (['mp4', 'avi', 'mov'].includes(fileExtension)) fileIcon = '🎥';
    if (['mp3', 'wav'].includes(fileExtension)) fileIcon = '🎵';

    const token = localStorage.getItem('token');
    card.innerHTML = `
        <div class="material-info">
            <span class="file-icon">${fileIcon}</span>
            <div class="file-details">
                <div class="file-name">${material.originalName}</div>
                <div class="file-meta">Semester: ${material.semester} • Uploaded: ${new Date(material.uploadDate).toLocaleDateString()}</div>
            </div>
        </div>
        <div class="material-actions">
            <a href="${API_URL}/download/${material.branch}/${material.fileName}?token=${token}" 
               class="download-btn" 
               onclick="downloadFile(event, this.href)"
               download="${material.originalName}">
               Download
            </a>
        </div>
    `;
    return card;
}

// Download file with error handling
async function downloadFile(e, url) {
    e.preventDefault();
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = e.target.getAttribute('download');
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Download error:', error);
        showNotification('Error downloading file', 'error');
    }
}

// Load materials for all branches on page load
document.addEventListener('DOMContentLoaded', function() {
    const branches = ['CSD', 'IoT', 'CCE', 'AIML', 'CSE'];
    branches.forEach(branch => loadMaterialsForBranch(branch));
});

// Chat Section
document.getElementById("chatForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const chatInput = document.getElementById("chatInput");
    const chatWindow = document.getElementById("chatWindow");

    if (chatInput.value.trim()) {
        const userMessage = document.createElement("div");
        userMessage.className = "message user-message";
        userMessage.textContent = `You: ${chatInput.value}`;

        const botMessage = document.createElement("div");
        botMessage.className = "message reply-message";
        botMessage.textContent = `Reply: we will help you soon!`; // Placeholder bot response

        chatWindow.appendChild(userMessage);
        chatWindow.appendChild(botMessage);

        chatInput.value = ""; // Clear the input field
        chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to the latest message
    }
});

let slideIndex = 0;
let timeoutId;  // To store the timeout ID

function showSlides() {
    const slides = document.getElementsByClassName("slides");
    
    // Clear previous timeout if exists
    if (timeoutId) {
        clearTimeout(timeoutId);
    }
    
    // Hide all slides
    for (let i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }
    
    // Move to next slide
    slideIndex++;
    if (slideIndex > slides.length) {
        slideIndex = 1;
    }
    
    // Show current slide
    slides[slideIndex-1].style.display = "block";
    
    // Set next timeout
    timeoutId = setTimeout(showSlides, 3000); // Change slides every 3 seconds
}
// Start slideshow when page loads
document.addEventListener('DOMContentLoaded', function() {
    showSlides();
});

function showLoader() {
    const loader = document.createElement('div');
    loader.className = 'loader';
    document.body.appendChild(loader);
}

function hideLoader() {
    const loader = document.querySelector('.loader');
    if (loader) loader.remove();
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function updateDateTime() {
    const options = {
        timeZone: 'Asia/Kolkata',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    };

    const indianDateTime = new Date().toLocaleString('en-IN', options);
    document.getElementById('datetime-display').textContent = indianDateTime;
}

// Update time immediately and then every second
updateDateTime();
setInterval(updateDateTime, 1000);

function toggleMaterials(branch) {
    const materialsDiv = document.getElementById(branch).querySelector('.materials');
    const viewBtn = document.getElementById(branch).querySelector('.view-btn');
    
    if (materialsDiv.style.display === 'none') {
        // Hide all other materials first
        document.querySelectorAll('.materials').forEach(div => {
            div.style.display = 'none';
        });
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.textContent = 'View';
        });
        
        // Show selected branch materials
        materialsDiv.style.display = 'block';
        viewBtn.classList.add('active');
        viewBtn.textContent = 'Hide';
        
        // Load materials if not already loaded
        if (!branchDataLoaded[branch]) {
            loadMaterialsForBranch(branch);
            branchDataLoaded[branch] = true;
        }
    } else {
        materialsDiv.style.display = 'none';
        viewBtn.classList.remove('active');
        viewBtn.textContent = 'View';
    }
}
