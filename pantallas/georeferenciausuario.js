import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, TouchableOpacity, FlatList, Modal, Linking, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CONFIG from '../config/api';

const GeoreferenciaUsuarioScreen = ({ navigation }) => {
  const [rubros, setRubros] = useState([]);
  const [rubroSeleccionado, setRubroSeleccionado] = useState('');
  const [usuariosEnLinea, setUsuariosEnLinea] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  useEffect(() => {
    cargarRubros();
  }, []);

  const cargarRubros = async () => {
    try {
      const response = await fetch(`${CONFIG.getApiUrl()}/rubros`);
      const data = await response.json();
      setRubros(data);
    } catch (error) {
      console.error('Error al cargar rubros:', error);
      Alert.alert('Error', 'No se pudieron cargar los rubros');
    }
  };

  const cargarUsuariosEnLinea = async (rubro) => {
    if (!rubro) return;
    
    setLoading(true);
    try {
      const usuarioActual = await AsyncStorage.getItem('usuarioActual');
      if (usuarioActual) {
        await fetch(`${CONFIG.getApiUrl()}/actualizar-actividad`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            usuario: usuarioActual,
            rubro: rubro
          }),
        });
      }
      
      const response = await fetch(`${CONFIG.getApiUrl()}/usuarios-en-linea/${rubro}`);
      const data = await response.json();
      setUsuariosEnLinea(data);
    } catch (error) {
      console.error('Error al cargar usuarios en línea:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios en línea');
    } finally {
      setLoading(false);
    }
  };

  const handleUsuarioPress = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setModalVisible(true);
  };

  const handleVerEnMapa = () => {
    setModalVisible(false);
    
    // Usar coordenadas reales del usuario si están disponibles
    const latitude = usuarioSeleccionado.latitud || -33.4489;
    const longitude = usuarioSeleccionado.longitud || -70.6693;
    
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${latitude},${longitude}`;
    const label = `Ubicación de ${usuarioSeleccionado.usuario}`;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });

    Linking.openURL(url).catch(() => {
      const webUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      Linking.openURL(webUrl).catch(() => {
        Alert.alert('Error', 'No se pudo abrir la aplicación de mapas');
      });
    });
  };

  const handleIniciarChat = async () => {
    setModalVisible(false);
    try {
      const usuarioActual = await AsyncStorage.getItem('usuarioActual');
      const response = await fetch(`${CONFIG.getApiUrl()}/solicitar-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          solicitante: usuarioActual,
          destinatario: usuarioSeleccionado.usuario,
          rubro: rubroSeleccionado
        }),
      });

      if (response.ok) {
        Alert.alert('Solicitud Enviada', `Se envió una solicitud de chat a ${usuarioSeleccionado.usuario}`);
      } else {
        Alert.alert('Error', 'No se pudo enviar la solicitud');
      }
    } catch (error) {
      console.error('Error al solicitar chat:', error);
      Alert.alert('Error', 'Error de conexión');
    }
  };

  const renderUsuario = ({ item }) => (
    <TouchableOpacity 
      style={styles.usuarioCard}
      onPress={() => handleUsuarioPress(item)}
    >
      <Text style={styles.usuarioIcon}>👤</Text>
      <Text style={styles.usuarioNombre}>{item.usuario}</Text>
      <View style={styles.statusIndicator}>
        <Text style={styles.statusText}>En línea</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>🌐 Usuarios En Línea</Text>
          <Text style={styles.subtitle}>Conecta con usuarios activos</Text>
        </View>

        <View style={styles.pickerSection}>
          <Text style={styles.label}>🔍 Selecciona un Rubro</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={rubroSeleccionado}
              onValueChange={(itemValue) => {
                setRubroSeleccionado(itemValue);
                cargarUsuariosEnLinea(itemValue);
              }}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {rubros.map((rubro) => (
                <Picker.Item 
                  key={rubro.id}
                  label={rubro.rubro}
                  value={rubro.rubro}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.usuariosSection}>
          {loading ? (
            <View style={styles.centerContent}>
              <Text style={styles.loadingEmoji}>⏳</Text>
              <Text style={styles.loadingText}>Cargando usuarios...</Text>
            </View>
          ) : usuariosEnLinea.length > 0 ? (
            <FlatList
              data={usuariosEnLinea}
              renderItem={renderUsuario}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          ) : rubroSeleccionado ? (
            <View style={styles.centerContent}>
              <Text style={styles.emptyEmoji}>😴</Text>
              <Text style={styles.emptyText}>No hay usuarios conectados en este rubro</Text>
            </View>
          ) : (
            <View style={styles.centerContent}>
              <Text style={styles.selectEmoji}>🎯</Text>
              <Text style={styles.selectText}>Selecciona un rubro para ver usuarios</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver al Menú</Text>
        </TouchableOpacity>

        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                ¿Qué deseas hacer con {usuarioSeleccionado?.usuario}?
              </Text>
              
              <TouchableOpacity style={styles.modalOption} onPress={handleVerEnMapa}>
                <Text style={styles.modalOptionIcon}>📍</Text>
                <Text style={styles.modalOptionText}>Ver en Mapa</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.modalOption} onPress={handleIniciarChat}>
                <Text style={styles.modalOptionIcon}>💬</Text>
                <Text style={styles.modalOptionText}>Iniciar Chat</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalCancelButton} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  pickerSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 12,
  },
  pickerContainer: {
    backgroundColor: '#f7fafc',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  picker: {
    height: 150,
    backgroundColor: 'transparent',
    marginTop: -15,
  },
  pickerItem: {
    fontSize: 18,
    fontWeight: '500',
    color: '#2d3748',
    height: 150,
    textAlign: 'center',
  },
  usuariosSection: {
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
  usuarioCard: {
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  usuarioIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  usuarioNombre: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2d3748',
    flex: 1,
  },
  statusIndicator: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    color: '#718096',
    fontWeight: '600',
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
  selectEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  selectText: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalOptionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    flex: 1,
  },
  modalCancelButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default GeoreferenciaUsuarioScreen;

