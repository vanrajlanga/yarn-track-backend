import jwt from 'jsonwebtoken';
import User from '../models/User.js';

if (!process.env.JWT_SECRET) {
  console.warn('Warning: JWT_SECRET is not set in environment variables. Using default secret key.');
}

const JWT_SECRET = process.env.JWT_SECRET || 'yarn-track-secret-key-2024';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log('No token provided in request');
      return res.status(401).json({ error: 'Authentication token required' });
    }

    console.log('Verifying token with secret:', JWT_SECRET.substring(0, 10) + '...');
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('Token decoded successfully:', decoded);
      
      const user = await User.findByPk(decoded.id);
      if (!user) {
        console.log('User not found for id:', decoded.id);
        return res.status(401).json({ error: 'User not found' });
      }

      console.log('User found:', { id: user.id, username: user.username, role: user.role });
      req.user = user;
      next();
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError);
      return res.status(403).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Role-based middleware
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Please authenticate' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  };
};