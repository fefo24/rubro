// Función simplificada para debug de obtenerChatsActivosRubro
const obtenerChatsActivosRubroSimple = (req, res) => {
  const { usuario } = req.params;
  
  console.log('🔍 DEBUG - obtenerChatsActivosRubro llamada para usuario:', usuario);
  
  // Query simplificada para debug
  const querySimple = `
    SELECT DISTINCT
      CASE 
        WHEN m.remitente = ? THEN m.destinatario 
        ELSE m.remitente 
      END as otro_usuario,
      m.rubro,
      m.fecha_envio as ultima_actividad,
      m.mensaje as ultimo_mensaje
    FROM mensajes m 
    WHERE (m.remitente = ? OR m.destinatario = ?) 
    AND m.rubro IS NOT NULL
    ORDER BY m.fecha_envio DESC
    LIMIT 10
  `;
  
  console.log('📝 Query a ejecutar:', querySimple);
  console.log('📋 Parámetros:', [usuario, usuario, usuario]);
  
  db.query(querySimple, [usuario, usuario, usuario], (err, results) => {
    if (err) {
      console.error('❌ Error en consulta SQL:', err);
      return res.status(500).json({ 
        error: 'Error en base de datos',
        details: err.message 
      });
    }
    
    console.log('✅ Resultados obtenidos:', results.length, 'chats');
    console.log('📊 Datos:', JSON.stringify(results, null, 2));
    
    res.json({
      success: true,
      usuario: usuario,
      chats: results,
      total: results.length
    });
  });
};

module.exports = { obtenerChatsActivosRubroSimple };
