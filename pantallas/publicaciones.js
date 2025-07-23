import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert, ScrollView, Keyboard } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CONFIG from '../config/api';

const PublicacionesScreen = ({ navigation }) => {
  const [rubros, setRubros] = useState([]);
  const [rubroSeleccionado, setRubroSeleccionado] = useState('');
  const [nombreRubroSeleccionado, setNombreRubroSeleccionado] = useState('Selecciona un rubro...');
  const [publicacion, setPublicacion] = useState('');
  const [loading, setLoading] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState('');

  useEffect(() => {
    cargarRubros();
    cargarUsuarioActual();
  }, []);

  const cargarUsuarioActual = async () => {
    try {
      const usuario = await AsyncStorage.getItem('usuarioActual');
      if (usuario) {
        setUsuarioActual(usuario);
      }
    } catch (error) {
      console.error('Error al cargar usuario:', error);
    }
  };

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

  const handlePublicar = async () => {
    if (!rubroSeleccionado || !publicacion.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${CONFIG.getApiUrl()}/publicaciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario: usuarioActual, // Usar el usuario guardado
          rubro: rubroSeleccionado,
          publicacion: publicacion
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const message = data.action === 'updated' 
          ? 'Publicación actualizada correctamente'
          : 'Publicación creada correctamente';
          
        Alert.alert('Éxito', message, [
          { text: 'OK', onPress: () => {
            setPublicacion('');
            setRubroSeleccionado('');
          }}
        ]);
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'Error al crear publicación');
      }
    } catch (error) {
      console.error('Error al publicar:', error);
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const seleccionarRubro = (rubro) => {
    setRubroSeleccionado(rubro.rubro);
    setNombreRubroSeleccionado(rubro.rubro);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.contentContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Nueva Publicación</Text>
            <Text style={styles.subtitle}>Comparte algo increíble</Text>
          </View>
          
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>📂 Selecciona un Rubro</Text>
              <View style={styles.iosPickerContainer}>
                <Picker
                  selectedValue={rubroSeleccionado}
                  onValueChange={(itemValue) => {
                    setRubroSeleccionado(itemValue);
                    setNombreRubroSeleccionado(itemValue);
                  }}
                  style={styles.iosPicker}
                  itemStyle={styles.iosPickerItem}
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
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>✍️ Tu Publicación</Text>
              <TextInput
                style={styles.textArea}
                value={publicacion}
                onChangeText={setPublicacion}
                placeholder="¿Qué quieres compartir hoy?"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={200}
                onSubmitEditing={() => Keyboard.dismiss()}
                blurOnSubmit={true}
              />
              <Text style={styles.characterCount}>
                {publicacion.length}/200 caracteres
              </Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.publishButton, loading && styles.publishButtonDisabled]} 
              onPress={handlePublicar}
              disabled={loading}
            >
              <Text style={styles.publishButtonText}>
                {loading ? '📤 Publicando...' : '🚀 Publicar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>← Volver al Menú</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  keyboardView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  headerContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2d3748',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#718096',
    textAlign: 'center',
    fontWeight: '500',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    minHeight: '70%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 12,
  },
  pickerButton: {
    backgroundColor: '#f7fafc',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#2d3748',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#718096',
  },
  textArea: {
    backgroundColor: '#f7fafc',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    padding: 16,
    fontSize: 16,
    color: '#2d3748',
    minHeight: 120,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  characterCount: {
    textAlign: 'right',
    marginTop: 8,
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
  },
  publishButton: {
    backgroundColor: '#667eea',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  publishButtonDisabled: {
    backgroundColor: '#a0aec0',
    shadowOpacity: 0.1,
  },
  publishButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#718096',
  },
  iosPickerContainer: {
    backgroundColor: '#f7fafc',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  iosPicker: {
    height: 180,
    backgroundColor: 'transparent',
  },
  iosPickerItem: {
    fontSize: 18,
    fontWeight: '500',
    color: '#2d3748',
    height: 180,
  },
  wheelPickerContainer: {
    height: 150,
    backgroundColor: '#f7fafc',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  wheelContent: {
    paddingVertical: 0,
  },
  spacer: {
    height: 50,
  },
  wheelItem: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  wheelItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#718096',
    textAlign: 'center',
  },
  wheelItemTextSelected: {
    fontSize: 20,
    fontWeight: '700',
    color: '#667eea',
  },
});



export default PublicacionesScreen;
