// Test simple para verificar la ruta de chat
const express = require('express');
const app = express();

// Ruta de prueba simple
app.get('/chats-activos-rubro/:usuario', (req, res) => {
    console.log('✅ Ruta chat-activos-rubro funcionando');
    console.log('Usuario:', req.params.usuario);
    
    // Respuesta de prueba
    res.json({
        status: 'OK',
        message: 'Ruta funcionando correctamente',
        usuario: req.params.usuario,
        chats: [
            {
                id: 1,
                otro_usuario: 'test@test.com',
                rubro: 'comercial',
                ultimo_mensaje: 'Mensaje de prueba'
            }
        ]
    });
});

app.listen(3001, () => {
    console.log('🔍 Servidor de prueba en puerto 3001');
});

module.exports = app;
