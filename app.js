const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression'); // Para compresión gzip
const db = require('./db');
const loginController = require('./controllers/loginController');
const publicacionesController = require('./controllers/publicacionesController');
const chatController = require('./controllers/chatController');
const secureLogger = require('./utils/secureLogger');

const app = express();
const PORT = process.env.PORT || 3000;

// ===============================================
// CONFIGURACIONES PARA ALTA CARGA
// ===============================================

// Configurar Express para alta carga
app.set('trust proxy', 1); // Confiar en reverse proxies
app.disable('x-powered-by'); // Ocultar versión de Express

// Compresión gzip para reducir el ancho de banda
app.use(compression({
  level: 6,
  threshold: 1000, // Solo comprimir si es mayor a 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Middleware para analizar JSON - DEBE IR ANTES QUE LOS ENDPOINTS
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Seguridad: Helmet para headers de seguridad
app.use(helmet());

// Limitador de velocidad optimizado para miles de usuarios
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50000, // Aumentado significativamente para manejar miles de usuarios
  message: {
    error: 'Demasiadas solicitudes desde esta IP',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Configuraciones avanzadas para alta carga
  skip: (req) => {
    // Saltar rate limiting para health checks
    return req.path === '/' || req.path === '/health';
  }
  // Removemos keyGenerator personalizado para evitar errores IPv6
});
app.use(limiter);

// Limitador específico para login (más restrictivo pero realista)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Aumentado para permitir más intentos legítimos
  skipSuccessfulRequests: true,
  message: {
    error: 'Demasiados intentos de login',
    retryAfter: '15 minutos'
  }
});

// Log para debug en producción
console.log('🚀 Iniciando servidor...');
console.log('📍 Puerto configurado:', PORT);
console.log('🌍 Entorno:', process.env.NODE_ENV || 'development');
console.log('🔄 Deploy timestamp:', new Date().toISOString());

// Middleware para CORS - Configuración segura
const allowedOrigins = [
  'https://api.modiin.cl',
  'http://api.modiin.cl',
  'https://modiin.cl',
  'http://modiin.cl',
  'http://190.113.12.113:3000',
  'http://localhost:3000',
  'exp://localhost:19000',
  'exp://192.168.1.31:19000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (aplicaciones móviles)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Ruta de prueba para verificar que el servidor está funcionando
app.get('/', (req, res) => {
  console.log('🔍 Solicitud de prueba recibida');
  res.status(200).json({ 
    status: 'OK',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0'
  });
});

// Asegurar encoding UTF-8 en todas las respuestas
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Middleware seguro para verificar requests (sin exponer contraseñas)
app.use((req, res, next) => {
  secureLogger.logRequest(req.method, req.url, req.body);
  next();
});

// Ruta raíz para verificar que el servidor está funcionando
app.get('/', (req, res) => {
  console.log('🎯 RUTA RAÍZ ACCEDIDA!');
  res.json({ 
    message: 'Backend de Rubro está funcionando correctamente ✅', 
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.2 - Deploy Test'
  });
});

// Verificar conexión a la base de datos
app.get('/check-db', (req, res) => {
  db.query('SELECT 1', (err) => {
    if (err) {
      console.error('Error checking database connection:', err);
      return res.status(500).json({ error: 'Database connection failed' });
    }
    res.status(200).json({ message: 'Database connection successful' });
  });
});

// Ruta para ingresar al menú
app.post('/ingresar', loginLimiter, loginController.ingresar);

// Ruta temporal de compatibilidad para /login (redirecciona a /ingresar)
app.post('/login', loginLimiter, loginController.ingresar);

// Rutas para usuarios
app.post('/crear', loginLimiter, loginController.crear);

// Ruta para obtener rubros
app.get('/rubros', loginController.obtenerRubros);

// Ruta para actualizar actividad del usuario
app.post('/actualizar-actividad', loginController.actualizarActividad);

// Ruta para actualizar ubicación del usuario
app.post('/actualizar-ubicacion', loginController.actualizarUbicacion);

// Ruta para actualizar ubicación después del login
app.post('/actualizar-ubicacion-login', loginController.actualizarUbicacionLogin);

// Ruta para cerrar sesión
app.post('/cerrar-sesion', loginController.cerrarSesion);

// Ruta para obtener usuarios en línea por rubro
app.get('/usuarios-en-linea/:rubro', loginController.obtenerUsuariosEnLinea);

// Ruta para obtener coordenadas de un usuario específico
app.get('/coordenadas-usuario/:usuario', loginController.obtenerCoordenadasUsuario);

// DEBUG: Ruta para revisar todas las sesiones activas
app.get('/debug/sesiones', loginController.debugSesiones);

// DEBUG: Ruta para limpiar sesiones antiguas
app.post('/debug/limpiar-sesiones', loginController.limpiarSesionesAntiguas);

// Rutas para publicaciones
app.post('/publicaciones', publicacionesController.crear);
app.get('/publicaciones', publicacionesController.obtenerTodas);
app.get('/publicaciones/rubro/:rubro', publicacionesController.obtenerPorRubro);

// Rutas para chat
app.post('/solicitar-chat', chatController.solicitarChat);
app.post('/prueba-insertar-mensaje', chatController.pruebaInsertarMensaje);  // Ruta de prueba
app.get('/solicitudes-pendientes/:usuario', chatController.obtenerSolicitudesPendientes);
app.post('/responder-solicitud', chatController.responderSolicitud);
app.post('/enviar-mensaje', chatController.enviarMensaje);
app.get('/mensajes/:usuario1/:usuario2', chatController.obtenerMensajes);

// Rutas para notificaciones de chat
app.get('/notificaciones-chat/:usuario', chatController.obtenerNotificacionesChat);
app.post('/marcar-notificacion-leida', chatController.marcarNotificacionLeida);

// Ruta para obtener chats activos
app.get('/chats-activos/:usuario', chatController.obtenerChatsActivos);
app.get('/chats-activos-rubro/:usuario', chatController.obtenerChatsActivosRubro);
app.get('/mensajes-rubro/:usuario1/:usuario2/:rubro', chatController.obtenerMensajesRubro);

// Middleware específico para debugging eliminar-chat
app.use('/eliminar-chat', (req, res, next) => {
  console.log('🗑️ DEBUGGING ELIMINAR-CHAT');
  console.log('Raw Body:', req.body);
  console.log('Headers:', req.headers);
  console.log('Content-Type:', req.get('Content-Type'));
  console.log('Content-Length:', req.get('Content-Length'));
  next();
});

// Ruta para eliminar chat de la vista del usuario
app.post('/eliminar-chat', chatController.eliminarChatVista);

// Ruta para verificar si ambos usuarios están en línea (chat en vivo)
app.post('/verificar-usuarios-en-linea', chatController.verificarUsuariosEnLinea);

// Middleware para manejar errores globalmente
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Iniciar el servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🎯 Listening on: 0.0.0.0:${PORT}`);
  if (process.env.RENDER_EXTERNAL_URL) {
    console.log(`🔗 External URL: ${process.env.RENDER_EXTERNAL_URL}`);
  }
});
