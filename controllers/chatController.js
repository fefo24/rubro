const db = require('../db');

const chatController = {
  // Solicitar chat con otro usuario
  solicitarChat: (req, res) => {
    const { solicitante, destinatario, rubro } = req.body;
    
    const query = 'INSERT INTO solicitudes_chat (solicitante, destinatario, rubro, estado, fecha_solicitud) VALUES (?, ?, ?, "pendiente", NOW())';
    
    db.query(query, [solicitante, destinatario, rubro], (err, result) => {
      if (err) {
        console.error('Error al crear solicitud de chat:', err);
        return res.status(500).json({ error: 'Error al enviar solicitud' });
      }
      res.status(201).json({ message: 'Solicitud de chat enviada', id: result.insertId });
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
    
    const query = 'UPDATE solicitudes_chat SET estado = ?, fecha_respuesta = NOW() WHERE id = ?';
    
    db.query(query, [respuesta, solicitudId], (err, result) => {
      if (err) {
        console.error('Error al responder solicitud:', err);
        return res.status(500).json({ error: 'Error al responder solicitud' });
      }
      res.status(200).json({ message: `Solicitud ${respuesta}`, solicitudId, respuesta });
    });
  },

  // Enviar mensaje
  enviarMensaje: (req, res) => {
    const { remitente, destinatario, mensaje, rubro } = req.body;
    
    const query = 'INSERT INTO mensajes (remitente, destinatario, mensaje, rubro, fecha_envio) VALUES (?, ?, ?, ?, NOW())';
    
    db.query(query, [remitente, destinatario, mensaje, rubro], (err, result) => {
      if (err) {
        console.error('Error al enviar mensaje:', err);
        return res.status(500).json({ error: 'Error al enviar mensaje' });
      }
      res.status(201).json({ message: 'Mensaje enviado', id: result.insertId });
    });
  },

  // Obtener mensajes entre dos usuarios
  obtenerMensajes: (req, res) => {
    const { usuario1, usuario2 } = req.params;
    
    const query = `
      SELECT * FROM mensajes 
      WHERE (remitente = ? AND destinatario = ?) 
      OR (remitente = ? AND destinatario = ?)
      ORDER BY fecha_envio ASC
    `;
    
    db.query(query, [usuario1, usuario2, usuario2, usuario1], (err, results) => {
      if (err) {
        console.error('Error al obtener mensajes:', err);
        return res.status(500).json({ error: 'Error al obtener mensajes' });
      }
      res.status(200).json(results);
    });
  }
};

module.exports = chatController;
