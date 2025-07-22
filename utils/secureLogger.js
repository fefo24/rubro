// Utilidades de logging seguro
const secureLogger = {
  // Campos sensibles que nunca deben aparecer en logs
  sensitiveFields: ['clave', 'password', 'contraseña', 'token', 'secret'],
  
  // Función para limpiar objetos de datos sensibles
  sanitizeForLog: (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = { ...obj };
    
    secureLogger.sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[PROTEGIDO]';
      }
    });
    
    return sanitized;
  },
  
  // Log seguro que automáticamente filtra datos sensibles
  safeLog: (message, data = null) => {
    if (data) {
      console.log(message, secureLogger.sanitizeForLog(data));
    } else {
      console.log(message);
    }
  },
  
  // Log de error seguro
  safeError: (message, error = null) => {
    if (error) {
      console.error(message, secureLogger.sanitizeForLog(error));
    } else {
      console.error(message);
    }
  }
};

module.exports = secureLogger;
