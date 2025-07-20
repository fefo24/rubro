const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || '190.113.12.113',
  user: process.env.DB_USER || 'davrubro',
  password: process.env.DB_PASSWORD || 'POkuy3447jl',
  database: process.env.DB_NAME || 'rubro'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database: rubro');
});

module.exports = db;