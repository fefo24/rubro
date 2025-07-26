const { body, validationResult } = require('express-validator');

const securityUtils = {
  // Sanitizar entrada de texto
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remover caracteres potencialmente peligrosos
      .substring(0, 255); // Limitar longitud
  },

  // Validaciones para email
  validateEmail: () => {
    return body('usuario')
      .isEmail()
      .withMessage('Debe ser un email válido')
      .normalizeEmail()
      .isLength({ min: 5, max: 100 })
      .withMessage('El email debe tener entre 5 y 100 caracteres');
  },

  // Validaciones para contraseña (muy flexibles para facilitar registro)
  validatePassword: () => {
    return body('clave')
      .isLength({ min: 3, max: 50 })
      .withMessage('La contraseña debe tener al menos 3 caracteres')
      .matches(/^.+$/)
      .withMessage('La contraseña es requerida');
  },

  // Verificar errores de validación
  checkValidationErrors: (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: errors.array()
      });
    }
    next();
  },

  // Logs seguros (sin exponer datos sensibles)
  safeLog: (message, data = {}) => {
    const safeData = { ...data };
    
    // Ocultar campos sensibles
    if (safeData.clave) safeData.clave = '***';
    if (safeData.password) safeData.password = '***';
    if (safeData.token) safeData.token = safeData.token.substring(0, 10) + '...';
    
    console.log(message, safeData);
  }
};

module.exports = securityUtils;
