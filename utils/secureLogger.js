// Utilidades de seguridad para logs
const secureLogger = {
  // Lista de campos sensibles que no deben aparecer en logs
  sensitiveFields: ['clave', 'password', 'contraseña', 'token', 'secret'],
  
  // Función para sanitizar objetos antes de hacer log
  sanitizeForLog: (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = { ...obj };
    
    // Ocultar campos sensibles
    secureLogger.sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***OCULTO***';
      }
    });
    
    return sanitized;
  },
  
  // Log seguro para requests
  logRequest: (method, url, body) => {
    console.log('*** REQUEST DETECTADA ***');
    console.log(`${new Date().toISOString()} - ${method} ${url}`);
    console.log('Body:', secureLogger.sanitizeForLog(body));
  }
};

module.exports = secureLogger;
