-- =====================================================================
--  ScorePulse · Base de datos relacional (TiDB Cloud, compatible con MySQL)
--  Contiene los datos de los usuarios. El resto (obras, partituras,
--  catálogos, ratings y biblioteca) vive en MongoDB Atlas y referencia
--  a usuarios.id (el mismo ObjectId en texto de 24 caracteres).
--
--  Ejecutar con:  npm run db:init   (o pegarlo en el SQL Editor de TiDB)
-- =====================================================================

-- TiDB acepta CHECK pero no los aplica salvo que se active esta variable.
-- (En MySQL/MariaDB esta línea falla y se puede ignorar: allí CHECK ya funciona.)
SET GLOBAL tidb_enable_check_constraint = ON;

CREATE DATABASE IF NOT EXISTS app_partituras
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE app_partituras;

-- ---------------------------------------------------------------------
-- usuarios: identidad, credenciales y perfil
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id                    CHAR(24)      NOT NULL,                 -- ObjectId en hexadecimal (lo referencia MongoDB)
  nombre                VARCHAR(100)  NOT NULL,
  email                 VARCHAR(150)  NOT NULL,                 -- se guarda en minúsculas y sin espacios
  password_hash         VARCHAR(255)  NOT NULL,                 -- bcrypt ($2...) o scrypt (scrypt$...) de los usuarios semilla
  rol                   VARCHAR(20)   NOT NULL DEFAULT 'usuario',
  nivel_tecnico         DECIMAL(3,1)  NOT NULL DEFAULT 1.0,
  nivel_base            DECIMAL(3,1)  NOT NULL DEFAULT 1.0,
  estilo                VARCHAR(50)       NULL,
  link_portafolio       VARCHAR(255)      NULL,
  instrumento_principal VARCHAR(60)       NULL,
  avatar_url            VARCHAR(255)      NULL,
  bio                   TEXT              NULL,
  created_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_usuarios          PRIMARY KEY (id),
  CONSTRAINT uq_usuarios_email    UNIQUE (email),               -- además es el índice que usa el login
  CONSTRAINT ck_usuarios_rol      CHECK (rol IN ('usuario', 'moderador')),
  CONSTRAINT ck_usuarios_nivel    CHECK (nivel_tecnico BETWEEN 1 AND 10),
  CONSTRAINT ck_usuarios_base     CHECK (nivel_base BETWEEN 1 AND 10),
  CONSTRAINT ck_usuarios_email    CHECK (email LIKE '%_@_%._%')
);

-- ---------------------------------------------------------------------
-- usuario_instrumentos: instrumentos secundarios (atributo multivaluado)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuario_instrumentos (
  id_usuario  CHAR(24)     NOT NULL,
  instrumento VARCHAR(60)  NOT NULL,
  CONSTRAINT pk_usuario_instrumentos PRIMARY KEY (id_usuario, instrumento),
  CONSTRAINT fk_ui_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Búsquedas frecuentes fuera de la PK/UNIQUE
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
