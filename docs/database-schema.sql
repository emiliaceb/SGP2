-- ########################################
-- ESQUEMA DE BASE DE DATOS - GESTIÓN DE PROVEEDORES
-- ########################################

-- 1. PAIS
CREATE TABLE PAIS (
    idPais INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL
);

-- 2. PROVINCIA (Depende de PAIS)
CREATE TABLE PROVINCIA (
    idProvincia INT IDENTITY(1,1) PRIMARY KEY,
    idPais INT NOT NULL,
    nombre NVARCHAR(100) NOT NULL,
    CONSTRAINT FK_PROVINCIA_PAIS FOREIGN KEY (idPais) REFERENCES PAIS(idPais)
);

-- 3. LOCALIDAD (Depende de PROVINCIA)
CREATE TABLE LOCALIDAD (
    idLocalidad INT IDENTITY(1,1) PRIMARY KEY,
    idProvincia INT NOT NULL,
    nombre NVARCHAR(100) NOT NULL,
    CONSTRAINT FK_LOCALIDAD_PROVINCIA FOREIGN KEY (idProvincia) REFERENCES PROVINCIA(idProvincia)
);

-- 4. RUBRO
CREATE TABLE RUBRO (
    id_rubro INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL
);

-- 5. MODELO
CREATE TABLE MODELO (
    id_modelo INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100)  NULL,
    marca NVARCHAR(100)  NULL,
    especificaciones NVARCHAR(500)
);

-- 6. EMPLEADO
CREATE TABLE EMPLEADO (
    id_empleado INT IDENTITY(1,1) PRIMARY KEY,
    perfil NVARCHAR(50) NOT NULL, 
    nombre NVARCHAR(100) NOT NULL,

    -- Restricción CHECK para simular ENUM en la columna 'perfil'
    CONSTRAINT CHK_PerfilEmpleado CHECK (perfil IN ('Administracion', 'Gerencias', 'Compras', 'Reposicion'))
);

-- 7. PROVEEDOR
CREATE TABLE PROVEEDOR (
    cuit BIGINT PRIMARY KEY, 
    razon_social NVARCHAR(255) NOT NULL,
    telefono NVARCHAR(20) NOT NULL,
    email NVARCHAR(100),
    alta DATE NOT NULL,
    baja DATE
);

--8. TECNICO
CREATE TABLE TECNICO (
    id_tecnico INT IDENTITY(1,1) PRIMARY KEY,
    cuit BIGINT NOT NULL,              
    nombre NVARCHAR(100) NOT NULL,
    telefono NVARCHAR(20)NOT NULL,
    
    CONSTRAINT FK_TECNICO_PROVEEDOR FOREIGN KEY (cuit) REFERENCES PROVEEDOR(cuit)
);

-- 9. DIRECCION (Depende de LOCALIDAD y PROVEEDOR)
CREATE TABLE DIRECCION (
    id_direccion INT IDENTITY(1,1) PRIMARY KEY,
    cuit BIGINT NOT NULL, -- FK a PROVEEDOR
    id_localidad INT NOT NULL, -- FK a LOCALIDAD
    tipo NVARCHAR(50) NOT NULL, 
    calle NVARCHAR(255) NOT NULL,
    numero SMALLINT NOT NULL,
    
    CONSTRAINT FK_DIRECCION_PROVEEDOR FOREIGN KEY (cuit) REFERENCES PROVEEDOR(cuit),
    CONSTRAINT FK_DIRECCION_LOCALIDAD FOREIGN KEY (id_localidad) REFERENCES LOCALIDAD(idLocalidad),
    
    -- Restricción CHECK para simular ENUM en la columna 'tipo'
    CONSTRAINT CHK_TipoDireccion CHECK (tipo IN ('CASA CENTRAL', 'SUCURSAL', 'ALMACEN'))
);

-- 10. PROVEEDOR_RUBRO (Tabla de enlace N:M)
CREATE TABLE PROVEEDOR_RUBRO (
    cuit BIGINT NOT NULL, -- FK a PROVEEDOR
    id_rubro INT NOT NULL, -- FK a RUBRO
    PRIMARY KEY (cuit, id_rubro),
    CONSTRAINT FK_PR_PROVEEDOR FOREIGN KEY (cuit) REFERENCES PROVEEDOR(cuit),
    CONSTRAINT FK_PR_RUBRO FOREIGN KEY (id_rubro) REFERENCES RUBRO(id_rubro)
);

