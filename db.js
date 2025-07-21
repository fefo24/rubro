const mysql = require('mysql2');
require('dotenv').config();

// Crear un pool de conexiones con reconexión automática
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  idleTimeout: 300000,
  queueLimit: 0,
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