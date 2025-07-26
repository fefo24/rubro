const db = require('../db');

const chatController = {
  // Solicitar chat con otro usuario
  solicitarChat: (req, res) => {
    const { solicitante, destinatario, rubro, textoPublicacion } = req.body;
    
    console.log('🔍 DEBUG - Datos recibidos en solicitarChat:', {
      solicitante,
      destinatario, 
      rubro,
      textoPublicacion,
      bodyCompleto: req.body
    });
  },

      console.log(`✅ Chats activos encontrados: ${results.length}`);
      
      res.status(200).json(results);
    });
  },icitud de chat
  crearSolicitud: (req, res) => {
    const { solicitante, destinatario, rubro, textoPublicacion } = req.body;
    
    console.log('🔗 Nueva solicitud de chat:', {
      solicitante, 
      destinatario, 
      rubro,
      textoPublicacion,
      bodyCompleto: req.body
    });

    // Verificar que el texto de la publicación que viene del frontend
    const textoPublicacionFinal = textoPublicacion || null;
    console.log('📝 Texto de publicación a guardar:', textoPublicacionFinal);
    
    // Crear la solicitud con el texto de publicación
    const insertQuery = 'INSERT INTO solicitudes_chat (solicitante, destinatario, rubro, texto_publicacion, estado, fecha_solicitud) VALUES (?, ?, ?, ?, "pendiente", NOW())';
    
    db.query(insertQuery, [solicitante, destinatario, rubro, textoPublicacionFinal], (err, result) => {
      if (err) {
        console.error('Error al crear solicitud de chat:', err);
        return res.status(500).json({ error: 'Error al enviar solicitud' });
      }
      console.log('✅ Solicitud de chat creada con ID:', result.insertId, 'con texto_publicacion:', textoPublicacionFinal);
      
      // NO crear mensaje inicial aquí - solo al aceptar la solicitud
      
      res.status(201).json({ message: 'Solicitud de chat enviada', id: result.insertId });
    });
    
    // Función auxiliar para insertar mensaje inicial directamente
    function insertarMensajeInicialDirecto(solicitante, destinatario, rubro, textoPublicacion) {
      console.log('🔍 DEBUG - Insertando mensaje inicial directo:', {
        solicitante,
        destinatario,
        rubro,
        textoPublicacion: textoPublicacion
      });
      
      let mensajeInicial;
      if (textoPublicacion) {
        mensajeInicial = `📝 Publicación: "${textoPublicacion}"\n\n¡Hola! Te he enviado una solicitud de chat para el rubro "${rubro}". ¡Espero poder conversar contigo!`;
        console.log('✅ Creando mensaje inicial CON texto de publicación');
      } else {
        mensajeInicial = `¡Hola! Te he enviado una solicitud de chat para el rubro "${rubro}". ¡Espero poder conversar contigo!`;
        console.log('⚠️ Creando mensaje inicial SIN texto de publicación');
      }
      
      // Insertar directamente en mensajes sin dependencias
      const insertMensajeQuery = `
        INSERT INTO mensajes (remitente, destinatario, mensaje, fecha_envio) 
        VALUES (?, ?, ?, NOW())
      `;
      
      db.query(insertMensajeQuery, [solicitante, destinatario, mensajeInicial], (err, result) => {
        if (err) {
          console.error('❌ Error al insertar mensaje inicial:', err);
        } else {
          console.log('✅ Mensaje inicial insertado con ID:', result.insertId);
          console.log('📄 Contenido del mensaje:', mensajeInicial);
        }
      });
    }
  },

  // Método de prueba para insertar mensaje con texto de publicación directamente
  pruebaInsertarMensaje: (req, res) => {
    const { remitente, destinatario, rubro, textoPublicacion } = req.body;
    
    console.log('🧪 PRUEBA - Datos recibidos:', {
      remitente, destinatario, rubro, textoPublicacion
    });
    
    let mensajeConPublicacion;
    if (textoPublicacion) {
      mensajeConPublicacion = `📝 Publicación: "${textoPublicacion}"\n\n¡Hola! Te he enviado una solicitud de chat para el rubro "${rubro}". ¡Espero poder conversar contigo!`;
    } else {
      mensajeConPublicacion = `¡Hola! Te he enviado una solicitud de chat para el rubro "${rubro}". ¡Espero poder conversar contigo!`;
    }
    
    const query = 'INSERT INTO mensajes (remitente, destinatario, mensaje, fecha_envio) VALUES (?, ?, ?, NOW())';
    
    db.query(query, [remitente, destinatario, mensajeConPublicacion], (err, result) => {
      if (err) {
        console.error('❌ Error al insertar mensaje de prueba:', err);
        return res.status(500).json({ error: 'Error al insertar mensaje' });
      }
      console.log('✅ Mensaje de prueba insertado con ID:', result.insertId);
      res.status(201).json({ 
        message: 'Mensaje insertado correctamente', 
        id: result.insertId,
        contenido: mensajeConPublicacion
      });
    });
  },

  // Obtener solicitudes pendientes para un usuario
  obtenerSolicitudesPendientes: (req, res) => {
    const { usuario } = req.params;
    
    const query = 'SELECT * FROM solicitudes_chat WHERE destinatario = ? AND estado = "pendiente" ORDER BY fecha_solicitud DESC';
    
    db.query(query, [usuario], (err, results) => {
      if (err) {
        console.error('Error al obtener solicitudes:', err);
        return res.status(500).json({ error: 'Error al obtener solicitudes' });
      }
      res.status(200).json(results);
    });
  },

  // Responder a una solicitud de chat
  responderSolicitud: (req, res) => {
    const { solicitudId, respuesta } = req.body;
    
    console.log('🔍 DEBUG - Respondiendo solicitud:', { solicitudId, respuesta });
    
    // Primero obtener los datos de la solicitud antes de actualizarla
    const getSolicitudQuery = 'SELECT * FROM solicitudes_chat WHERE id = ?';
    
    db.query(getSolicitudQuery, [solicitudId], (err, solicitudes) => {
      if (err) {
        console.error('Error al obtener solicitud:', err);
        return res.status(500).json({ error: 'Error al obtener solicitud' });
      }
      
      if (solicitudes.length === 0) {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }
      
      const solicitud = solicitudes[0];
      console.log('📄 Datos de la solicitud:', solicitud);
      
      // Actualizar el estado de la solicitud
      const updateQuery = 'UPDATE solicitudes_chat SET estado = ?, fecha_respuesta = NOW() WHERE id = ?';
      
      db.query(updateQuery, [respuesta, solicitudId], (err, result) => {
        if (err) {
          console.error('Error al responder solicitud:', err);
          return res.status(500).json({ error: 'Error al responder solicitud' });
        }
        
        console.log(`✅ Solicitud ${solicitudId} ${respuesta} exitosamente`);
        
        // Si la respuesta es "aceptada", insertar el mensaje inicial con la publicación
        if (respuesta === 'aceptada') {
          insertarMensajeAlAceptar(solicitud.solicitante, solicitud.destinatario, solicitud.rubro, solicitud.texto_publicacion);
        }
        
        res.status(200).json({ 
          message: `Solicitud ${respuesta}`, 
          solicitudId, 
          respuesta
        });
      });
    });
    
    // Función auxiliar para insertar mensaje cuando se acepta la solicitud
    function insertarMensajeAlAceptar(solicitante, destinatario, rubro, textoPublicacion) {
      console.log('🎉 ACEPTANDO SOLICITUD - Insertando mensaje inicial:', {
        solicitante,
        destinatario,
        rubro,
        textoPublicacion: textoPublicacion
      });
      
      let mensajeInicial;
      if (textoPublicacion) {
        mensajeInicial = `Publicacion (${rubro}): "${textoPublicacion}"\n\nHola! He aceptado tu solicitud de chat para mi publicacion de "${rubro}". Conversemos sobre este servicio!`;
        console.log('✅ Creando mensaje inicial CON texto de publicación al aceptar');
      } else {
        mensajeInicial = `Hola! He aceptado tu solicitud de chat para el rubro "${rubro}". Conversemos!`;
        console.log('⚠️ Creando mensaje inicial SIN texto de publicación al aceptar');
      }
      
      // Insertar mensaje desde el destinatario (quien acepta) hacia el solicitante
      // Incluir el rubro para poder filtrar después
      const insertMensajeQuery = `
        INSERT INTO mensajes (remitente, destinatario, mensaje, rubro, fecha_envio) 
        VALUES (?, ?, ?, ?, NOW())
      `;
      
      db.query(insertMensajeQuery, [destinatario, solicitante, mensajeInicial, rubro], (err, result) => {
        if (err) {
          console.error('❌ Error al insertar mensaje al aceptar:', err);
        } else {
          console.log('✅ Mensaje de aceptación insertado con ID:', result.insertId);
          console.log('📄 Contenido del mensaje de aceptación:', mensajeInicial);
        }
      });
    }
  },

  // Enviar mensaje
  enviarMensaje: (req, res) => {
    const { remitente, destinatario, mensaje, rubro } = req.body;
    
    console.log('📤 Recibiendo mensaje:', { remitente, destinatario, mensaje, rubro });
    
    if (!remitente || !destinatario || !mensaje) {
      return res.status(400).json({ error: 'Faltan datos obligatorios: remitente, destinatario, mensaje' });
    }
    
    // SIMPLIFICADO: Verificar si el chat fue eliminado anteriormente
    const verificarEliminacionQuery = `
      SELECT COUNT(*) as eliminado 
      FROM chats_eliminados 
      WHERE usuario = ? AND otro_usuario = ? AND rubro = ?
    `;
    
    db.query(verificarEliminacionQuery, [remitente, destinatario, rubro], (err, results) => {
      if (err) {
        console.error('❌ Error al verificar chat eliminado:', err);
        return res.status(500).json({ error: 'Error al verificar estado del chat' });
      }
      
      const chatEliminado = results[0].eliminado > 0;
      console.log('🔍 Chat eliminado previamente por este usuario:', chatEliminado);
      
      if (chatEliminado) {
        // Si el chat fue eliminado, crear una nueva solicitud en lugar de enviar mensaje directo
        console.log('⚠️ Chat eliminado detectado, creando solicitud en lugar de mensaje directo');
        
        // Extraer el texto de la publicación del mensaje (si viene en el formato esperado)
        let textoPublicacion = null;
        const match = mensaje.match(/Publicacion \([^)]+\): "([^"]+)"/);
        if (match) {
          textoPublicacion = match[1];
        }
        
        const insertSolicitudQuery = 'INSERT INTO solicitudes_chat (solicitante, destinatario, rubro, texto_publicacion, estado, fecha_solicitud) VALUES (?, ?, ?, ?, "pendiente", NOW())';
        
        db.query(insertSolicitudQuery, [remitente, destinatario, rubro, textoPublicacion], (err, result) => {
          if (err) {
            console.error('❌ Error al crear solicitud de chat:', err);
            return res.status(500).json({ error: 'Error al enviar solicitud' });
          }
          console.log('✅ Solicitud de chat creada con ID:', result.insertId);
          res.status(201).json({ 
            message: 'Se ha enviado una solicitud de chat. El destinatario debe aceptarla para iniciar la conversación.',
            type: 'solicitud_creada',
            id: result.insertId 
          });
        });
      } else {
        // Si no fue eliminado, enviar mensaje normalmente
        console.log('✅ Chat no eliminado, enviando mensaje directo');
        
        const query = 'INSERT INTO mensajes (remitente, destinatario, mensaje, rubro, fecha_envio) VALUES (?, ?, ?, ?, NOW())';
        
        db.query(query, [remitente, destinatario, mensaje, rubro || null], (err, result) => {
          if (err) {
            console.error('❌ Error al enviar mensaje:', err);
            return res.status(500).json({ error: 'Error al enviar mensaje' });
          }
          console.log('✅ Mensaje enviado con ID:', result.insertId);
          res.status(201).json({ 
            message: 'Mensaje enviado', 
            type: 'mensaje_enviado',
            id: result.insertId 
          });
        });
      }
    });
  },

  // Obtener mensajes entre dos usuarios
  obtenerMensajes: (req, res) => {
    const { usuario1, usuario2 } = req.params;
    
    console.log('📨 Obteniendo mensajes entre:', usuario1, 'y', usuario2);
    
    // Usar alias para devolver 'contenido' y 'fecha'
    const query = `
      SELECT id, remitente, destinatario, mensaje as contenido, fecha_envio as fecha, leido 
      FROM mensajes 
      WHERE (remitente = ? AND destinatario = ?) 
      OR (remitente = ? AND destinatario = ?)
      ORDER BY fecha_envio ASC
    `;
    
    db.query(query, [usuario1, usuario2, usuario2, usuario1], (err, results) => {
      if (err) {
        console.error('❌ Error al obtener mensajes:', err);
        return res.status(500).json({ error: 'Error al obtener mensajes' });
      }
      console.log(`✅ Encontrados ${results.length} mensajes`);
      res.status(200).json(results);
    });
  },

  // Obtener notificaciones de chat para un usuario
  obtenerNotificacionesChat: (req, res) => {
    const { usuario } = req.params;
    
    const query = `
      SELECT * FROM notificaciones_chat 
      WHERE usuario_destino = ? 
      ORDER BY fecha_creacion DESC
    `;
    
    db.query(query, [usuario], (err, results) => {
      if (err) {
        console.error('Error al obtener notificaciones:', err);
        return res.status(500).json({ error: 'Error al obtener notificaciones' });
      }
      res.status(200).json(results);
    });
  },

  // Marcar notificación como leída
  marcarNotificacionLeida: (req, res) => {
    const { notificacionId } = req.body;
    
    const query = 'UPDATE notificaciones_chat SET leida = true WHERE id = ?';
    
    db.query(query, [notificacionId], (err, result) => {
      if (err) {
        console.error('Error al marcar notificación:', err);
        return res.status(500).json({ error: 'Error al marcar notificación' });
      }
      res.status(200).json({ message: 'Notificación marcada como leída' });
    });
  },

  // Obtener chats activos agrupados por rubro para usuarios con múltiples publicaciones
  obtenerChatsActivosRubro: (req, res) => {
    const { usuario } = req.params;
    
    console.log(`📊 Obteniendo chats activos para usuario: ${usuario}`);
    
    // Consulta base sin exclusión de eliminados primero (para debugging)
    const query = `
      SELECT 
        chats_unidos.otro_usuario,
        chats_unidos.rubro,
        MAX(chats_unidos.ultima_actividad) as ultimo_mensaje_fecha,
        (SELECT mensaje FROM mensajes m2 
         WHERE ((m2.remitente = ? AND m2.destinatario = chats_unidos.otro_usuario) 
             OR (m2.remitente = chats_unidos.otro_usuario AND m2.destinatario = ?))
         AND m2.rubro = chats_unidos.rubro
         ORDER BY m2.fecha_envio DESC LIMIT 1) as ultimo_mensaje,
        (SELECT COUNT(*) FROM mensajes m3 
         WHERE m3.remitente = chats_unidos.otro_usuario 
         AND m3.destinatario = ? 
         AND m3.rubro = chats_unidos.rubro
         AND m3.leido = false) as mensajes_no_leidos
      FROM (
        -- Mensajes existentes con rubro específico
        SELECT 
          CASE 
            WHEN remitente = ? THEN destinatario 
            ELSE remitente 
          END as otro_usuario,
          rubro,
          fecha_envio as ultima_actividad
        FROM mensajes 
        WHERE (remitente = ? OR destinatario = ?) AND rubro IS NOT NULL
        
        UNION
        
        -- Solicitudes aceptadas donde el usuario es solicitante
        SELECT 
          destinatario as otro_usuario,
          rubro,
          COALESCE(fecha_respuesta, fecha_solicitud) as ultima_actividad
        FROM solicitudes_chat 
        WHERE solicitante = ? AND estado = 'aceptada'
        
        UNION
        
        -- Solicitudes aceptadas donde el usuario es destinatario
        SELECT 
          solicitante as otro_usuario,
          rubro,
          COALESCE(fecha_respuesta, fecha_solicitud) as ultima_actividad
        FROM solicitudes_chat 
        WHERE destinatario = ? AND estado = 'aceptada'
      ) as chats_unidos
      WHERE chats_unidos.rubro IS NOT NULL
      GROUP BY chats_unidos.otro_usuario, chats_unidos.rubro
      ORDER BY ultimo_mensaje_fecha DESC
    `;
    
    console.log('🔍 Ejecutando consulta simplificada (eliminación real)...');
    
    db.query(query, [usuario, usuario, usuario, usuario, usuario, usuario, usuario, usuario], (err, results) => {
      if (err) {
        console.error('❌ Error en consulta base:', err);
        return res.status(500).json({ error: 'Error al obtener chats activos' });
      }
      
      console.log(`✅ Chats activos encontrados: ${results.length}`);
      
      res.status(200).json(results);


        
        console.log(`�️ Chats eliminados encontrados: ${eliminados.length}`);
        
        // Filtrar manualmente los chats eliminados
        const chatsFiltrados = allResults.filter(chat => {
        console.log(`✅ Chats activos encontrados: ${results.length}`);
        res.status(200).json(results);
      });
  },

  // Obtener mensajes entre dos usuarios para un rubro específico
  obtenerMensajesRubro: (req, res) => {
    const { usuario1, usuario2, rubro } = req.params;
    
    console.log('📨 Obteniendo mensajes entre:', usuario1, 'y', usuario2, 'para rubro:', rubro);
    
    // Consulta que filtra por rubro específico
    const query = `
      SELECT id, remitente, destinatario, mensaje as contenido, fecha_envio as fecha, leido, rubro
      FROM mensajes 
      WHERE ((remitente = ? AND destinatario = ?) 
      OR (remitente = ? AND destinatario = ?))
      AND (rubro = ? OR rubro IS NULL)
      ORDER BY fecha_envio ASC
    `;
    
    db.query(query, [usuario1, usuario2, usuario2, usuario1, rubro], (err, results) => {
      if (err) {
        console.error('❌ Error al obtener mensajes por rubro:', err);
        return res.status(500).json({ error: 'Error al obtener mensajes' });
      }
      console.log(`✅ Encontrados ${results.length} mensajes para rubro ${rubro}`);
      res.status(200).json(results);
    });
  },

  // Obtener chats activos para un usuario
  obtenerChatsActivos: (req, res) => {
    const { usuario } = req.params;
    
    // Consulta mejorada que incluye tanto mensajes como solicitudes aceptadas
    const query = `
      SELECT DISTINCT
        otro_usuario,
        MAX(ultima_actividad) as ultimo_mensaje_fecha,
        (SELECT mensaje FROM mensajes m2 
         WHERE ((m2.remitente = ? AND m2.destinatario = otro_usuario) 
             OR (m2.remitente = otro_usuario AND m2.destinatario = ?))
         ORDER BY m2.fecha_envio DESC LIMIT 1) as ultimo_mensaje,
        (SELECT COUNT(*) FROM mensajes m3 
         WHERE m3.remitente = otro_usuario 
         AND m3.destinatario = ? 
         AND m3.leido = false) as mensajes_no_leidos
      FROM (
        -- Mensajes existentes
        SELECT 
          CASE 
            WHEN remitente = ? THEN destinatario 
            ELSE remitente 
          END as otro_usuario,
          fecha_envio as ultima_actividad
        FROM mensajes 
        WHERE remitente = ? OR destinatario = ?
        
        UNION
        
        -- Solicitudes aceptadas donde el usuario es solicitante
        SELECT 
          destinatario as otro_usuario,
          COALESCE(fecha_respuesta, fecha_solicitud) as ultima_actividad
        FROM solicitudes_chat 
        WHERE solicitante = ? AND estado = 'aceptada'
        
        UNION
        
        -- Solicitudes aceptadas donde el usuario es destinatario
        SELECT 
          solicitante as otro_usuario,
          COALESCE(fecha_respuesta, fecha_solicitud) as ultima_actividad
        FROM solicitudes_chat 
        WHERE destinatario = ? AND estado = 'aceptada'
      ) as chats_unidos
      GROUP BY otro_usuario
      ORDER BY ultimo_mensaje_fecha DESC
    `;
    
    db.query(query, [usuario, usuario, usuario, usuario, usuario, usuario, usuario, usuario], (err, results) => {
      if (err) {
        console.error('Error al obtener chats activos:', err);
        return res.status(500).json({ error: 'Error al obtener chats activos' });
      }
      
      console.log(`✅ Encontrados ${results.length} chats activos (incluyendo solicitudes aceptadas)`);
      res.status(200).json(results);
    });
  },

  // Eliminar chat de la vista del usuario (con eliminación real de mensajes y solicitudes)
  eliminarChatVista: (req, res) => {
    const { usuario, otroUsuario, rubro } = req.body;
    
    console.log('🗑️ Eliminando chat COMPLETAMENTE entre:', usuario, 'y', otroUsuario, 'rubro:', rubro);
    
    if (!usuario || !otroUsuario || !rubro) {
      return res.status(400).json({ error: 'Faltan datos obligatorios: usuario, otroUsuario, rubro' });
    }
    
    // La tabla ya debe existir, pero verificar por seguridad
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS chats_eliminados (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario VARCHAR(255) NOT NULL,
        otro_usuario VARCHAR(255) NOT NULL,
        rubro VARCHAR(255) NOT NULL,
        eliminado_por VARCHAR(255) NOT NULL,
        fecha_eliminacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_chat_lookup (usuario, otro_usuario, rubro),
        INDEX idx_eliminado_por (eliminado_por)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    db.query(createTableQuery, (err) => {
      if (err) {
        console.error('❌ Error al crear tabla chats_eliminados:', err);
        return res.status(500).json({ error: 'Error al preparar eliminación' });
      }
      
      // PASO 1: Registrar la eliminación en chats_eliminados (solo un registro del que eliminó)
      const insertEliminacionQuery = `
        INSERT INTO chats_eliminados (usuario, otro_usuario, rubro, eliminado_por) 
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          fecha_eliminacion = CURRENT_TIMESTAMP,
          eliminado_por = VALUES(eliminado_por)
      `;
      
      db.query(insertEliminacionQuery, [usuario, otroUsuario, rubro, usuario], (err, result) => {
        if (err) {
          console.error('❌ Error al registrar eliminación:', err);
          return res.status(500).json({ error: 'Error al registrar eliminación' });
        }
        
        console.log(`✅ Eliminación registrada en historial por ${usuario}`);
        
        // PASO 2: Eliminar TODOS los mensajes entre estos usuarios para este rubro
        const deleteMensajesQuery = `
          DELETE FROM mensajes 
          WHERE ((remitente = ? AND destinatario = ?) OR (remitente = ? AND destinatario = ?))
          AND rubro = ?
        `;
        
        db.query(deleteMensajesQuery, [usuario, otroUsuario, otroUsuario, usuario, rubro], (err, result) => {
          if (err) {
            console.error('❌ Error al eliminar mensajes:', err);
            return res.status(500).json({ error: 'Error al eliminar mensajes' });
          }
          
          console.log(`✅ Eliminados ${result.affectedRows} mensajes entre ${usuario} y ${otroUsuario} para rubro ${rubro}`);
          
          // PASO 3: Eliminar TODAS las solicitudes entre estos usuarios para este rubro
          const deleteSolicitudesQuery = `
            DELETE FROM solicitudes_chat 
            WHERE ((solicitante = ? AND destinatario = ?) OR (solicitante = ? AND destinatario = ?))
            AND rubro = ?
          `;
          
          db.query(deleteSolicitudesQuery, [usuario, otroUsuario, otroUsuario, usuario, rubro], (err, result) => {
            if (err) {
              console.error('❌ Error al eliminar solicitudes:', err);
              return res.status(500).json({ error: 'Error al eliminar solicitudes' });
            }
            
            console.log(`✅ Eliminadas ${result.affectedRows} solicitudes entre ${usuario} y ${otroUsuario} para rubro ${rubro}`);
            
            res.status(200).json({ 
              message: `Chat eliminado completamente. Se han borrado todos los mensajes y solicitudes entre ${usuario} y ${otroUsuario} para el rubro ${rubro}. Solo queda el registro histórico de la eliminación.`
            });
          });
        });
      });
    });
  },

  // Verificar si ambos usuarios están en línea para chat en vivo
  verificarUsuariosEnLinea: (req, res) => {
    const { usuario1, usuario2 } = req.body;
    
    const query = `
      SELECT usuario, ultimo_ping, rubro
      FROM actividad_usuarios 
      WHERE usuario IN (?, ?) 
      AND ultimo_ping > DATE_SUB(NOW(), INTERVAL 2 MINUTE)
    `;
    
    db.query(query, [usuario1, usuario2], (err, results) => {
      if (err) {
        console.error('Error al verificar usuarios en línea:', err);
        return res.status(500).json({ error: 'Error al verificar estado' });
      }
      
      const usuario1EnLinea = results.find(u => u.usuario === usuario1);
      const usuario2EnLinea = results.find(u => u.usuario === usuario2);
      
      const ambosEnLinea = usuario1EnLinea && usuario2EnLinea;
      
      res.status(200).json({ 
        ambosEnLinea,
        usuario1EnLinea: !!usuario1EnLinea,
        usuario2EnLinea: !!usuario2EnLinea,
        ultimaActividad: {
          usuario1: usuario1EnLinea?.ultimo_ping || null,
          usuario2: usuario2EnLinea?.ultimo_ping || null
        }
      });
    });
  },

  // Eliminar chat para un usuario específico (sin afectar al otro usuario)
  eliminarChat: (req, res) => {
    const { usuario, otroUsuario, rubro } = req.body;
    
    console.log('🗑️ Eliminando chat para:', { usuario, otroUsuario, rubro });
    
    if (!usuario || !otroUsuario || !rubro) {
      return res.status(400).json({ error: 'Faltan datos obligatorios: usuario, otroUsuario, rubro' });
    }
    
    // Crear una tabla para rastrear chats eliminados por usuario
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS chats_eliminados (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario VARCHAR(255) NOT NULL,
        otro_usuario VARCHAR(255) NOT NULL,
        rubro VARCHAR(255) NOT NULL,
        fecha_eliminacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_usuario_chat (usuario, otro_usuario, rubro)
      )
    `;
    
    db.query(createTableQuery, (err) => {
      if (err) {
        console.error('Error al crear tabla chats_eliminados:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }
      
      // Insertar registro de chat eliminado para este usuario
      const insertQuery = `
        INSERT INTO chats_eliminados (usuario, otro_usuario, rubro) 
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE fecha_eliminacion = CURRENT_TIMESTAMP
      `;
      
      db.query(insertQuery, [usuario, otroUsuario, rubro], (err, result) => {
        if (err) {
          console.error('Error al eliminar chat:', err);
          return res.status(500).json({ error: 'Error al eliminar chat' });
        }
        
        console.log('✅ Chat eliminado para usuario:', usuario);
        res.status(200).json({ message: 'Chat eliminado correctamente' });
      });
    });
  }
};

module.exports = chatController;
