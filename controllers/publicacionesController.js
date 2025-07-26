const db = require('../db');

const publicacionesController = {
  crear: (req, res) => {
    const { usuario, rubro, publicacion } = req.body;
    
    // Validación robusta del contenido de la publicación
    if (!publicacion || typeof publicacion !== 'string') {
      return res.status(400).json({ error: 'La publicación es requerida' });
    }
    
    // Verificar que no esté vacía después de quitar espacios al inicio y final
    const publicacionLimpia = publicacion.trim();
    if (publicacionLimpia.length === 0) {
      return res.status(400).json({ error: 'La publicación no puede estar vacía o contener solo espacios' });
    }
    
    // Verificar que no exceda el límite de caracteres (incluyendo espacios)
    if (publicacion.length > 200) {
      return res.status(400).json({ error: 'La publicación no puede exceder 200 caracteres' });
    }
    
    console.log(`📝 Creando publicación para ${usuario} en ${rubro}: "${publicacion}" (${publicacion.length} caracteres)`);
    
    // Primero verificar si el usuario ya tiene una publicación en este rubro
    const checkQuery = 'SELECT * FROM publicaciones WHERE usuario = ? AND rubro = ?';
    
    db.query(checkQuery, [usuario, rubro], (err, existingResults) => {
      if (err) {
        console.error('Error al verificar publicación existente:', err);
        return res.status(500).json({ error: 'Error al verificar publicación' });
      }

      if (existingResults.length > 0) {
        // Ya existe una publicación, actualizarla
        const updateQuery = 'UPDATE publicaciones SET publicacion = ?, fecha = NOW() WHERE usuario = ? AND rubro = ?';
        
        db.query(updateQuery, [publicacion, usuario, rubro], (err, result) => {
          if (err) {
            console.error('Error al actualizar publicación:', err);
            return res.status(500).json({ error: 'Error al actualizar publicación' });
          }
          res.status(200).json({ 
            message: 'Publicación actualizada exitosamente',
            action: 'updated'
          });
        });
      } else {
        // No existe, crear nueva publicación
        const insertQuery = 'INSERT INTO publicaciones (usuario, rubro, publicacion, fecha) VALUES (?, ?, ?, NOW())';
        
        db.query(insertQuery, [usuario, rubro, publicacion], (err, result) => {
          if (err) {
            console.error('Error al crear publicación:', err);
            return res.status(500).json({ error: 'Error al crear publicación' });
          }
          res.status(201).json({ 
            message: 'Publicación creada exitosamente', 
            id: result.insertId,
            action: 'created'
          });
        });
      }
    });
  },

  // Obtener todas las publicaciones
  obtenerTodas: (req, res) => {
    const query = 'SELECT * FROM publicaciones ORDER BY fecha DESC, id DESC';
    
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error al obtener publicaciones:', err);
        return res.status(500).json({ error: 'Error al obtener publicaciones' });
      }
      console.log(`📋 Consultadas ${results.length} publicaciones ordenadas por fecha`);
      res.status(200).json(results);
    });
  },

  // Obtener publicaciones por rubro
  obtenerPorRubro: (req, res) => {
    const { rubro } = req.params;
    const query = 'SELECT * FROM publicaciones WHERE rubro = ? ORDER BY fecha DESC, id DESC';
    
    db.query(query, [rubro], (err, results) => {
      if (err) {
        console.error('Error al obtener publicaciones por rubro:', err);
        return res.status(500).json({ error: 'Error al obtener publicaciones' });
      }
      console.log(`📋 Consultadas ${results.length} publicaciones del rubro "${rubro}" ordenadas por fecha`);
      res.status(200).json(results);
    });
  }
};

module.exports = publicacionesController;

