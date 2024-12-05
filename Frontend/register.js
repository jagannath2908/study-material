// Create auth service to handle token management
const AuthService = {
    // Store token and user data
    setAuth(token, user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        // Also store in memory for immediate access
        AuthService.token = token;
        AuthService.user = user;
    },

    // Clear auth data
    clearAuth() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        AuthService.token = null;
        AuthService.user = null;
    },

    // Get current token
    getToken() {
        if (!AuthService.token) {
            AuthService.token = localStorage.getItem('token');
        }
        return AuthService.token;
    },

    // Get current user
    getUser() {
        if (!AuthService.user) {
            const userStr = localStorage.getItem('user');
            AuthService.user = userStr ? JSON.parse(userStr) : null;
        }
        return AuthService.user;
    },

    // Initialize auth state from storage
    initAuth() {
        AuthService.token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        AuthService.user = userStr ? JSON.parse(userStr) : null;
    }
};

// Initialize auth state on load
AuthService.initAuth();

// Make AuthService global so other scripts can access it
window.AuthService = AuthService;

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get all required fields
    const name = document.getElementById('neme').value; // Match HTML id
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const department = document.getElementById('department').value;
    const role = document.getElementById('role').value;

    // Validate required fields
    if (!name || !email || !password || !department || !role) {
        alert('Please provide all required fields');
        return;
    }

    // Validate role
    if (role !== 'student' && role !== 'teacher') {
        alert('Role must be either "student" or "teacher"');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:5000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                name,
                email, 
                password,
                department,
                role
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store auth data using AuthService
            AuthService.setAuth(data.token, data.user);
            window.location.href = 'index.html';
        } else {
            alert(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Register error:', error);
        alert('Registration failed. Please try again.');
    }
});
