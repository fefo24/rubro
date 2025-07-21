const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const db = require('./db');
const loginController = require('./controllers/loginController');
const publicacionesController = require('./controllers/publicacionesController');
const chatController = require('./controllers/chatController');

const app = express();
const PORT = process.env.PORT || 3000;

// Seguridad: Helmet para headers de seguridad
app.use(helmet());

// Limitador de velocidad para prevenir ataques de fuerza bruta
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por ventana de tiempo por IP
  message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Limitador específico para login (más restrictivo)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // límite de 5 intentos de login por IP
  skipSuccessfulRequests: true,
});

// Log para debug en producción
console.log('🚀 Iniciando servidor...');
console.log('📍 Puerto configurado:', PORT);
console.log('🌍 Entorno:', process.env.NODE_ENV || 'development');
console.log('🔄 Deploy timestamp:', new Date().toISOString());

// Middleware para CORS - Configuración segura
const allowedOrigins = [
  'https://web-production-9311.up.railway.app',
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

// Middleware para analizar JSON
app.use(express.json());

// Middleware simple para verificar requests
app.use((req, res, next) => {
  console.log('*** REQUEST DETECTADA ***');
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Body:', req.body);
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

// Ruta para obtener usuarios en línea por rubro
app.get('/usuarios-en-linea/:rubro', loginController.obtenerUsuariosEnLinea);

// Rutas para publicaciones
app.post('/publicaciones', publicacionesController.crear);
app.get('/publicaciones', publicacionesController.obtenerTodas);
app.get('/publicaciones/rubro/:rubro', publicacionesController.obtenerPorRubro);

// Rutas para chat
app.post('/solicitar-chat', chatController.solicitarChat);
app.get('/solicitudes-pendientes/:usuario', chatController.obtenerSolicitudesPendientes);
app.post('/responder-solicitud', chatController.responderSolicitud);
app.post('/enviar-mensaje', chatController.enviarMensaje);
app.get('/mensajes/:usuario1/:usuario2', chatController.obtenerMensajes);

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