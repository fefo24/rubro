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
    
    // Usar directamente el texto de la publicación que viene del frontend
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
    
    // Usar alias para que el SELECT devuelva 'contenido' en lugar de 'mensaje'
    const query = 'INSERT INTO mensajes (remitente, destinatario, mensaje, rubro, fecha_envio) VALUES (?, ?, ?, ?, NOW())';
    
    db.query(query, [remitente, destinatario, mensaje, rubro || null], (err, result) => {
      if (err) {
        console.error('❌ Error al enviar mensaje:', err);
        return res.status(500).json({ error: 'Error al enviar mensaje' });
      }
      console.log('✅ Mensaje enviado con ID:', result.insertId);
      res.status(201).json({ message: 'Mensaje enviado', id: result.insertId });
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
    
    // Consulta mejorada que agrupa conversaciones por rubro
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
    
    db.query(query, [usuario, usuario, usuario, usuario, usuario, usuario, usuario, usuario], (err, results) => {
      if (err) {
        console.error('Error al obtener chats activos por rubro:', err);
        return res.status(500).json({ error: 'Error al obtener chats activos' });
      }
      
      console.log(`✅ Encontrados ${results.length} chats activos agrupados por rubro`);
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
    
    console.log('⚡ OPTIMIZADO - Obteniendo chats activos para:', usuario);
    const startTime = Date.now();
    
    // Consulta ULTRA-OPTIMIZADA: separada y más eficiente
    const query = `
      SELECT DISTINCT
        otro_usuario,
        rubro,
        ultimo_mensaje_fecha,
        ultimo_mensaje,
        mensajes_no_leidos
      FROM (
        -- Chats con mensajes (más directo)
        SELECT 
          CASE 
            WHEN m.remitente = ? THEN m.destinatario 
            ELSE m.remitente 
          END as otro_usuario,
          m.rubro,
          MAX(m.fecha_envio) as ultimo_mensaje_fecha,
          (SELECT m2.mensaje FROM mensajes m2 
           WHERE ((m2.remitente = ? AND m2.destinatario = CASE WHEN m.remitente = ? THEN m.destinatario ELSE m.remitente END) 
               OR (m2.remitente = CASE WHEN m.remitente = ? THEN m.destinatario ELSE m.remitente END AND m2.destinatario = ?))
           AND m2.rubro = m.rubro
           ORDER BY m2.fecha_envio DESC LIMIT 1) as ultimo_mensaje,
          (SELECT COUNT(*) FROM mensajes m3 
           WHERE m3.remitente = CASE WHEN m.remitente = ? THEN m.destinatario ELSE m.remitente END
           AND m3.destinatario = ?
           AND m3.rubro = m.rubro
           AND m3.leido = false) as mensajes_no_leidos
        FROM mensajes m
        WHERE (m.remitente = ? OR m.destinatario = ?)
        GROUP BY 
          CASE WHEN m.remitente = ? THEN m.destinatario ELSE m.remitente END,
          m.rubro
        
        UNION
        
        -- Solicitudes aceptadas SIN mensajes aún
        SELECT 
          CASE 
            WHEN s.solicitante = ? THEN s.destinatario 
            ELSE s.solicitante 
          END as otro_usuario,
          s.rubro,
          COALESCE(s.fecha_respuesta, s.fecha_solicitud) as ultimo_mensaje_fecha,
          'Inicia una conversación' as ultimo_mensaje,
          0 as mensajes_no_leidos
        FROM solicitudes_chat s
        WHERE (s.solicitante = ? OR s.destinatario = ?) 
        AND s.estado = 'aceptada'
        AND NOT EXISTS (
          SELECT 1 FROM mensajes m 
          WHERE ((m.remitente = s.solicitante AND m.destinatario = s.destinatario) 
              OR (m.remitente = s.destinatario AND m.destinatario = s.solicitante))
          AND m.rubro = s.rubro
        )
      ) as resultado
      ORDER BY ultimo_mensaje_fecha DESC
    `;
    
    db.query(query, [
      usuario, usuario, usuario, usuario, usuario, // Para mensajes parte 1
      usuario, usuario, usuario, usuario, usuario, // Para mensajes parte 2  
      usuario, usuario, usuario // Para solicitudes
    ], (err, results) => {
      const endTime = Date.now();
      console.log(`⚡ Consulta OPTIMIZADA completada en ${endTime - startTime}ms`);
      
      if (err) {
        console.error('❌ Error al obtener chats activos OPTIMIZADO:', err);
        return res.status(500).json({ error: 'Error al obtener chats activos' });
      }
      
      console.log(`✅ Encontrados ${results.length} chats activos en ${endTime - startTime}ms`);
      res.status(200).json(results);
    });
  },

  // Verificar si ambos usuarios están en línea para chat en vivo (NUEVA TABLA)
  verificarUsuariosEnLinea: (req, res) => {
    const { usuario1, usuario2 } = req.body;
    
    console.log('🔍 Verificando usuarios en línea para chat:', { usuario1, usuario2 });
    
    const query = `
      SELECT usuario, ultima_actividad, rubro_actual as rubro
      FROM usuarios_online
      WHERE usuario IN (?, ?) 
      AND ultima_actividad > DATE_SUB(NOW(), INTERVAL 2 MINUTE)
    `;
    
    db.query(query, [usuario1, usuario2], (err, results) => {
      if (err) {
        console.error('Error al verificar usuarios en línea:', err);
        return res.status(500).json({ error: 'Error al verificar estado' });
      }
      
      const usuario1EnLinea = results.find(u => u.usuario === usuario1);
      const usuario2EnLinea = results.find(u => u.usuario === usuario2);
      
      const ambosEnLinea = usuario1EnLinea && usuario2EnLinea;
      
      console.log('📋 Resultado verificación chat:', {
        ambosEnLinea,
        usuario1EnLinea: !!usuario1EnLinea,
        usuario2EnLinea: !!usuario2EnLinea
      });
      
      res.status(200).json({ 
        ambosEnLinea,
        usuario1EnLinea: !!usuario1EnLinea,
        usuario2EnLinea: !!usuario2EnLinea,
        ultimaActividad: {
          usuario1: usuario1EnLinea?.ultima_actividad || null,
          usuario2: usuario2EnLinea?.ultima_actividad || null
        }
      });
    });
  },

  // Eliminar chat con eliminación real - Solo registro histórico en chats_eliminados
  eliminarChatVista: (req, res) => {
    try {
      console.log('🗑️ ELIMINACIÓN iniciada');
      console.log('📥 Body recibido:', JSON.stringify(req.body, null, 2));
      console.log('📥 Headers:', JSON.stringify(req.headers, null, 2));
      console.log('📥 Content-Type:', req.get('Content-Type'));
      console.log('📥 Raw req.body type:', typeof req.body);
      console.log('📥 Raw req.body:', req.body);
      
      const { usuario, otroUsuario, rubro } = req.body;
      
      console.log('🔍 Extrayendo datos:');
      console.log('  - usuario:', usuario, '(type:', typeof usuario, ')');
      console.log('  - otroUsuario:', otroUsuario, '(type:', typeof otroUsuario, ')');
      console.log('  - rubro:', rubro, '(type:', typeof rubro, ')');
      
      // Validación básica
      if (!usuario || !otroUsuario || !rubro) {
        console.error('❌ Faltan datos requeridos:', { usuario, otroUsuario, rubro });
        return res.status(400).json({ 
          error: 'Faltan datos requeridos',
          required: ['usuario', 'otroUsuario', 'rubro'],
          received: { usuario: !!usuario, otroUsuario: !!otroUsuario, rubro: !!rubro },
          fullBody: req.body
        });
      }

      console.log('✅ Datos validados:', { usuario, otroUsuario, rubro });

      // Paso 1: Copiar TODOS los mensajes a chats_eliminados antes de eliminar
      const queryBackupMensajes = `
        INSERT INTO chats_eliminados (
          remitente, destinatario, mensaje, rubro, fecha_envio, leido,
          eliminado_por, fecha_eliminacion, motivo_eliminacion
        )
        SELECT 
          remitente, destinatario, mensaje, rubro, fecha_envio, leido,
          ? as eliminado_por, 
          NOW() as fecha_eliminacion,
          'Chat eliminado por usuario' as motivo_eliminacion
        FROM mensajes 
        WHERE ((remitente = ? AND destinatario = ?) OR (remitente = ? AND destinatario = ?))
        AND rubro = ?
      `;

      db.query(queryBackupMensajes, [usuario, usuario, otroUsuario, otroUsuario, usuario, rubro], (err1, result1) => {
        if (err1) {
          console.error('❌ Error paso 1 (backup mensajes):', err1);
          return res.status(500).json({ 
            error: 'Error al respaldar mensajes', 
            step: 1,
            details: err1.message 
          });
        }

        console.log(`✅ Paso 1 completado: ${result1.affectedRows} mensajes respaldados en chats_eliminados`);

        // Paso 2: Eliminar mensajes
        const queryMensajes = `
          DELETE FROM mensajes 
          WHERE ((remitente = ? AND destinatario = ?) OR (remitente = ? AND destinatario = ?))
          AND rubro = ?
        `;

        db.query(queryMensajes, [usuario, otroUsuario, otroUsuario, usuario, rubro], (err2, result2) => {
          if (err2) {
            console.error('❌ Error paso 2 (mensajes):', err2);
            return res.status(500).json({ 
              error: 'Error al eliminar mensajes', 
              step: 2,
              details: err2.message 
            });
          }

          console.log(`✅ Paso 2 completado: ${result2.affectedRows} mensajes eliminados`);

          // Paso 3: Eliminar solicitudes
          const querySolicitudes = `
            DELETE FROM solicitudes_chat 
            WHERE ((solicitante = ? AND destinatario = ?) OR (solicitante = ? AND destinatario = ?))
            AND rubro = ?
          `;

          db.query(querySolicitudes, [usuario, otroUsuario, otroUsuario, usuario, rubro], (err3, result3) => {
            if (err3) {
              console.error('❌ Error paso 3 (solicitudes):', err3);
              return res.status(500).json({ 
                error: 'Error al eliminar solicitudes', 
                step: 3,
                details: err3.message 
              });
            }

            console.log(`✅ Paso 3 completado: ${result3.affectedRows} solicitudes eliminadas`);
            console.log('🎉 ELIMINACIÓN COMPLETADA EXITOSAMENTE');

            res.status(200).json({ 
              success: true,
              message: 'Chat eliminado completamente',
              data: {
                mensajes_eliminados: result2.affectedRows,
                solicitudes_eliminadas: result3.affectedRows,
                historico_id: result1.insertId
              }
            });
          });
        });
      });

    } catch (error) {
      console.error('❌ Error general:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: error.message 
      });
    }
  }
};

module.exports = chatController;
