const db = require('../db');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const securityUtils = require('../utils/security');

const loginController = {
  // Crear nuevo usuario con seguridad
  crear: [
    securityUtils.validateEmail(),
    securityUtils.validatePassword(),
    securityUtils.checkValidationErrors,
    async (req, res) => {
      try {
        let { usuario, clave } = req.body;
        
        securityUtils.safeLog('=== CREAR USUARIO ===', { usuario });
        
        // Sanitizar entrada
        usuario = securityUtils.sanitizeInput(usuario);
        
        // Verificar si el usuario ya existe
        const selectQuery = 'SELECT * FROM usuario WHERE usuario = ?';
        db.query(selectQuery, [usuario], async (err, result) => {
          if (err) {
            console.error('Error al verificar usuario:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
          }
          
          if (result.length > 0) {
            return res.status(409).json({ error: 'El usuario ya existe' });
          }
          
          try {
            // Encriptar contraseña
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(clave, saltRounds);
            
            // Crear usuario
            const insertQuery = 'INSERT INTO usuario (usuario, clave) VALUES (?, ?)';
            db.query(insertQuery, [usuario, hashedPassword], (err, result) => {
              if (err) {
                console.error('Error al crear usuario:', err);
                return res.status(500).json({ error: 'Error al crear usuario' });
              }
              
              // Generar token JWT
              const token = authMiddleware.generateToken({
                id: result.insertId,
                usuario: usuario
              });
              
              securityUtils.safeLog('Usuario creado exitosamente', { id: result.insertId, usuario });
              
              res.status(201).json({ 
                message: 'Usuario registrado exitosamente', 
                id: result.insertId,
                token: token
              });
            });
          } catch (hashError) {
            console.error('Error al encriptar contraseña:', hashError);
            return res.status(500).json({ error: 'Error interno del servidor' });
          }
        });
      } catch (error) {
        console.error('Error en crear usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  ],

  // Login seguro
  ingresar: [
    securityUtils.validateEmail(),
    body('clave').notEmpty().withMessage('La contraseña es requerida'),
    securityUtils.checkValidationErrors,
    async (req, res) => {
      try {
        let { usuario, clave } = req.body;
        
        securityUtils.safeLog('=== LOGIN INTENTO ===', { usuario });
        
        // Sanitizar entrada
        usuario = securityUtils.sanitizeInput(usuario);
        
        const selectQuery = 'SELECT * FROM usuario WHERE usuario = ?';
        db.query(selectQuery, [usuario], async (err, result) => {
          if (err) {
            console.error('Error al buscar usuario:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
          }
          
          if (result.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
          }
          
          const user = result[0];
          
          try {
            // Verificar contraseña
            const isValidPassword = await bcrypt.compare(clave, user.clave);
            
            if (!isValidPassword) {
              securityUtils.safeLog('Login fallido - contraseña incorrecta', { usuario });
              return res.status(401).json({ error: 'Credenciales inválidas' });
            }
            
            // Registrar sesión activa
            const insertSessionQuery = 'INSERT INTO sesiones_activas (usuario, ultima_actividad) VALUES (?, NOW()) ON DUPLICATE KEY UPDATE ultima_actividad = NOW()';
            db.query(insertSessionQuery, [usuario], (sessionErr) => {
              if (sessionErr) {
                console.error('Error al registrar sesión:', sessionErr);
              }
            });
            
            // Generar token JWT
            const token = authMiddleware.generateToken({
              id: user.id,
              usuario: usuario
            });
            
            securityUtils.safeLog('Login exitoso', { usuario, id: user.id });
            
            return res.status(200).json({ 
              message: 'Login exitoso', 
              usuario: usuario,
              token: token
            });
          } catch (compareError) {
            console.error('Error al comparar contraseñas:', compareError);
            return res.status(500).json({ error: 'Error interno del servidor' });
          }
        });
      } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  ],
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


