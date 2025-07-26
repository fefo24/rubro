-- Agregar columna fecha_ultima_ubicacion a la tabla usuario
-- Esta columna guardará cuándo fue la última vez que se actualizó la ubicación del usuario

USE rubro;

-- Verificar si la columna ya existe antes de agregarla
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'rubro' 
    AND TABLE_NAME = 'usuario' 
    AND COLUMN_NAME = 'fecha_ultima_ubicacion'
);

-- Solo agregar la columna si no existe
SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE usuario ADD COLUMN fecha_ultima_ubicacion TIMESTAMP NULL DEFAULT NULL COMMENT "Última actualización de ubicación GPS";', 
    'SELECT "La columna fecha_ultima_ubicacion ya existe" AS mensaje;'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Mostrar estructura actualizada de la tabla
DESCRIBE usuario;
