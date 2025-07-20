import { registerRootComponent } from 'expo';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { NotificationsProvider } from './context/NotificationsContext';

import IngresarUsuarioClave from './pantallas/login';
import RegistrarUsuario from './pantallas/rglogin';
import Menu from './pantallas/menu';
import PublicacionesScreen from './pantallas/publicaciones';
import ConsultarRubrosScreen from './pantallas/consultarubros';
import GeoreferenciaUsuarioScreen from './pantallas/georeferenciausuario';
import SolicitudesChatScreen from './pantallas/solicitudeschat';
import ChatScreen from './pantallas/chat';

const Stack = createStackNavigator();

function App() {
  return (
    <NotificationsProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen 
            name="Login" 
            component={IngresarUsuarioClave}
            options={{ title: 'Iniciar Sesión' }} 
          />
          <Stack.Screen 
            name="Registro" 
            component={RegistrarUsuario}
            options={{ 
              title: 'Registro',
              headerLeft: null
            }} 
          />
          <Stack.Screen 
            name="Menu" 
            component={Menu}
            options={{ 
              title: 'Menú Principal',
               headerShown: false,
              headerLeft: null,
              gestureEnabled: false
            }} 
          />
          <Stack.Screen 
            name="Publicaciones" 
            component={PublicacionesScreen}
            options={{ 
              title: 'Nueva Publicación',
              headerShown: false,
              gestureEnabled: false
            }} 
          />
          <Stack.Screen 
            name="ConsultarRubros" 
            component={ConsultarRubrosScreen}
            options={{ 
              title: 'Consultar Publicaciones',
              headerShown: false,
              gestureEnabled: false
            }} 
          />
          <Stack.Screen 
            name="GeoreferenciaUsuarios" 
            component={GeoreferenciaUsuarioScreen}
            options={{ 
              title: 'Usuarios En Línea',
              headerShown: false,
              gestureEnabled: false
            }} 
          />
          <Stack.Screen 
            name="SolicitudesChat" 
            component={SolicitudesChatScreen}
            options={{ 
              title: 'Solicitudes de Chat',
              headerShown: false,
              gestureEnabled: false
            }} 
          />
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen}
            options={{ 
              title: 'Chat',
              headerShown: false,
              gestureEnabled: false
            }} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    </NotificationsProvider>
  );
}

export default App;
registerRootComponent(App);