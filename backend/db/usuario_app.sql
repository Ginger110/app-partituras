-- =====================================================================
--  Usuario de la aplicación con permisos justos (no usar root en la app).
--  Ejecutar UNA VEZ en el SQL Editor de TiDB, conectado como root.
--  1. Reemplazar PREFIJO por el prefijo de tu clúster (el de "PREFIJO.root").
--  2. Reemplazar la contraseña. NO subir este archivo con la contraseña real.
--  3. Poner DB_USER=PREFIJO.app_partituras y DB_PASSWORD en .env y en Render.
-- =====================================================================
CREATE USER IF NOT EXISTS 'PREFIJO.app_partituras'@'%' IDENTIFIED BY 'CAMBIAR_POR_UNA_CLAVE_LARGA';

-- Solo lo que la API necesita: leer y escribir filas. Sin CREATE, DROP ni ALTER.
GRANT SELECT, INSERT, UPDATE, DELETE ON app_partituras.* TO 'PREFIJO.app_partituras'@'%';
