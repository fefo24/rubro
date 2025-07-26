const mysql = require('mysql2');
require('dotenv').config();

// Crear un pool de conexiones optimizado para miles de usuarios
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  // Pool optimizado para alta carga
  connectionLimit: 50, // Aumentado de 10 a 50 para manejar más usuarios simultáneos
  idleTimeout: 180000, // 3 minutos - reducido para liberar conexiones más rápido
  queueLimit: 100, // Límite de cola aumentado para evitar rechazos
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci',
  acquireTimeout: 30000, // Reducido a 30s para fallar más rápido si hay problemas
  timeout: 30000, // Reducido a 30s
  reconnect: true,
  // Configuraciones adicionales para estabilidad
  removeNodeErrorCount: 5,
  restoreNodeTimeout: 0,
  multipleStatements: false, // Seguridad
  ssl: {
    rejectUnauthorized: false
  }
});

// Función para manejar la conexión con reintentos
const connectWithRetry = () => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error('Error connecting to MySQL:', err);
      console.log('Retrying connection in 5 seconds...');
      setTimeout(connectWithRetry, 5000);
      return;
    }
    console.log('✅ Connected to MySQL database:', process.env.DB_NAME);
    if (connection) connection.release();
  });
};

// Conectar inicialmente
connectWithRetry();

// Manejar errores de conexión
db.on('error', (err) => {
  console.error('Database error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
    console.log('Attempting to reconnect...');
    connectWithRetry();
  }
});

module.exports = db;