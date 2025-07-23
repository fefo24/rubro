import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import CONFIG from '../config/api';

const IngresarUsuarioClave = ({ navigation }) => {
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');

  // Función para probar la conectividad
  const probarConexion = async () => {
    try {
      console.log('Probando conectividad a:', CONFIG.getApiUrl());
      const response = await fetch(`${CONFIG.getApiUrl()}/`, {
        method: 'GET',
        timeout: 10000, // 10 segundos de timeout
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      const statusText = await response.text();
      console.log('Test de conectividad - Status:', response.status, 'Response:', statusText);
      
      return response.ok;
    } catch (error) {
      console.error('Test de conectividad - Error detallado:', 
        error.name, error.message, 
        error.stack ? error.stack : 'No stack trace'
      );
      return false;
    }
  };

  const handleSubmit = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(usuario)) {
      Alert.alert('Error','Por favor, ingresa un correo electrónico válido.');
      return;
    }
    
    // Probar conectividad primero
    console.log('Verificando conectividad...');
    const conectividad = await probarConexion();
    
    if (!conectividad) {
      Alert.alert(
        'Error de conectividad', 
        'No se puede conectar al servidor. Verifica tu conexión a internet e intenta de nuevo.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      console.log('Intentando conectar a:', CONFIG.getApiUrl());
      console.log('Enviando datos:', { usuario, clave });
      
      const response = await fetch(`${CONFIG.getApiUrl()}/ingresar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario: usuario,
          clave: clave
        }),
      });

      console.log('Status de respuesta:', response.status);
      
      if (!response.ok) {
        console.error('Error HTTP:', response.status, response.statusText);
        Alert.alert('Error de conexión', `Servidor respondió con estado: ${response.status}`);
        return;
      }

      const data = await response.json();
      console.log('Respuesta del servidor:', data);
      if (response.ok) {
        // Obtener ubicación del usuario
        try {
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            let location = await Location.getCurrentPositionAsync({});
            
            // Guardar ubicación en el backend
            await fetch(`${CONFIG.getApiUrl()}/actualizar-ubicacion`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                usuario: usuario,
                latitud: location.coords.latitude,
                longitud: location.coords.longitude
              }),
            });
          }
        } catch (locationError) {
          console.error('Error al obtener ubicación:', locationError);
        }
        
        // Guardar el usuario en AsyncStorage
        await AsyncStorage.setItem('usuarioActual', usuario);
        Alert.alert('Éxito','Login exitoso');
        navigation.navigate('Menu');
      } else {
        alert(data.error || 'Error en el login');
      }
    } catch (error) {
      console.error('Error completo:', error);
      console.error('Tipo de error:', error.name);
      console.error('Mensaje de error:', error.message);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        Alert.alert('Error de conexión', 'No se puede conectar al servidor. Verifica tu conexión a internet.');
      } else if (error.name === 'SyntaxError') {
        Alert.alert('Error', 'Respuesta inválida del servidor');
      } else {
        Alert.alert('Error', `Error de conexión: ${error.message}`);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.loginContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Bienvenido</Text>
            <Text style={styles.subtitle}>Ingresar Usuario y Clave</Text>
          </View>
          
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Correo Electrónico</Text>
              <TextInput
                style={styles.input}
                value={usuario}
                onChangeText={setUsuario}
                placeholder="ejemplo@correo.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                value={clave}
                onChangeText={setClave}
                placeholder="••••••••"
                secureTextEntry
              />
            </View>
            
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Ingresar Sesión</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Registro')}>
              <Text style={styles.registerText}>Registrar Usuario</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardView: {
    flex: 1,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    color: '#1f2937',
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  registerLink: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1.5,
    borderColor: '#3b82f6',
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  registerText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
});

export default IngresarUsuarioClave;



