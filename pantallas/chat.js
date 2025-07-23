import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CONFIG from '../config/api';

const ChatScreen = ({ navigation, route }) => {
  const { destinatario, rubro } = route.params;
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [usuarioActual, setUsuarioActual] = useState('');
  const [sesionIniciada, setSesionIniciada] = useState(null); // Timestamp de cuando se abrió el chat

  useEffect(() => {
    cargarUsuarioActual();
    // Marcar el momento en que se abre la sesión de chat
    const ahora = new Date().toISOString();
    setSesionIniciada(ahora);
    
    // Solo cargar mensajes después de establecer la sesión
    const timer = setTimeout(() => {
      cargarMensajes();
    }, 100);
    
    const interval = setInterval(cargarMensajes, 2000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const cargarUsuarioActual = async () => {
    const usuario = await AsyncStorage.getItem('usuarioActual');
    setUsuarioActual(usuario);
  };

  const cargarMensajes = async () => {
    try {
      const usuario = await AsyncStorage.getItem('usuarioActual');
      const response = await fetch(`http://192.168.1.31:3000/mensajes/${usuario}/${destinatario}`);
      const data = await response.json();
      
      // Solo mostrar mensajes enviados después de abrir esta sesión de chat
      if (sesionIniciada) {
        const mensajesNuevos = data.filter(mensaje => 
          new Date(mensaje.fecha_envio) >= new Date(sesionIniciada)
        );
        setMensajes(mensajesNuevos);
      }
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    }
  };

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim()) return;

    try {
      const response = await fetch(`${CONFIG.getApiUrl()}/enviar-mensaje`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          remitente: usuarioActual,
          destinatario: destinatario,
          mensaje: nuevoMensaje,
          rubro: rubro
        }),
      });

      if (response.ok) {
        setNuevoMensaje('');
        cargarMensajes();
      }
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  };

  const renderMensaje = ({ item }) => {
    const esMio = item.remitente === usuarioActual;
    return (
      <View style={[styles.mensajeContainer, esMio ? styles.mensajeMio : styles.mensajeOtro]}>
        <Text style={[styles.mensajeTexto, esMio ? styles.mensajeTextoMio : styles.mensajeTextoOtro]}>
          {item.mensaje}
        </Text>
        <Text style={[styles.mensajeFecha, esMio ? styles.mensajeFechaMio : styles.mensajeFechaOtro]}>
          {new Date(item.fecha_envio).toLocaleTimeString()}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← </Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat con {destinatario}</Text>
        <Text style={styles.headerSubtitle}>Nueva conversación</Text>
      </View>

      {mensajes.length === 0 ? (
        <View style={styles.emptyChatContainer}>
          <Text style={styles.emptyChatEmoji}>💬</Text>
          <Text style={styles.emptyChatText}>Inicia una nueva conversación</Text>
          <Text style={styles.emptyChatSubtext}>Los mensajes aparecerán aquí</Text>
        </View>
      ) : (
        <FlatList
          data={mensajes}
          renderItem={renderMensaje}
          keyExtractor={(item) => item.id.toString()}
          style={styles.mensajesList}
          contentContainerStyle={styles.mensajesContent}
        />
      )}

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.textInput}
          value={nuevoMensaje}
          onChangeText={setNuevoMensaje}
          placeholder="Escribe un mensaje..."
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={enviarMensaje}>
          <Text style={styles.sendButtonText}>Enviar</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  header: {
    backgroundColor: '#3b82f6',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 16,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  mensajesList: {
    flex: 1,
    padding: 16,
  },
  mensajesContent: {
    paddingBottom: 16,
  },
  mensajeContainer: {
    marginBottom: 12,
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  mensajeMio: {
    alignSelf: 'flex-end',
    backgroundColor: '#3b82f6',
  },
  mensajeOtro: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  mensajeTexto: {
    fontSize: 16,
    marginBottom: 4,
  },
  mensajeTextoMio: {
    color: '#ffffff',
  },
  mensajeTextoOtro: {
    color: '#2d3748',
  },
  mensajeFecha: {
    fontSize: 12,
    opacity: 0.7,
  },
  mensajeFechaMio: {
    color: '#ffffff',
  },
  mensajeFechaOtro: {
    color: '#718096',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sendButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  emptyChatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyChatEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyChatText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyChatSubtext: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
});

export default ChatScreen;
