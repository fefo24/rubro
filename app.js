const express = require('express');
const cors = require('cors');
const db = require('./db');
const loginController = require('./controllers/loginController');
const publicacionesController = require('./controllers/publicacionesController');
const chatController = require('./controllers/chatController');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para CORS
app.use(cors());

// Middleware para analizar JSON
app.use(express.json());

// Middleware simple para verificar requests
app.use((req, res, next) => {
  console.log('*** REQUEST DETECTADA ***');
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Body:', req.body);
  next();
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
app.post('/ingresar', loginController.ingresar);

// Rutas para usuarios
app.post('/crear', loginController.crear);

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
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});