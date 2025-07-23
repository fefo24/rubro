// Script para actualizar todas las URLs de la API en las pantallas
const fs = require('fs');
const path = require('path');

const pantallasDir = 'c:\\proyecto-app\\backend\\app-movil\\pantallas';
const oldUrl = 'http://192.168.1.31:3000';
const configImport = "import CONFIG from '../config/api';";

// Lista de archivos a actualizar
const archivos = [
  'rglogin.js',
  'publicaciones.js', 
  'consultarubros.js',
  'chat.js',
  'solicitudeschat.js',
  'georeferenciausuario.js'
];

archivos.forEach(archivo => {
  const rutaArchivo = path.join(pantallasDir, archivo);
  
  if (fs.existsSync(rutaArchivo)) {
    let contenido = fs.readFileSync(rutaArchivo, 'utf8');
    
    // Agregar import si no existe
    if (!contenido.includes("import CONFIG from '../config/api'")) {
      // Buscar la última línea de import
      const lineasImport = contenido.split('\n');
      let ultimoImport = -1;
      
      for (let i = 0; i < lineasImport.length; i++) {
        if (lineasImport[i].trim().startsWith('import ')) {
          ultimoImport = i;
        }
      }
      
      if (ultimoImport !== -1) {
        lineasImport.splice(ultimoImport + 1, 0, configImport);
        contenido = lineasImport.join('\n');
      }
    }
    
    // Reemplazar todas las URLs
    contenido = contenido.replace(
      new RegExp(`'${oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'),
      '`${CONFIG.getApiUrl()}'
    );
    
    contenido = contenido.replace(
      new RegExp(`"${oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'),
      '`${CONFIG.getApiUrl()}'
    );
    
    fs.writeFileSync(rutaArchivo, contenido, 'utf8');
    console.log(`✅ Actualizado: ${archivo}`);
  } else {
    console.log(`❌ No encontrado: ${archivo}`);
  }
});

console.log('🎉 Todas las pantallas han sido actualizadas!');
