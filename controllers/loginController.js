const db = require('../db');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const securityUtils = require('../utils/security');

const loginController = {
  // Crear nuevo usuario con seguridad
  crear: [
    // Agregar logging para debug
    (req, res, next) => {
      console.log('🐛 DEBUG CREAR USUARIO:');
      console.log('Headers:', req.headers);
      console.log('Body original:', req.body);
      console.log('Content-Type:', req.get('Content-Type'));
      next();
    },
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

  // Login compatible (temporal) - Maneja usuarios antiguos y nuevos
  ingresar: [
    // Validaciones más flexibles para compatibilidad
    body('usuario').notEmpty().withMessage('El usuario es requerido'),
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
            let isValidPassword = false;
            
            // Verificar si la contraseña está encriptada (nueva) o en texto plano (antigua)
            if (user.clave.startsWith('$2a$') || user.clave.startsWith('$2b$')) {
              // Contraseña nueva (encriptada con bcrypt)
              isValidPassword = await bcrypt.compare(clave, user.clave);
            } else {
              // Contraseña antigua (texto plano) - solo para compatibilidad temporal
              isValidPassword = (clave === user.clave);
              
              // Opcionalmente, actualizar a versión encriptada
              if (isValidPassword) {
                const hashedPassword = await bcrypt.hash(clave, 12);
                const updateQuery = 'UPDATE usuario SET clave = ? WHERE id = ?';
                db.query(updateQuery, [hashedPassword, user.id], (err) => {
                  if (err) console.error('Error actualizando contraseña:', err);
                  else console.log('Contraseña actualizada a formato seguro para usuario:', usuario);
                });
              }
            }
            
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
            
            // Actualizar fecha de todas las publicaciones del usuario
            const updatePublicacionesQuery = 'UPDATE publicaciones SET fecha = NOW() WHERE usuario = ?';
            db.query(updatePublicacionesQuery, [usuario], (pubErr, pubResult) => {
              if (pubErr) {
                console.error('Error al actualizar fechas de publicaciones:', pubErr);
              } else if (pubResult.affectedRows > 0) {
                console.log(`📅 Actualizadas ${pubResult.affectedRows} publicaciones para ${usuario}`);
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
              token: token,
              requireLocationUpdate: true // Indicar que necesita actualizar ubicación
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

  // Actualizar actividad del usuario en un rubro (NUEVA TABLA usuarios_online)
  actualizarActividad: (req, res) => {
    const { usuario, rubro } = req.body;
    
    console.log('📍 Actualizando actividad (nueva tabla):', { usuario, rubro });
    
    // 🎯 SOLUCIÓN: Un usuario = Un solo registro online
    const updateQuery = `
      INSERT INTO usuarios_online (usuario, rubro_actual, ultima_actividad) 
      VALUES (?, ?, NOW()) 
      ON DUPLICATE KEY UPDATE 
        rubro_actual = VALUES(rubro_actual),
        ultima_actividad = NOW()
    `;
    
    db.query(updateQuery, [usuario, rubro], (err, result) => {
      if (err) {
        console.error('Error al actualizar actividad en nueva tabla:', err);
        return res.status(500).json({ error: 'Error al actualizar actividad' });
      }
      
      console.log('✅ Actividad actualizada en tabla usuarios_online para:', usuario, 'en rubro:', rubro);
      
      // Limpiar sesiones antigas automáticamente (más agresivo: 2 minutos)
      const cleanupQuery = `
        DELETE FROM usuarios_online 
        WHERE ultima_actividad < DATE_SUB(NOW(), INTERVAL 2 MINUTE)
      `;
      
      db.query(cleanupQuery, (cleanupErr) => {
        if (cleanupErr) {
          console.error('Error al limpiar sesiones antiguas:', cleanupErr);
        } else {
          console.log('🧹 Sesiones antiguas limpiadas automáticamente');
        }
      });
      
      // Retornar usuarios activos en este rubro específico
      const selectQuery = `
        SELECT 
          uo.usuario,
          uo.ultima_actividad,
          uo.latitud,
          uo.longitud,
          TIMESTAMPDIFF(SECOND, uo.ultima_actividad, NOW()) as segundos_inactivo
        FROM usuarios_online uo
        WHERE uo.rubro_actual = ? 
        AND uo.ultima_actividad > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
        ORDER BY uo.ultima_actividad DESC
      `;
      
      db.query(selectQuery, [rubro], (err, results) => {
        if (err) {
          console.error('Error al obtener usuarios en línea:', err);
          return res.status(500).json({ error: 'Error al obtener usuarios' });
        }
        
        console.log('📋 Usuarios online en', rubro + ':', results.length);
        res.status(200).json(results);
      });
    });
  },

  // Cerrar sesión y limpiar actividad (NUEVA TABLA)
  cerrarSesion: (req, res) => {
    const { usuario } = req.body;
    
    console.log('🚪 Cerrando sesión para usuario:', usuario);
    
    if (!usuario) {
      return res.status(400).json({ error: 'Usuario requerido' });
    }
    
    // Eliminar de la nueva tabla usuarios_online
    const deleteQuery = 'DELETE FROM usuarios_online WHERE usuario = ?';
    
    db.query(deleteQuery, [usuario], (err, result) => {
      if (err) {
        console.error('Error al cerrar sesión:', err);
        return res.status(500).json({ error: 'Error al cerrar sesión' });
      }
      
      console.log(`✅ Sesión cerrada para ${usuario}, eliminadas ${result.affectedRows} sesiones`);
      
      res.status(200).json({ 
        message: 'Sesión cerrada exitosamente',
        sesiones_eliminadas: result.affectedRows
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

  // Actualizar ubicación automáticamente después del login
  actualizarUbicacionLogin: (req, res) => {
    const { usuario, latitud, longitud } = req.body;
    
    console.log(`📍 Actualizando ubicación post-login para ${usuario}: lat=${latitud}, lng=${longitud}`);
    
    const query = 'UPDATE usuario SET latitud = ?, longitud = ?, fecha_ultima_ubicacion = NOW() WHERE usuario = ?';
    
    db.query(query, [latitud, longitud, usuario], (err, result) => {
      if (err) {
        console.error('Error al actualizar ubicación post-login:', err);
        return res.status(500).json({ error: 'Error al actualizar ubicación' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      console.log(`✅ Ubicación actualizada exitosamente para ${usuario}`);
      res.status(200).json({ 
        message: 'Ubicación actualizada después del login',
        latitud: latitud,
        longitud: longitud,
        timestamp: new Date().toISOString()
      });
    });
  },

  // Obtener usuarios en línea por rubro (NUEVA TABLA usuarios_online)
  obtenerUsuariosEnLinea: (req, res) => {
    const { rubro } = req.params;
    
    console.log('🔍 Obteniendo usuarios online para rubro:', rubro);
    
    // 🧹 Primero limpiar sesiones antiguas automáticamente
    const cleanupQuery = `
      DELETE FROM usuarios_online 
      WHERE ultima_actividad < DATE_SUB(NOW(), INTERVAL 2 MINUTE)
    `;
    
    db.query(cleanupQuery, (cleanupErr, cleanupResult) => {
      if (cleanupErr) {
        console.error('Error al limpiar sesiones antiguas:', cleanupErr);
      } else if (cleanupResult.affectedRows > 0) {
        console.log(`🧹 Limpiadas ${cleanupResult.affectedRows} sesiones antiguas`);
      }
      
      // 🎯 NUEVA QUERY: Usando tabla usuarios_online optimizada
      const query = `
        SELECT DISTINCT 
          uo.usuario, 
          COALESCE(uo.latitud, u.latitud) as latitud,
          COALESCE(uo.longitud, u.longitud) as longitud,
          uo.ultima_actividad,
          TIMESTAMPDIFF(SECOND, uo.ultima_actividad, NOW()) as segundos_inactivo
        FROM usuarios_online uo
        LEFT JOIN usuario u ON uo.usuario = u.usuario
        WHERE uo.rubro_actual = ? 
        AND uo.ultima_actividad > DATE_SUB(NOW(), INTERVAL 2 MINUTE)
        ORDER BY uo.ultima_actividad DESC
      `;
      
      db.query(query, [rubro], (err, results) => {
        if (err) {
          console.error('Error al obtener usuarios online:', err);
          return res.status(500).json({ error: 'Error al obtener usuarios' });
        }
        
        console.log(`📋 Usuarios online en "${rubro}":`, results.length);
        results.forEach(u => {
          console.log(`  ✓ ${u.usuario} (${u.segundos_inactivo}s ago)`);
        });
        
        res.status(200).json(results);
      });
    });
  },

  // DEBUG: Endpoint para revisar todas las sesiones activas
  debugSesiones: (req, res) => {
    console.log('🐛 DEBUG ENDPOINT: Revisando todas las sesiones activas');
    
    const queryTodas = 'SELECT * FROM sesiones_activas ORDER BY ultima_actividad DESC';
    
    db.query(queryTodas, (err, results) => {
      if (err) {
        console.error('Error al obtener sesiones debug:', err);
        return res.status(500).json({ error: 'Error en debug' });
      }
      
      console.log('🔍 TOTAL de sesiones en base de datos:', results.length);
      
      const resumen = results.map(s => ({
        usuario: s.usuario,
        rubro: s.rubro,
        ultima_actividad: s.ultima_actividad,
        segundos_inactivo: Math.floor((Date.now() - new Date(s.ultima_actividad).getTime()) / 1000)
      }));
      
      console.log('📊 Resumen de sesiones:');
      resumen.forEach(s => {
        console.log(`  - ${s.usuario} en ${s.rubro}: ${s.segundos_inactivo}s ago`);
      });
      
      res.status(200).json({
        total_sesiones: results.length,
        sesiones: resumen,
        timestamp: new Date().toISOString()
      });
    });
  },

  // DEBUG: Limpiar sesiones antiguas (más de 10 minutos)
  limpiarSesionesAntiguas: (req, res) => {
    console.log('🧹 Limpiando sesiones antiguas (>10 minutos)...');
    
    const deleteQuery = 'DELETE FROM sesiones_activas WHERE ultima_actividad < DATE_SUB(NOW(), INTERVAL 10 MINUTE)';
    
    db.query(deleteQuery, (err, result) => {
      if (err) {
        console.error('Error al limpiar sesiones:', err);
        return res.status(500).json({ error: 'Error al limpiar sesiones' });
      }
      
      console.log(`✅ Limpieza completada: ${result.affectedRows} sesiones eliminadas`);
      
      // Verificar cuántas quedan
      const countQuery = 'SELECT COUNT(*) as total FROM sesiones_activas';
      db.query(countQuery, (countErr, countResult) => {
        if (countErr) {
          console.error('Error al contar sesiones restantes:', countErr);
        }
        
        const sesionesRestantes = countResult[0].total;
        console.log(`📊 Sesiones restantes: ${sesionesRestantes}`);
        
        res.status(200).json({
          message: 'Limpieza completada',
          sesiones_eliminadas: result.affectedRows,
          sesiones_restantes: sesionesRestantes,
          timestamp: new Date().toISOString()
        });
      });
    });
  },

  // Obtener coordenadas de un usuario específico
  obtenerCoordenadasUsuario: (req, res) => {
    const { usuario } = req.params;
    
    console.log('📍 Obteniendo coordenadas para usuario:', usuario);
    
    const query = `
      SELECT 
        usuario,
        latitud,
        longitud,
        fecha_ultima_ubicacion
      FROM usuario 
      WHERE usuario = ?
    `;
    
    db.query(query, [usuario], (err, results) => {
      if (err) {
        console.error('Error al obtener coordenadas del usuario:', err);
        return res.status(500).json({ error: 'Error al obtener coordenadas' });
      }
      
      if (results.length === 0) {
        console.log('❌ Usuario no encontrado:', usuario);
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      const userData = results[0];
      console.log(`📍 Coordenadas de ${usuario}: lat=${userData.latitud}, lng=${userData.longitud}`);
      
      res.status(200).json({
        usuario: userData.usuario,
        latitud: userData.latitud,
        longitud: userData.longitud,
        fecha_ultima_ubicacion: userData.fecha_ultima_ubicacion
      });
    });
  }
};

module.exports = loginController;
