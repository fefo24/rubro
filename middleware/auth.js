const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

const authMiddleware = {
  // Generar token JWT
  generateToken: (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
  },

  // Verificar token JWT
  verifyToken: (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Acceso denegado. Token requerido.' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Token inválido.' });
    }
  },

  // Middleware opcional para verificar token
  optionalAuth: (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
      } catch (error) {
        // Token inválido, pero continuamos sin usuario
        req.user = null;
      }
    }
    
    next();
  }
};

module.exports = authMiddleware;
