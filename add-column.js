const db = require('./db');

console.log('🔧 Agregando columna fecha_ultima_ubicacion a la tabla usuario...');

const alterQuery = `
ALTER TABLE usuario 
ADD COLUMN fecha_ultima_ubicacion TIMESTAMP NULL DEFAULT NULL 
COMMENT 'Última actualización de ubicación GPS'
`;

db.query(alterQuery, (err, result) => {
  if (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️ La columna fecha_ultima_ubicacion ya existe');
    } else {
      console.error('❌ Error al agregar columna:', err.message);
    }
  } else {
    console.log('✅ Columna fecha_ultima_ubicacion agregada exitosamente');
  }
  
  // Verificar la estructura de la tabla
  db.query('DESCRIBE usuario', (err, results) => {
    if (err) {
      console.error('Error al describir tabla:', err.message);
    } else {
      console.log('\n📋 Estructura actual de la tabla usuario:');
      results.forEach(row => {
        console.log(`${row.Field} - ${row.Type} - ${row.Null} - ${row.Default}`);
      });
    }
    process.exit(0);
  });
});
