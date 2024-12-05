const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
    const url = req.url;
    
    try {
        let token;
        
        // For download routes, get token from query params
        if (url.includes('/api/download/')) {
            token = req.query.token;
            if (!token) {
                return res.status(401).json({ message: 'Token missing in query parameters' });
            }
        } else {
            // For other routes, get token from Authorization header
            const authHeader = req.header('Authorization');
            
            if (!authHeader) {
                return res.status(401).json({ message: 'Authorization header missing' });
            }

            if (!authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ message: 'Invalid token format' });
            }

            token = authHeader.replace('Bearer ', '');
        }
        
        // Verify token
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token has expired' });
            }
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Invalid token' });
            }
            return res.status(401).json({ message: 'Invalid token' });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = auth;