import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, TouchableOpacity, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications } from '../context/NotificationsContext';

const SolicitudesChatScreen = ({ navigation }) => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(false);
  const { verificarSolicitudes } = useNotifications();

  useEffect(() => {
    cargarSolicitudes();
    const interval = setInterval(() => {
      cargarSolicitudes();
      verificarSolicitudes();
    }, 5000); // Cambiar de 3000 a 5000 o más
    return () => clearInterval(interval);
  }, []);

  const cargarSolicitudes = async () => {
    try {
      const usuarioActual = await AsyncStorage.getItem('usuarioActual');
      if (!usuarioActual) return;

      const response = await fetch(`http://192.168.1.31:3000/solicitudes-pendientes/${usuarioActual}`);
      const data = await response.json();
      setSolicitudes(data);
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
    }
  };

  const responderSolicitud = async (solicitudId, respuesta) => {
    try {
      const response = await fetch('http://192.168.1.31:3000/responder-solicitud', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          solicitudId,
          respuesta
        }),
      });

      if (response.ok) {
        const data = await response.json();
        Alert.alert('Éxito', `Solicitud ${respuesta}`);
        
        // Si fue aceptada, abrir el chat
        if (respuesta === 'aceptada') {
          const solicitud = solicitudes.find(s => s.id === solicitudId);
          navigation.navigate('Chat', {
            destinatario: solicitud.solicitante,
            rubro: solicitud.rubro
          });
        }
        
        cargarSolicitudes();
        verificarSolicitudes(); // Actualizar contador en el menú
      } else {
        Alert.alert('Error', 'No se pudo responder la solicitud');
      }
    } catch (error) {
      console.error('Error al responder solicitud:', error);
      Alert.alert('Error', 'Error de conexión');
    }
  };

  const renderSolicitud = ({ item }) => (
    <View style={styles.solicitudCard}>
      <View style={styles.solicitudHeader}>
        <Text style={styles.solicitudIcon}>💬</Text>
        <View style={styles.solicitudInfo}>
          <Text style={styles.solicitudTitle}>Solicitud de Chat</Text>
          <Text style={styles.solicitudText}>
            {item.solicitante} quiere chatear contigo en {item.rubro}
          </Text>
          <Text style={styles.solicitudFecha}>
            {new Date(item.fecha_solicitud).toLocaleString()}
          </Text>
        </View>
      </View>
      
      <View style={styles.botonesContainer}>
        <TouchableOpacity 
          style={styles.botonAceptar}
          onPress={() => responderSolicitud(item.id, 'aceptada')}
        >
          <Text style={styles.botonAceptarText}>✓ Aceptar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.botonRechazar}
          onPress={() => responderSolicitud(item.id, 'rechazada')}
        >
          <Text style={styles.botonRechazarText}>✗ Rechazar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>💬 Solicitudes de Chat</Text>
          <Text style={styles.subtitle}>Solicitudes pendientes de respuesta</Text>
        </View>

        <View style={styles.solicitudesSection}>
          {solicitudes.length > 0 ? (
            <FlatList
              data={solicitudes}
              renderItem={renderSolicitud}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          ) : (
            <View style={styles.centerContent}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>No tienes solicitudes pendientes</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver al Menú</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  contentContainer: {
    flex: 1,
    padding: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2d3748',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    fontWeight: '500',
  },
  solicitudesSection: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 30,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  listContainer: {
    paddingBottom: 16,
  },
  solicitudCard: {
    backgroundColor: '#f7fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  solicitudHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  solicitudIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  solicitudInfo: {
    flex: 1,
  },
  solicitudTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 4,
  },
  solicitudText: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
    lineHeight: 20,
  },
  solicitudFecha: {
    fontSize: 12,
    color: '#a0aec0',
    fontWeight: '500',
  },
  botonesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  botonAceptar: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  botonAceptarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  botonRechazar: {
    flex: 1,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  botonRechazarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#718096',
    fontWeight: '600',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SolicitudesChatScreen;

