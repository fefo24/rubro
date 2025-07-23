// Configuración de la API
const CONFIG = {
  // URL local para desarrollo
  LOCAL_API_URL: 'http://192.168.1.31:3000',
  
  // URL de producción - Backend desplegado en servidor propio
  PRODUCTION_API_URL: 'http://190.113.12.113:3000',
  
  // Función para obtener la URL correcta
  getApiUrl: () => {
    // Si estamos en desarrollo, usar URL local
    if (__DEV__) {
      console.log('🔄 Usando API local');
      return CONFIG.LOCAL_API_URL;
    }
    // En producción, usar servidor propio
    console.log('🚀 Usando API de producción');
    return CONFIG.PRODUCTION_API_URL;
  }
};

export default CONFIG;