-- 11. CONTRATO (Depende de PROVEEDOR)
CREATE TABLE CONTRATO (
    id_contrato INT IDENTITY(1,1) PRIMARY KEY,
    cuit BIGINT NOT NULL, -- FK a PROVEEDOR
    fecha_inicio DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    descripcion NVARCHAR(500),
    ruta_archivo NVARCHAR(500),
    tiempo_respuesta NVARCHAR(50), -- ej: '48 Horas'
    disponibilidad DECIMAL(3,2), -- Mantenemos el tipo de dato DECIMAL (por ejemplo, 0.99 = 99%)
    CONSTRAINT FK_CONTRATO_PROVEEDOR FOREIGN KEY (cuit) REFERENCES PROVEEDOR(cuit)
);

-- 12. EQUIPO (Depende de MODELO)
CREATE TABLE EQUIPO (
    id_equipo INT IDENTITY(1,1) PRIMARY KEY,
    id_modelo INT, -- FK a MODELO
    numero_serie NVARCHAR(100) NULL UNIQUE,
    expiracion_garantia DATE ,
    estado NVARCHAR(50), 
    
    CONSTRAINT FK_EQUIPO_MODELO FOREIGN KEY (id_modelo) REFERENCES MODELO(id_modelo),
    
    -- Restricción CHECK para los estados del equipo
    CONSTRAINT CHK_EstadoEquipo CHECK (estado IN ('OPERATIVO', 'MANTENIMIENTO', 'DESUSO'))
);

-- 13. INFORME (Depende de EMPLEADO)
CREATE TABLE INFORME (
    id_informe INT IDENTITY(1,1) PRIMARY KEY,
    id_empleado INT NOT NULL, -- FK a EMPLEADO (El creador del informe)
    fecha DATE NOT NULL,
    descripcion NVARCHAR(500),
    ruta NVARCHAR(500),
    CONSTRAINT FK_INFORME_EMPLEADO FOREIGN KEY (id_empleado) REFERENCES EMPLEADO(id_empleado)
);

-- 14. ORDEN_DE_COMPRA (Depende de EMPLEADO y PROVEEDOR)
CREATE TABLE ORDEN_DE_COMPRA (
    id_orden INT IDENTITY(1,1) PRIMARY KEY,
    id_empleado INT NOT NULL, -- FK a EMPLEADO (El que realiza la compra)
    cuit BIGINT NOT NULL, -- FK a PROVEEDOR
    id_contrato INT, -- FK al contrato aplicado (Opcional, si no se aplica siempre)
    fecha_pedido DATE NOT NULL,
    fecha_recepcion DATE, -- La fecha en que el pedido fue recibido realmente
    estado NVARCHAR(50) NOT NULL,
    
    CONSTRAINT FK_OC_EMPLEADO FOREIGN KEY (id_empleado) REFERENCES EMPLEADO(id_empleado),
    CONSTRAINT FK_OC_PROVEEDOR FOREIGN KEY (cuit) REFERENCES PROVEEDOR(cuit),
    CONSTRAINT FK_OC_CONTRATO FOREIGN KEY (id_contrato) REFERENCES CONTRATO(id_contrato),
    
    -- Restricción CHECK para los estados de la Orden de Compra
    CONSTRAINT CHK_EstadoOC CHECK (estado IN ('Pendiente', 'Confirmada', 'Recibida', 'Rechazada', 'Cancelada'))
);

-- 15. ITEM_ORDEN_DE_COMPRA (Depende de ORDEN_DE_COMPRA y EQUIPO)
CREATE TABLE ITEM_ORDEN_DE_COMPRA (
    id_item INT IDENTITY(1,1) PRIMARY KEY,
    id_orden INT NOT NULL, -- FK a ORDEN_DE_COMPRA
    id_equipo INT NOT NULL, -- FK a EQUIPO (el tipo de activo comprado)
    descripcion NVARCHAR(255),
    cantidad SMALLINT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    CONSTRAINT FK_ITEM_OC_ORDEN FOREIGN KEY (id_orden) REFERENCES ORDEN_DE_COMPRA(id_orden),
    CONSTRAINT FK_ITEM_OC_EQUIPO FOREIGN KEY (id_equipo) REFERENCES EQUIPO(id_equipo)
);

