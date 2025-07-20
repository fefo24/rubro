import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, FlatList, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';

const ConsultarRubrosScreen = ({ navigation }) => {
  const [rubros, setRubros] = useState([]);
  const [rubroSeleccionado, setRubroSeleccionado] = useState('');
  const [publicaciones, setPublicaciones] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarRubros();
  }, []);

  const cargarRubros = async () => {
    try {
      const response = await fetch('http://192.168.1.31:3000/rubros');
      const data = await response.json();
      setRubros(data);
    } catch (error) {
      console.error('Error al cargar rubros:', error);
      Alert.alert('Error', 'No se pudieron cargar los rubros');
    }
  };

  const cargarPublicaciones = async (rubro) => {
    if (!rubro) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://192.168.1.31:3000/publicaciones/rubro/${rubro}`);
      const data = await response.json();
      setPublicaciones(data);
    } catch (error) {
      console.error('Error al cargar publicaciones:', error);
      Alert.alert('Error', 'No se pudieron cargar las publicaciones');
    } finally {
      setLoading(false);
    }
  };

  const renderPublicacion = ({ item }) => (
    <View style={styles.publicacionCard}>
      <Text style={styles.usuario}>👤 {item.usuario}</Text>
      <Text style={styles.publicacionTexto}>{item.publicacion}</Text>
      <Text style={styles.fecha}>📅 {new Date(item.fecha).toLocaleDateString()}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>📚 Consultar Publicaciones</Text>
          <Text style={styles.subtitle}>Descubre lo que otros están compartiendo</Text>
        </View>

        <View style={styles.pickerSection}>
          <Text style={styles.label}>🔍 Selecciona un Rubro</Text>
          <View style={styles.modernPickerContainer}>
            <Picker
              selectedValue={rubroSeleccionado}
              onValueChange={(itemValue) => {
                setRubroSeleccionado(itemValue);
                cargarPublicaciones(itemValue);
              }}
              style={styles.modernPicker}
              itemStyle={styles.modernPickerItem}
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

        <View style={styles.publicacionesSection}>
          {loading ? (
            <View style={styles.centerContent}>
              <Text style={styles.loadingEmoji}>⏳</Text>
              <Text style={styles.loadingText}>Cargando publicaciones...</Text>
            </View>
          ) : publicaciones.length > 0 ? (
            <FlatList
              data={publicaciones}
              renderItem={renderPublicacion}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              scrollEnabled={true}
              contentContainerStyle={styles.listContainer}
            />
          ) : rubroSeleccionado ? (
            <View style={styles.centerContent}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>No hay publicaciones en este rubro</Text>
            </View>
          ) : (
            <View style={styles.centerContent}>
              <Text style={styles.selectEmoji}>🎯</Text>
              <Text style={styles.selectText}>Selecciona un rubro para comenzar</Text>
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
    marginBottom: 40,
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
    fontSize: 18,
    color: '#718096',
    textAlign: 'center',
    fontWeight: '500',
  },
  pickerSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 12,
  },
  modernPickerContainer: {
    backgroundColor: '#f7fafc',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  modernPicker: {
    height: 150,
    backgroundColor: 'transparent',
    marginTop: -15,
  },
  modernPickerItem: {
    fontSize: 18,
    fontWeight: '500',
    color: '#2d3748',
    height: 150,
    textAlign: 'center',
  },
  publicacionesSection: {
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
  publicacionCard: {
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
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
  usuario: {
    fontSize: 14,
    fontWeight: '700',
    color: '#667eea',
    marginBottom: 8,
  },
  publicacionTexto: {
    fontSize: 14,
    color: '#2d3748',
    lineHeight: 20,
    marginBottom: 8,
    fontWeight: '500',
  },
  fecha: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
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
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ConsultarRubrosScreen;
