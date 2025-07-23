import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert, Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CONFIG from '../config/api';

const NotificationsContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    console.warn('useNotifications called outside of NotificationsProvider');
    return { solicitudesPendientes: 0, verificarSolicitudes: () => {}, playNotificationSound: () => {} };
  }
  return context;
};

export const NotificationsProvider = ({ children }) => {
  const [solicitudesPendientes, setSolicitudesPendientes] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Función para reproducir notificación simple
  const playNotificationSound = async () => {
    try {
      // Vibrar el dispositivo
      Vibration.vibrate([0, 300, 100, 300]);
      
      // Mostrar alerta
      Alert.alert(
        '🔔 Nueva Solicitud',
        'Tienes una nueva solicitud de chat pendiente',
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error) {
      console.log('Error playing notification:', error);
    }
  };

  // Verificar solicitudes pendientes
  const verificarSolicitudes = async () => {
    try {
      const usuarioActual = await AsyncStorage.getItem('usuarioActual');
      if (!usuarioActual) {
        console.log('No hay usuario actual');
        return;
      }

      console.log('Verificando solicitudes para:', usuarioActual);
      const response = await fetch(`${CONFIG.getApiUrl()}/solicitudes-pendientes/${usuarioActual}`);
      
      if (!response.ok) {
        console.log('Error en response:', response.status);
        return;
      }
      
      const data = await response.json();
      const nuevasCantidad = data.length;
      
      console.log('Solicitudes encontradas:', nuevasCantidad);
      
      // Si hay más solicitudes que antes y ya está inicializado, reproducir notificación
      if (isInitialized && nuevasCantidad > solicitudesPendientes) {
        playNotificationSound();
      }
      
      setSolicitudesPendientes(nuevasCantidad);
      
      // Marcar como inicializado después de la primera carga
      if (!isInitialized) {
        setIsInitialized(true);
      }
    } catch (error) {
      console.error('Error al verificar solicitudes:', error);
    }
  };

  // Polling cada 5 segundos
  useEffect(() => {
    verificarSolicitudes(); // Cargar inicial
    const interval = setInterval(verificarSolicitudes, 5000);
    return () => clearInterval(interval);
  }, []);

  const value = {
    solicitudesPendientes,
    verificarSolicitudes,
    playNotificationSound
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};
