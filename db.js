const mysql = require('mysql2');

const db = mysql.createConnection({
  host: '190.113.12.113',
  user: 'davrubro',
  password: 'POkuy3447jl',
  database: 'rubro' // Se conecta a tu base de datos existente 'rubro'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database: rubro');
});

module.exports = db;