-- 16. RECLAMO (Depende de ORDEN_DE_COMPRA)
CREATE TABLE RECLAMO (
    id_reclamo INT IDENTITY(1,1) PRIMARY KEY,
    id_empleado INT NOT NULL,     -- FK a EMPLEADO (Quien hace el reporte)
    id_equipo INT NULL,           -- FK a EQUIPO (Opcional, si el reclamo es sobre un activo en uso)
    id_orden INT NULL,            -- FK a ORDEN_DE_COMPRA (Opcional, si el reclamo es sobre la entrega/logística)
    fecha_reporte DATE NOT NULL,
    descripcion NVARCHAR(500),
    prioridad NVARCHAR(50),
    estado NVARCHAR(50),
    
    CONSTRAINT FK_RECLAMO_EMPLEADO FOREIGN KEY (id_empleado) REFERENCES EMPLEADO(id_empleado),
    CONSTRAINT FK_RECLAMO_EQUIPO FOREIGN KEY (id_equipo) REFERENCES EQUIPO(id_equipo),
    CONSTRAINT FK_RECLAMO_ORDEN FOREIGN KEY (id_orden) REFERENCES ORDEN_DE_COMPRA(id_orden),
    
    -- Restricción CHECK para la Prioridad
    CONSTRAINT CHK_PrioridadReclamo CHECK (prioridad IN ('ALTA', 'MEDIA', 'BAJA')),
    
    -- Restricción CHECK para los Estados del Reclamo
    CONSTRAINT CHK_EstadoReclamo CHECK (estado IN ('ABIERTO', 'ASIGNADO', 'EN ESPERA', 'RESUELTO', 'CERRADO', 'ANULADO')),
    
    -- Restricción Lógica: El reclamo DEBE ser sobre un EQUIPO O una ORDEN
    CONSTRAINT CHK_ReclamoObjeto CHECK (id_equipo IS NOT NULL OR id_orden IS NOT NULL)
);

-- 17. CALIFICACION (Depende de PROVEEDOR)
CREATE TABLE CALIFICACION (
    id_calificacion INT IDENTITY(1,1) PRIMARY KEY,
    cuit BIGINT NOT NULL,
    puntaje_plazo TINYINT,
    puntaje_calidad TINYINT,
    puntaje_tiempo_respuesta TINYINT,
    puntaje_disponibilidad TINYINT,
    comentarios NVARCHAR(600),
    puntuacion_total TINYINT,
    CONSTRAINT FK_CALIFICACION_PROVEEDOR FOREIGN KEY (cuit) REFERENCES PROVEEDOR(cuit)
);

-- 18. INTERVENCION (Depende de EQUIPO y TECNICO)
CREATE TABLE INTERVENCION (
    id_intervencion INT IDENTITY(1,1) PRIMARY KEY,
    id_equipo INT NOT NULL, 
    id_tecnico INT NOT NULL, 
    id_reclamo INT NULL, -- Opcional
    fecha DATE NOT NULL,
    estado NVARCHAR(50),
    descripcion_problema NVARCHAR(500),
    descripcion_trabajo_realizado NVARCHAR(500),
    
    CONSTRAINT FK_INTERVENCION_EQUIPO FOREIGN KEY (id_equipo) REFERENCES EQUIPO(id_equipo),
    CONSTRAINT FK_INTERVENCION_TECNICO FOREIGN KEY (id_tecnico) REFERENCES TECNICO(id_tecnico),
    CONSTRAINT FK_INTERVENCION_RECLAMO FOREIGN KEY (id_reclamo) REFERENCES RECLAMO(id_reclamo),

    -- Restricción CHECK para los estados de la Intervención
    CONSTRAINT CHK_EstadoIntervencion CHECK (estado IN ('ASIGNADA', 'EN PROGRESO', 'SUSPENDIDA', 'FINALIZADA', 'VERIFICADA'))
);

-- ########################################
-- DATOS DE EJEMPLO
-- ########################################

-- 1. PAIS
INSERT INTO PAIS (nombre) VALUES
('Argentina'),
('Chile'),
('Uruguay');

-- 2. PROVINCIA (Depende de PAIS)
INSERT INTO PROVINCIA (idPais, nombre) VALUES
(1, 'Buenos Aires'),
(1, 'Córdoba'),
(1, 'Santa Fe'),
(2, 'Santiago'),
(3, 'Montevideo');

-- 3. LOCALIDAD (Depende de PROVINCIA)
INSERT INTO LOCALIDAD (idProvincia, nombre) VALUES
(2, 'La Plata'),
(2, 'Mar del Plata'),
(3, 'Ciudad de Córdoba'),
(4, 'Rosario'),
(5, 'Providencia'),
(6, 'Centro');

-- 4. RUBRO
INSERT INTO RUBRO (nombre) VALUES
('Hardware'),
('Software'),
('Redes y Conectividad'),
('Servicios de Mantenimiento'),
('Consumibles');

-- Y el resto de datos de ejemplo...