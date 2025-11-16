const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

const authMiddleware = (userType = 'user') => {
  return (req, res, next) => {
    const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      if (userType === 'admin' && decoded.type !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      if (userType === 'user' && decoded.type !== 'user') {
        return res.status(403).json({ message: 'User access required' });
      }
      
      req.user = decoded;
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({ message: 'Token is not valid' });
    }
  };
};

const optionalAuth = (req, res, next) => {
  const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (error) {
    req.user = null;
  }
  
  next();
};

const generateToken = (user, type) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      type: type
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

module.exports = {
  authMiddleware,
  optionalAuth,
  generateToken,
  JWT_SECRET
};
