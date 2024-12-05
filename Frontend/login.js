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
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store auth data using AuthService
            AuthService.setAuth(data.token, data.user);
            window.location.href = 'index.html';
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed');
    }
});


