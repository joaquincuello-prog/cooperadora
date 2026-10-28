-- =========================================================================================
-- ESQUEMA RELACIONAL DE BASE DE DATOS (DER / DDL SQL)
-- INSTITUCIÓN: Escuela Normal Superior Dalmacio Vélez Sársfield
-- SISTEMA: Gestión de Cooperadora Escolar, Cobranzas, Cuotas y Auditoría Fiscal
-- =========================================================================================

-- 1. TABLA INSTITUCIONAL DE COOPERADORA
CREATE TABLE IF NOT EXISTS cooperadora (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL DEFAULT 'Asociación Cooperadora Escuela Normal Superior Dalmacio Vélez Sársfield',
    cuit VARCHAR(20) NOT NULL UNIQUE,
    direccion VARCHAR(200) NOT NULL,
    ciclo_lectivo INT NOT NULL DEFAULT 2026,
    cuota_base DECIMAL(12,2) NOT NULL DEFAULT 5000.00,
    descuento_hermano_pct DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLA DE USUARIOS Y CONTROL DE ACCESO (RBAC)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    rol VARCHAR(30) NOT NULL CHECK (rol IN ('admin', 'tesorero', 'secretaria', 'tutor')),
    cargo VARCHAR(100) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    ultimo_acceso TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. PADRÓN DE SOCIOS / TUTORES
CREATE TABLE IF NOT EXISTS socios_tutores (
    id SERIAL PRIMARY KEY,
    cooperadora_id INT NOT NULL REFERENCES cooperadora(id) ON DELETE RESTRICT,
    nombre VARCHAR(80) NOT NULL,
    apellido VARCHAR(80) NOT NULL,
    dni VARCHAR(15) NOT NULL UNIQUE,
    telefono VARCHAR(30),
    email VARCHAR(120),
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo', 'Baja')),
    fecha_alta DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. PADRÓN DE ESTUDIANTES MATRICULADOS
CREATE TABLE IF NOT EXISTS alumnos (
    id SERIAL PRIMARY KEY,
    tutor_id INT NOT NULL REFERENCES socios_tutores(id) ON DELETE RESTRICT,
    nombre VARCHAR(80) NOT NULL,
    apellido VARCHAR(80) NOT NULL,
    dni VARCHAR(15) NOT NULL UNIQUE,
    curso VARCHAR(30) NOT NULL,       -- Ej: '1° Año', '2° Año'
    division VARCHAR(5) NOT NULL,      -- Ej: 'A', 'B'
    turno VARCHAR(15) NOT NULL CHECK (turno IN ('Mañana', 'Tarde', 'Noche')),
    estado_matricula VARCHAR(20) NOT NULL DEFAULT 'Regular',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABLA DE CUOTAS Y ARANCELES
CREATE TABLE IF NOT EXISTS cuotas (
    id SERIAL PRIMARY KEY,
    alumno_id INT NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
    concepto VARCHAR(120) NOT NULL,     -- Ej: 'Cuota Marzo 2026'
    mes_id INT NOT NULL CHECK (mes_id BETWEEN 1 AND 13),
    periodo VARCHAR(10) NOT NULL,      -- Ej: '2026-03'
    fecha_vencimiento DATE NOT NULL,
    monto DECIMAL(12,2) NOT NULL CHECK (monto >= 0),
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagada', 'vencida', 'eximida')),
    pago_id INT,                       -- FK referenciada a la tabla pagos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABLA DE AUDITORÍA OBLIGATORIA DE AJUSTE DE CUOTAS (REQUERIMIENTO 3)
CREATE TABLE IF NOT EXISTS cuotas_auditoria_ajustes (
    id SERIAL PRIMARY KEY,
    cuota_id INT NOT NULL REFERENCES cuotas(id) ON DELETE CASCADE,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    monto_anterior DECIMAL(12,2) NOT NULL,
    monto_nuevo DECIMAL(12,2) NOT NULL,
    motivo_ajuste TEXT NOT NULL,       -- Campo de texto obligatorio con justificación
    fecha_ajuste TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. TABLA DE PAGOS Y RECIBOS OFICIALES
CREATE TABLE IF NOT EXISTS pagos (
    id SERIAL PRIMARY KEY,
    numero_comprobante INT NOT NULL UNIQUE,
    recibo_codigo VARCHAR(30) NOT NULL UNIQUE, -- Ej: 'REC-2026-001'
    alumno_id INT NOT NULL REFERENCES alumnos(id) ON DELETE RESTRICT,
    tutor_id INT NOT NULL REFERENCES socios_tutores(id) ON DELETE RESTRICT,
    subtotal DECIMAL(12,2) NOT NULL,
    descuento_hermanos DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    recargo_mora DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    monto_total DECIMAL(12,2) NOT NULL,
    medio_pago VARCHAR(30) NOT NULL CHECK (medio_pago IN ('Efectivo', 'Transferencia', 'Mercado Pago')),
    referencia_comprobante VARCHAR(100) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'valido' CHECK (estado IN ('valido', 'anulado')),
    validado_tesoreria BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
    operador_id INT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    motivo_anulacion TEXT,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. COMPROBANTES DIGITALES ADJUNTOS DE TRANSFERENCIAS (REQUERIMIENTO 4)
CREATE TABLE IF NOT EXISTS comprobantes_adjuntos (
    id SERIAL PRIMARY KEY,
    pago_id INT NOT NULL REFERENCES pagos(id) ON DELETE CASCADE,
    nombre_original VARCHAR(255) NOT NULL,
    nombre_archivo_almacenado VARCHAR(255) NOT NULL UNIQUE,
    tipo_mime VARCHAR(100) NOT NULL CHECK (tipo_mime IN ('image/jpeg', 'image/png', 'application/pdf')),
    tamanio_bytes BIGINT NOT NULL,
    url_acceso TEXT NOT NULL,
    hash_sha256 VARCHAR(64) NOT NULL,
    subido_por_id INT NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. TABLA DE AUDITORÍA GENERAL DEL SISTEMA (RNF-02)
CREATE TABLE IF NOT EXISTS bitacora_auditoria (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    usuario_cargo VARCHAR(100) NOT NULL,
    accion VARCHAR(50) NOT NULL,       -- Ej: 'INICIO_SESION_JWT', 'AJUSTE_CUOTA_AUDITORIA', 'COBRO_REGISTRADO'
    entidad_afectada VARCHAR(50),
    entidad_id VARCHAR(50),
    detalle TEXT NOT NULL,
    ip_origen VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. ÍNDICES DE ALTO RENDIMIENTO PARA BÚSQUEDAS PREDICTIVAS
CREATE INDEX IF NOT EXISTS idx_alumnos_busqueda ON alumnos(apellido, nombre, dni);
CREATE INDEX IF NOT EXISTS idx_socios_dni ON socios_tutores(dni);
CREATE INDEX IF NOT EXISTS idx_cuotas_alumno_estado ON cuotas(alumno_id, estado);
CREATE INDEX IF NOT EXISTS idx_pagos_alumno ON pagos(alumno_id);
CREATE INDEX IF NOT EXISTS idx_pagos_recibo ON pagos(recibo_codigo);
CREATE INDEX IF NOT EXISTS idx_comprobantes_pago ON comprobantes_adjuntos(pago_id);
