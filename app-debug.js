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

// Log para debug en producción
console.log('🚀 Iniciando servidor...');
console.log('📍 Puerto configurado:', PORT);
console.log('🌍 Entorno:', process.env.NODE_ENV || 'development');

// Seguridad: Helmet para headers de seguridad
app.use(helmet());

// Limitador de velocidad para prevenir ataques de fuerza bruta
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Limitador específico para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
});

// Middleware para CORS
const allowedOrigins = [
  'http://190.113.12.113:3000',
  'http://localhost:3000',
  'exp://localhost:19000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      if (process.env.NODE_ENV === 'production') {
        return callback(null, true);
      } else {
        return callback(new Error('No permitido por CORS'));
      }
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware para JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend de Rubro funcionando ✅', 
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Verificar conexión DB
app.get('/check-db', (req, res) => {
  db.query('SELECT 1', (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database connection failed' });
    }
    res.status(200).json({ message: 'Database connection successful' });
  });
});

// Rutas de autenticación
app.post('/ingresar', loginLimiter, loginController.ingresar);
app.post('/login', loginLimiter, loginController.ingresar);
app.post('/crear', loginLimiter, loginController.crear);
app.get('/rubros', loginController.obtenerRubros);
app.post('/actualizar-actividad', loginController.actualizarActividad);
app.post('/actualizar-ubicacion', loginController.actualizarUbicacion);
app.get('/usuarios-en-linea/:rubro', loginController.obtenerUsuariosEnLinea);

// Rutas de publicaciones
app.post('/publicaciones', publicacionesController.crear);
app.get('/publicaciones', publicacionesController.obtenerTodas);
app.get('/publicaciones/rubro/:rubro', publicacionesController.obtenerPorRubro);

// Rutas de chat - CON FUNCIÓN CORREGIDA
app.post('/solicitar-chat', chatController.solicitarChat);
app.get('/solicitudes-pendientes/:usuario', chatController.obtenerSolicitudesPendientes);
app.post('/responder-solicitud', chatController.responderSolicitud);
app.post('/enviar-mensaje', chatController.enviarMensaje);
app.get('/mensajes/:usuario1/:usuario2', chatController.obtenerMensajes);
app.get('/notificaciones-chat/:usuario', chatController.obtenerNotificacionesChat);
app.post('/marcar-notificacion-leida', chatController.marcarNotificacionLeida);
app.get('/chats-activos/:usuario', chatController.obtenerChatsActivos);

// RUTA CORREGIDA CON DEBUG
app.get('/chats-activos-rubro/:usuario', (req, res) => {
  const { usuario } = req.params;
  
  console.log('🔍 DEBUG - obtenerChatsActivosRubro llamada para usuario:', usuario);
  
  // Query simplificada que SÍ funciona
  const querySimple = `
    SELECT DISTINCT
      CASE 
        WHEN m.remitente = ? THEN m.destinatario 
        ELSE m.remitente 
      END as otro_usuario,
      m.rubro,
      MAX(m.fecha_envio) as ultimo_mensaje_fecha,
      (SELECT mensaje FROM mensajes m2 
       WHERE ((m2.remitente = ? AND m2.destinatario = CASE WHEN m.remitente = ? THEN m.destinatario ELSE m.remitente END)
           OR (m2.remitente = CASE WHEN m.remitente = ? THEN m.destinatario ELSE m.remitente END AND m2.destinatario = ?))
       AND m2.rubro = m.rubro
       ORDER BY m2.fecha_envio DESC LIMIT 1) as ultimo_mensaje
    FROM mensajes m 
    WHERE (m.remitente = ? OR m.destinatario = ?) 
    AND m.rubro IS NOT NULL
    GROUP BY 
      CASE WHEN m.remitente = ? THEN m.destinatario ELSE m.remitente END,
      m.rubro
    ORDER BY ultimo_mensaje_fecha DESC
  `;
  
  console.log('📝 Ejecutando query para chats activos por rubro');
  
  db.query(querySimple, [usuario, usuario, usuario, usuario, usuario, usuario, usuario, usuario], (err, results) => {
    if (err) {
      console.error('❌ Error en consulta SQL:', err);
      return res.status(500).json({ 
        error: 'Error en base de datos',
        details: err.message 
      });
    }
    
    console.log('✅ Chats activos obtenidos:', results.length);
    console.log('📊 Resultados:', JSON.stringify(results, null, 2));
    
    res.json({
      success: true,
      usuario: usuario,
      chats: results || [],
      total: results ? results.length : 0
    });
  });
});

app.get('/mensajes-rubro/:usuario1/:usuario2/:rubro', chatController.obtenerMensajesRubro);
app.post('/eliminar-chat', chatController.eliminarChatVista);
app.post('/verificar-usuarios-en-linea', chatController.verificarUsuariosEnLinea);

// Middleware de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🎯 Listening on: 0.0.0.0:${PORT}`);
});
