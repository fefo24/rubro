import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNotifications } from '../context/NotificationsContext';

const Menu = ({ navigation }) => {
  const { solicitudesPendientes } = useNotifications();

  const handleMirarPublicaciones = () => {
    // Navegar a la pantalla de consultar rubros
    navigation.navigate('ConsultarRubros');
  };

  const handlePublicar = () => {
    // Navegar a la pantalla de publicaciones
    navigation.navigate('Publicaciones');
  };

  const handleCerrarSesion = () => {
    // Cerrar sesión y volver al login
    navigation.navigate('Login');
  };

  const handleSolicitudesChat = () => {
    // Navegar a la pantalla de solicitudes de chat
    navigation.navigate('SolicitudesChat');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.menuContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Bienvenido</Text>
          <Text style={styles.subtitle}>¿Qué deseas hacer hoy?</Text>
        </View>
        
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={[styles.option, styles.optionPrimary]} onPress={handleMirarPublicaciones}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>👀</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.optionTitle}>Mirar Publicaciones</Text>
              <Text style={styles.optionSubtitle}>Explora contenido reciente</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.option, styles.optionSecondary]} onPress={handlePublicar}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>📝</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.optionTitle}>Publicar</Text>
              <Text style={styles.optionSubtitle}>Comparte algo nuevo</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.option, styles.optionTertiary]} onPress={handleSolicitudesChat}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>💬</Text>
              {solicitudesPendientes > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{solicitudesPendientes}</Text>
                </View>
              )}
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.optionTitle}>
                Solicitudes de Chat
                {solicitudesPendientes > 0 && ` (${solicitudesPendientes})`}
              </Text>
              <Text style={styles.optionSubtitle}>Ver solicitudes pendientes</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleCerrarSesion}>
            <Text style={styles.logoutText}>✋ Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 50,
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
  optionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  optionPrimary: {
    backgroundColor: '#667eea',
  },
  optionSecondary: {
    backgroundColor: '#764ba2',
  },
  optionTertiary: {
    backgroundColor: '#f093fb',
  },
  optionQuaternary: {
    backgroundColor: '#38b2ac',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  icon: {
    fontSize: 28,
  },
  textContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#e53e3e',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    alignItems: 'center',
    shadowColor: '#e53e3e',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoutText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#e53e3e',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default Menu;

