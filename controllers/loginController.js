const db = require('../db');

const loginController = {
  // Crear nuevo usuario
  crear: (req, res) => {
   const { usuario, clave } = req.body;
    
 if (!usuario || !clave) {
    return res.status(400).json({ error: 'Usuario y clave son requeridos' });
  }
    
  const selectQuery = 'SELECT * FROM usuario WHERE usuario = ?';
  db.query(selectQuery, [usuario], (err, result) => {
           
  if (result.length > 0) {
    return res.status(400).json({ error: 'Usuario no existe' });
  }
      
   const insertQuery = 'INSERT INTO usuario (usuario, clave) VALUES (?, ?)';
    console.log('Ejecutando query:', insertQuery, [usuario, clave]);
      
   db.query(insertQuery, [usuario, clave], (err, result) => {
        if (err) {
       console.error('Error al crear usuario:', err);
         return res.status(500).json({ error: 'Error al crear usuario' });
    }
       console.log('Usuario creado exitosamente:', result);
     res.status(201).json({ 
         message: 'Usuario registrado exitosamente', 
     id: result.insertId 
  });
   });
  });
},

  // ingresar al menu
  ingresar: (req, res) => {
    console.log('📝 Login intento recibido:', req.body);
    const { usuario, clave } = req.body;
    
    if (!usuario || !clave) {
      console.log('❌ Falta usuario o clave');
      return res.status(400).json({ error: 'Usuario y clave son requeridos' });
    }
    
    console.log('🔍 Buscando usuario:', usuario);
    const selectQuery = 'SELECT * FROM usuario WHERE usuario = ? AND clave = ?';
    db.query(selectQuery, [usuario, clave], (err, result) => {
      if (err) {
        console.error('❌ Error al buscar usuario:', err);
        return res.status(500).json({ error: 'Error interno del servidor', details: err.message });
      }
      
      console.log('📊 Resultados encontrados:', result.length);
      
      if (result.length > 0) {
        console.log('✅ Usuario autenticado exitosamente');
        // Registrar la sesión activa cuando el usuario hace login
        const insertSessionQuery = 'INSERT INTO sesiones_activas (usuario, ultima_actividad) VALUES (?, NOW()) ON DUPLICATE KEY UPDATE ultima_actividad = NOW()';
        db.query(insertSessionQuery, [usuario], (sessionErr) => {
          if (sessionErr) {
            console.error('⚠️ Error al registrar sesión:', sessionErr);
          }
        });
        
        return res.status(200).json({ message: 'Login exitoso', usuario: usuario });
      } else {
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
      }
    });
  },

  // Actualizar actividad del usuario en un rubro
  actualizarActividad: (req, res) => {
    const { usuario, rubro } = req.body;
    
    const updateQuery = `
      INSERT INTO sesiones_activas (usuario, rubro, ultima_actividad) 
      VALUES (?, ?, NOW()) 
      ON DUPLICATE KEY UPDATE ultima_actividad = NOW()
    `;
    
    db.query(updateQuery, [usuario, rubro], (err, result) => {
      if (err) {
        console.error('Error al actualizar actividad:', err);
        return res.status(500).json({ error: 'Error al actualizar actividad' });
      }
      
      const selectQuery = `
        SELECT usuario
        FROM sesiones_activas 
        WHERE rubro = ? 
        AND ultima_actividad > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
        ORDER BY ultima_actividad DESC
      `;
      
      db.query(selectQuery, [rubro], (err, results) => {
        if (err) {
          console.error('Error al obtener usuarios en línea:', err);
          return res.status(500).json({ error: 'Error al obtener usuarios' });
        }
        res.status(200).json(results);
      });
    });
  },

  // Obtener todos los rubros
  obtenerRubros: (req, res) => {
    const query = 'SELECT * FROM rubros ORDER BY rubro ASC';
    
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error al obtener rubros:', err);
        return res.status(500).json({ error: 'Error al obtener rubros' });
      }
      res.status(200).json(results);
    });
  },

  // Actualizar ubicación del usuario
  actualizarUbicacion: (req, res) => {
    const { usuario, latitud, longitud } = req.body;
    
    const query = 'UPDATE usuario SET latitud = ?, longitud = ? WHERE usuario = ?';
    
    db.query(query, [latitud, longitud, usuario], (err, result) => {
      if (err) {
        console.error('Error al actualizar ubicación:', err);
        return res.status(500).json({ error: 'Error al actualizar ubicación' });
      }
      res.status(200).json({ message: 'Ubicación actualizada' });
    });
  },

  // Obtener usuarios en línea por rubro con sus ubicaciones
  obtenerUsuariosEnLinea: (req, res) => {
    const { rubro } = req.params;
    const query = `
      SELECT DISTINCT sa.usuario, u.latitud, u.longitud
      FROM sesiones_activas sa
      INNER JOIN publicaciones p ON sa.usuario = p.usuario
      INNER JOIN usuario u ON sa.usuario = u.usuario
      WHERE sa.rubro = ? 
      AND p.rubro = ?
      AND sa.ultima_actividad > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
      ORDER BY sa.ultima_actividad DESC
    `;
    
    db.query(query, [rubro, rubro], (err, results) => {
      if (err) {
        console.error('Error al obtener usuarios en línea:', err);
        return res.status(500).json({ error: 'Error al obtener usuarios' });
      }
      res.status(200).json(results);
    });
  }

};

module.exports = loginController;


