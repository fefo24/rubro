const mysql = require('mysql2');
require('dotenv').config();

// Crear un pool de conexiones con reconexión automática
const db = mysql.createPool({
  host: process.env.DB_HOST || '190.113.12.113',
  user: process.env.DB_USER || 'davrubro',
  password: process.env.DB_PASSWORD || 'POkuy3447jl',
  database: process.env.DB_NAME || 'rubro',
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  idleTimeout: 300000,
  queueLimit: 0
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
    console.log('✅ Connected to MySQL database: rubro');
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