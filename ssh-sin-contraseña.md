# Guia para configurar SSH sin contraseña

## Paso 1: Generar clave SSH en tu PC
ssh-keygen -t rsa -b 4096 -C "tu-email@ejemplo.com"
# Presiona Enter para todas las preguntas (usar valores por defecto)

## Paso 2: Copiar clave al servidor
ssh-copy-id modiin@190.113.12.113
# Te pedirá la contraseña UNA ULTIMA VEZ

## Paso 3: Probar conexión sin contraseña
ssh modiin@190.113.12.113
# Debería conectar sin pedir contraseña

## Después de esto, todos los scripts funcionarán sin pedir contraseña
