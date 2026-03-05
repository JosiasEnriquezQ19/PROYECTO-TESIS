-- =============================================
-- SCRIPT COMPLETO - BASE DE DATOS DBVENTASDEMO
-- Crea tablas, inserta 10 registros por tabla,
-- procedimientos, funciones, vistas y triggers
-- =============================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS DBVENTASDEMO;
USE DBVENTASDEMO;

-- =============================================
-- LIMPIEZA: Eliminar objetos existentes
-- =============================================
SET FOREIGN_KEY_CHECKS = 0;

DROP TRIGGER IF EXISTS after_factura_insert;
DROP TRIGGER IF EXISTS after_factura_update;
DROP VIEW IF EXISTS VistaAsistenciaSemanal;
DROP PROCEDURE IF EXISTS CalcularPagoSemanal;
DROP PROCEDURE IF EXISTS RegistrarAsistencia;
DROP FUNCTION IF EXISTS ObtenerHorasTrabajadasRango;

DROP TABLE IF EXISTS notificaciones;
DROP TABLE IF EXISTS PAGO;
DROP TABLE IF EXISTS ASISTENCIA;
DROP TABLE IF EXISTS EMPLEADO;
DROP TABLE IF EXISTS CONTRATO;
DROP TABLE IF EXISTS VENTA;
DROP TABLE IF EXISTS DETALLE_FACTURA;
DROP TABLE IF EXISTS FACTURA;
DROP TABLE IF EXISTS CONDICIONES_PRODUCTO;
DROP TABLE IF EXISTS DETALLE_PROFORMA;
DROP TABLE IF EXISTS PROFORMA;
DROP TABLE IF EXISTS PRODUCTO;
DROP TABLE IF EXISTS CLIENTE;
DROP TABLE IF EXISTS EMPRESA;
DROP TABLE IF EXISTS USUARIO;
DROP TABLE IF EXISTS PERMISO;
DROP TABLE IF EXISTS ROL;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- 1. CREACIÓN DE TABLAS
-- =============================================

-- Tabla para roles de usuario
CREATE TABLE ROL(
    IdRol INT PRIMARY KEY AUTO_INCREMENT,
    Descripcion VARCHAR(50),
    FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla para permisos
CREATE TABLE PERMISO(
    IdPermiso INT PRIMARY KEY AUTO_INCREMENT,
    IdRol INT,
    NombreMenu VARCHAR(100),
    FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (IdRol) REFERENCES ROL(IdRol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla para usuarios
CREATE TABLE USUARIO(
    IdUsuario INT PRIMARY KEY AUTO_INCREMENT,
    Nombres VARCHAR(50) NOT NULL,
    Apellidos VARCHAR(50) NOT NULL,
    TipoDocumento VARCHAR(20) DEFAULT 'DNI',
    NumeroDocumento VARCHAR(20) NOT NULL UNIQUE,
    Correo VARCHAR(50) UNIQUE,
    Clave VARCHAR(255) NOT NULL,
    IdRol INT NOT NULL,
    Estado TINYINT(1) DEFAULT 1,
    Telefono VARCHAR(20),
    Direccion VARCHAR(200),
    FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (IdRol) REFERENCES ROL(IdRol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla para información de la empresa
CREATE TABLE EMPRESA(
    IdEmpresa INT PRIMARY KEY AUTO_INCREMENT,
    Nombre VARCHAR(100) NOT NULL,
    RUC VARCHAR(11) NOT NULL,
    Direccion VARCHAR(200) NOT NULL,
    Telefono VARCHAR(20),
    Celular VARCHAR(20),
    Email VARCHAR(100),
    Logo LONGBLOB,
    TextoPresentacion VARCHAR(500) DEFAULT 'En atención a vuestra solicitud, tenemos el agrado de cotizarles lo siguiente:',
    CuentaBancaria VARCHAR(100),
    NombreCuentaBancaria VARCHAR(100),
    Estado TINYINT(1) DEFAULT 1,
    FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla para clientes
CREATE TABLE CLIENTE(
    IdCliente INT PRIMARY KEY AUTO_INCREMENT,
    Documento VARCHAR(20) NOT NULL UNIQUE,
    RazonSocial VARCHAR(100) NOT NULL,
    Direccion VARCHAR(200),
    Telefono VARCHAR(20),
    Celular VARCHAR(20),
    Email VARCHAR(100),
    Contacto VARCHAR(100),
    Estado TINYINT(1) DEFAULT 1,
    FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla para productos/servicios (especializado en bombas hidráulicas)
CREATE TABLE PRODUCTO(
    IdProducto INT PRIMARY KEY AUTO_INCREMENT,
    Codigo VARCHAR(50) UNIQUE,
    Nombre VARCHAR(100) NOT NULL,
    Descripcion TEXT,
    Marca VARCHAR(100),
    Modelo VARCHAR(100),
    Tipo VARCHAR(100),
    UnidadMedida VARCHAR(20) DEFAULT 'UNID',
    PrecioUnitario DECIMAL(12,2) NOT NULL,
    Estado TINYINT(1) DEFAULT 1,
    FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla principal de proformas
CREATE TABLE PROFORMA(
    IdProforma INT PRIMARY KEY AUTO_INCREMENT,
    Codigo VARCHAR(20) NOT NULL,
    IdUsuario INT NOT NULL,
    IdCliente INT NOT NULL,
    IdEmpresa INT NOT NULL,
    FechaEmision DATE NOT NULL,
    Referencia VARCHAR(100),
    ValidezOferta INT DEFAULT 10,
    TiempoEntrega VARCHAR(100),
    LugarEntrega VARCHAR(200),
    Garantia VARCHAR(100),
    FormaPago VARCHAR(200),
    PorcentajeIGV DECIMAL(5,2) DEFAULT 18.00,
    SubTotal DECIMAL(12,2) NOT NULL,
    TotalIGV DECIMAL(12,2) NOT NULL,
    Total DECIMAL(12,2) NOT NULL,
    Estado VARCHAR(20) DEFAULT 'PENDIENTE',
    Observaciones TEXT,
    FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (IdUsuario) REFERENCES USUARIO(IdUsuario),
    FOREIGN KEY (IdCliente) REFERENCES CLIENTE(IdCliente),
    FOREIGN KEY (IdEmpresa) REFERENCES EMPRESA(IdEmpresa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de detalle de proformas
CREATE TABLE DETALLE_PROFORMA(
    IdDetalleProforma INT PRIMARY KEY AUTO_INCREMENT,
    IdProforma INT NOT NULL,
    IdProducto INT NOT NULL,
    Cantidad DECIMAL(10,2) NOT NULL,
    UnidadMedida VARCHAR(20) DEFAULT 'UNID',
    PrecioUnitario DECIMAL(12,2) NOT NULL,
    Total DECIMAL(12,2) NOT NULL,
    DescripcionAdicional TEXT,
    FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (IdProforma) REFERENCES PROFORMA(IdProforma),
    FOREIGN KEY (IdProducto) REFERENCES PRODUCTO(IdProducto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla para condiciones específicas de productos en proformas
CREATE TABLE CONDICIONES_PRODUCTO(
    IdCondicion INT PRIMARY KEY AUTO_INCREMENT,
    IdDetalleProforma INT NOT NULL,
    NombreCondicion VARCHAR(100) NOT NULL,
    ValorCondicion VARCHAR(500) NOT NULL,
    FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (IdDetalleProforma) REFERENCES DETALLE_PROFORMA(IdDetalleProforma)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla para facturas
CREATE TABLE FACTURA(
    IdFactura INT PRIMARY KEY AUTO_INCREMENT,
    Codigo VARCHAR(20) NOT NULL,
    IdProforma INT,
    IdUsuario INT NOT NULL,
    IdCliente INT NOT NULL,
    IdEmpresa INT NOT NULL,
    FechaEmision DATE NOT NULL,
    FechaVencimiento DATE,
    SubTotal DECIMAL(12,2) NOT NULL,
    TotalIGV DECIMAL(12,2) NOT NULL,
    Total DECIMAL(12,2) NOT NULL,
    Estado VARCHAR(20) DEFAULT 'PENDIENTE',
    FormaPago VARCHAR(100),
    Observaciones TEXT,
    FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (IdProforma) REFERENCES PROFORMA(IdProforma),
    FOREIGN KEY (IdUsuario) REFERENCES USUARIO(IdUsuario),
    FOREIGN KEY (IdCliente) REFERENCES CLIENTE(IdCliente),
    FOREIGN KEY (IdEmpresa) REFERENCES EMPRESA(IdEmpresa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de detalle de facturas (incluye campos para relación con proforma)
CREATE TABLE DETALLE_FACTURA(
    IdDetalleFactura INT PRIMARY KEY AUTO_INCREMENT,
    IdFactura INT NOT NULL,
    IdProducto INT NOT NULL,
    Cantidad DECIMAL(10,2) NOT NULL,
    UnidadMedida VARCHAR(20) DEFAULT 'UNID',
    PrecioUnitario DECIMAL(12,2) NOT NULL,
    Total DECIMAL(12,2) NOT NULL,
    DescripcionAdicional TEXT,
    IdDetalleProforma INT NULL,
    TipoDetalle VARCHAR(20) DEFAULT 'ORIGINAL' COMMENT 'ORIGINAL (de proforma) o ADICIONAL (agregado después)',
    FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (IdFactura) REFERENCES FACTURA(IdFactura),
    FOREIGN KEY (IdProducto) REFERENCES PRODUCTO(IdProducto),
    FOREIGN KEY (IdDetalleProforma) REFERENCES DETALLE_PROFORMA(IdDetalleProforma),
    INDEX idx_detalle_factura_proforma (IdDetalleProforma),
    INDEX idx_detalle_factura_tipo (TipoDetalle)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla para ventas (resumen de facturas)
CREATE TABLE VENTA(
    IdVenta INT PRIMARY KEY AUTO_INCREMENT,
    IdFactura INT NOT NULL,
    FechaVenta DATE NOT NULL,
    Total DECIMAL(12,2) NOT NULL,
    Estado VARCHAR(20),
    FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (IdFactura) REFERENCES FACTURA(IdFactura)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla para contratos
CREATE TABLE CONTRATO(
    IdContrato INT PRIMARY KEY AUTO_INCREMENT,
    Codigo VARCHAR(20) NOT NULL,
    IdCliente INT NOT NULL,
    IdFactura INT,
    NumeroCuentaBanco VARCHAR(50),
    FechaInicio DATE NOT NULL,
    FechaFin DATE,
    PagoSemanal DECIMAL(12,2),
    Estado VARCHAR(20) DEFAULT 'ACTIVO',
    Terminos TEXT,
    FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (IdCliente) REFERENCES CLIENTE(IdCliente),
    FOREIGN KEY (IdFactura) REFERENCES FACTURA(IdFactura)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla para empleados (extiende USUARIO con datos laborales)
CREATE TABLE EMPLEADO(
    IdEmpleado INT PRIMARY KEY AUTO_INCREMENT,
    IdUsuario INT NOT NULL UNIQUE,
    Cargo VARCHAR(100) NOT NULL,
    Area VARCHAR(100),
    FechaContratacion DATE NOT NULL,
    TipoContrato VARCHAR(50) DEFAULT 'INDEFINIDO',
    SueldoBase DECIMAL(12,2) NOT NULL COMMENT 'Sueldo base semanal del empleado',
    Banco VARCHAR(100),
    NumeroCuenta VARCHAR(50),
    TipoCuenta VARCHAR(30) DEFAULT 'AHORROS',
    Estado VARCHAR(20) DEFAULT 'ACTIVO',
    FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (IdUsuario) REFERENCES USUARIO(IdUsuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla para asistencias del personal
CREATE TABLE ASISTENCIA(
    IdAsistencia INT PRIMARY KEY AUTO_INCREMENT,
    IdEmpleado INT NOT NULL,
    Fecha DATE NOT NULL,
    JornadaLaboral VARCHAR(20) DEFAULT 'COMPLETA' COMMENT 'COMPLETA, MEDIO_MANANA, MEDIO_TARDE, NOCTURNO, PERSONALIZADO',
    HoraEntrada TIME,
    HoraSalida TIME,
    HorasTrabajadas DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN HoraEntrada IS NOT NULL AND HoraSalida IS NOT NULL 
            THEN ROUND(TIME_TO_SEC(TIMEDIFF(HoraSalida, HoraEntrada)) / 3600, 2)
            ELSE 0 
        END
    ) STORED,
    Estado VARCHAR(20) DEFAULT 'PRESENTE',
    TipoAsistencia VARCHAR(20) DEFAULT 'REGULAR' COMMENT 'REGULAR, FERIADO, EXTRA',
    Observaciones TEXT,
    FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_empleado_fecha (IdEmpleado, Fecha),
    INDEX idx_asistencia_empleado_fecha (IdEmpleado, Fecha),
    FOREIGN KEY (IdEmpleado) REFERENCES EMPLEADO(IdEmpleado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla para pagos a empleados
CREATE TABLE PAGO(
    IdPago INT PRIMARY KEY AUTO_INCREMENT,
    IdEmpleado INT NOT NULL,
    Semana INT NOT NULL,
    Anio INT NOT NULL,
    FechaInicio DATE NOT NULL,
    FechaFin DATE NOT NULL,
    HorasTrabajadas DECIMAL(10,2) NOT NULL,
    SueldoSemanal DECIMAL(12,2) NOT NULL,
    Bonificaciones DECIMAL(12,2) DEFAULT 0,
    Descuentos DECIMAL(12,2) DEFAULT 0,
    TotalPago DECIMAL(12,2) NOT NULL,
    Estado VARCHAR(20) DEFAULT 'PENDIENTE',
    FechaPago DATE,
    MetodoPago VARCHAR(50) DEFAULT 'TRANSFERENCIA',
    Comentarios TEXT,
    FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_empleado_semana_anio (IdEmpleado, Semana, Anio),
    INDEX idx_pago_empleado_semana (IdEmpleado, Semana, Anio),
    FOREIGN KEY (IdEmpleado) REFERENCES EMPLEADO(IdEmpleado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla para notificaciones
CREATE TABLE notificaciones (
    IdNotificacion INT AUTO_INCREMENT PRIMARY KEY,
    Tipo VARCHAR(20) NOT NULL COMMENT 'CREAR, ACTUALIZAR, ELIMINAR',
    Modulo VARCHAR(50) NOT NULL COMMENT 'clientes, proformas, productos, etc.',
    Mensaje VARCHAR(255) NOT NULL,
    Detalle VARCHAR(255) DEFAULT NULL,
    Usuario VARCHAR(100) DEFAULT NULL,
    Leida TINYINT(1) DEFAULT 0,
    FechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_leida (Leida),
    INDEX idx_fecha (FechaCreacion DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Índices adicionales para rendimiento
CREATE INDEX idx_empleado_estado ON EMPLEADO(Estado);




--tabla para auditoria

CREATE TABLE IF NOT EXISTS AUDITORIA (
    IdAuditoria  INT           PRIMARY KEY AUTO_INCREMENT,
    IdUsuario    INT           NULL,
    NombreUsuario VARCHAR(120) NOT NULL DEFAULT 'Sistema',
    Modulo       VARCHAR(50)  NOT NULL,
    Accion       VARCHAR(30)  NOT NULL,   -- CREAR | ACTUALIZAR | ELIMINAR | LOGIN | LOGOUT | ERROR
    Descripcion  TEXT         NULL,
    IP           VARCHAR(50)  NULL,
    FechaHora    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (IdUsuario) REFERENCES USUARIO(IdUsuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Indices para acelerar consultas del dashboard y reportes
ALTER TABLE AUDITORIA ADD INDEX idx_auditoria_fecha   (FechaHora);
ALTER TABLE AUDITORIA ADD INDEX idx_auditoria_modulo  (Modulo);
ALTER TABLE AUDITORIA ADD INDEX idx_auditoria_usuario (IdUsuario);


-- =============================================
-- 2. INSERCIÓN DE DATOS (10 registros por tabla)
-- =============================================

-- -----------------------------------------------
-- 2.1 ROL (10 registros)
-- -----------------------------------------------
INSERT INTO ROL (Descripcion) VALUES 
('Administrador'),
('Empleado'),
('Supervisor'),
('Gerente'),
('Contador'),
('Tecnico'),
('Vendedor'),
('Almacenero'),
('Secretaria'),
('Auditor');

-- -----------------------------------------------
-- 2.2 PERMISO (10 registros)
-- -----------------------------------------------
INSERT INTO PERMISO (IdRol, NombreMenu) VALUES
(1, 'Dashboard'),
(1, 'Usuarios'),
(1, 'Clientes'),
(1, 'Productos'),
(1, 'Proformas'),
(1, 'Facturas'),
(1, 'Reportes'),
(2, 'Dashboard'),
(2, 'Clientes'),
(3, 'Dashboard');

-- -----------------------------------------------
-- 2.3 USUARIO (10 registros)
-- -----------------------------------------------
INSERT INTO USUARIO (Nombres, Apellidos, TipoDocumento, NumeroDocumento, Correo, Clave, IdRol, Estado, Telefono, Direccion) VALUES
('Juan Carlos', 'Perez Lopez', 'DNI', '12345678', 'juan@carsil.com', '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWX', 1, 1, '987654321', 'Av. Principal 123, Lima'),
('Maria Elena', 'Garcia Torres', 'DNI', '87654321', 'maria@carsil.com', '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWX', 2, 1, '987654322', 'Jr. Los Olivos 456, Lima'),
('Pedro Antonio', 'Rodriguez Silva', 'DNI', '11223344', 'pedro@carsil.com', '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWX', 2, 1, '987654323', 'Calle Las Flores 789, Lima'),
('Ana Lucia', 'Martinez Rios', 'DNI', '22334455', 'ana@carsil.com', '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWX', 3, 1, '987654324', 'Av. Arequipa 321, Lima'),
('Carlos Alberto', 'Ramirez Vega', 'DNI', '33445566', 'carlos@carsil.com', '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWX', 4, 1, '987654325', 'Jr. Cusco 654, Lima'),
('Rosa Maria', 'Flores Huaman', 'DNI', '44556677', 'rosa@carsil.com', '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWX', 5, 1, '987654326', 'Calle Ayacucho 987, Lima'),
('Luis Fernando', 'Torres Mendoza', 'DNI', '55667788', 'luis@carsil.com', '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWX', 6, 1, '987654327', 'Av. Brasil 111, Lima'),
('Carmen Sofia', 'Lopez Castillo', 'DNI', '66778899', 'carmen@carsil.com', '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWX', 7, 1, '987654328', 'Jr. Puno 222, Lima'),
('Jorge Luis', 'Diaz Quispe', 'DNI', '77889900', 'jorge@carsil.com', '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWX', 8, 1, '987654329', 'Calle Tacna 333, Lima'),
('Sandra Patricia', 'Vargas Rojas', 'DNI', '88990011', 'sandra@carsil.com', '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWX', 9, 1, '987654330', 'Av. Colonial 444, Lima');

-- -----------------------------------------------
-- 2.4 EMPRESA (10 registros)
-- -----------------------------------------------
INSERT INTO EMPRESA (Nombre, RUC, Direccion, Telefono, Celular, Email, CuentaBancaria, NombreCuentaBancaria) VALUES
('CARSIL Bombas Hidraulicas S.A.C.', '20123456789', 'Av. Industrial 456, Ate, Lima', '014567890', '987654321', 'ventas@carsil.com', '1234567890123', 'CARSIL SAC - BCP'),
('HidroPower Peru S.A.', '20234567890', 'Calle Los Ingenieros 123, San Luis, Lima', '014567891', '987654322', 'info@hidropower.com', '2345678901234', 'HidroPower - BBVA'),
('Bombas del Sur E.I.R.L.', '20345678901', 'Jr. Maquinarias 789, Villa El Salvador, Lima', '014567892', '987654323', 'contacto@bombasdelsur.com', '3456789012345', 'Bombas del Sur - Interbank'),
('AquaTec Soluciones S.A.C.', '20456789012', 'Av. La Marina 321, San Miguel, Lima', '014567893', '987654324', 'ventas@aquatec.com', '4567890123456', 'AquaTec - Scotiabank'),
('Riego Total Peru S.A.', '20567890123', 'Calle Agricultura 654, La Molina, Lima', '014567894', '987654325', 'info@riegototal.com', '5678901234567', 'Riego Total - BCP'),
('MegaBombas S.A.C.', '20678901234', 'Av. Venezuela 987, Breña, Lima', '014567895', '987654326', 'ventas@megabombas.com', '6789012345678', 'MegaBombas - BBVA'),
('Industrial Pumps S.A.', '20789012345', 'Jr. Progreso 111, Comas, Lima', '014567896', '987654327', 'contacto@indpumps.com', '7890123456789', 'Ind Pumps - Interbank'),
('Hidro Servicios del Norte S.A.C.', '20890123456', 'Av. Chiclayo 222, Trujillo', '044567897', '987654328', 'info@hsnorte.com', '8901234567890', 'HS Norte - BCP'),
('Sur Hidraulica E.I.R.L.', '20901234567', 'Calle Arequipa 333, Arequipa', '054567898', '987654329', 'ventas@surhidraulica.com', '9012345678901', 'Sur Hidraulica - BBVA'),
('Peruana de Bombas S.A.', '20012345678', 'Av. Cusco 444, Cusco', '084567899', '987654330', 'info@peruanabombas.com', '0123456789012', 'Peruana Bombas - Scotiabank');

-- -----------------------------------------------
-- 2.5 CLIENTE (10 registros)
-- -----------------------------------------------
INSERT INTO CLIENTE (Documento, RazonSocial, Direccion, Telefono, Celular, Email, Contacto) VALUES
('20501234567', 'Constructora Los Andes S.A.C.', 'Av. Javier Prado 1234, San Isidro, Lima', '016543210', '912345678', 'compras@losandes.com', 'Roberto Sanchez'),
('20602345678', 'Minera El Dorado S.A.', 'Carretera Central Km 45, Junin', '064543211', '912345679', 'logistica@eldorado.com', 'Fernando Quispe'),
('20703456789', 'Agroindustrial del Pacifico S.A.C.', 'Fundo La Victoria, Ica', '056543212', '912345680', 'compras@agropacifico.com', 'Patricia Gomez'),
('20804567890', 'Municipalidad de Miraflores', 'Av. Larco 400, Miraflores, Lima', '016543213', '912345681', 'obras@munimiraflores.gob.pe', 'Carlos Medina'),
('20905678901', 'Hotel Costa del Sol S.A.', 'Malecón Cisneros 1244, Miraflores, Lima', '016543214', '912345682', 'mantenimiento@costadelsol.com', 'Lucia Fernandez'),
('20106789012', 'Textil San Cristobal S.A.C.', 'Zona Industrial, Av. Argentina 3456, Lima', '016543215', '912345683', 'planta@sancristobal.com', 'Miguel Torres'),
('20207890123', 'Pesquera del Norte S.A.', 'Puerto Salaverry, Trujillo', '044543216', '912345684', 'operaciones@pesqueranorte.com', 'Andrea Lopez'),
('20308901234', 'Cerveceria Artesanal del Sur E.I.R.L.', 'Jr. Industria 567, Arequipa', '054543217', '912345685', 'produccion@cerveartesur.com', 'Diego Ramirez'),
('20409012345', 'Condominio Las Palmeras', 'Av. El Sol 890, Surco, Lima', '016543218', '912345686', 'administracion@laspalmeras.com', 'Gabriela Vargas'),
('20510123456', 'Universidad Nacional de Ingenieria', 'Av. Tupac Amaru 210, Rimac, Lima', '016543219', '912345687', 'laboratorio@uni.edu.pe', 'Profesor Huaman');

-- -----------------------------------------------
-- 2.6 PRODUCTO (10 registros)
-- -----------------------------------------------
INSERT INTO PRODUCTO (Codigo, Nombre, Descripcion, Marca, Modelo, Tipo, UnidadMedida, PrecioUnitario) VALUES
('BOM-SUM-001', 'Bomba Sumergible 1HP', 'Bomba sumergible para pozo profundo, acero inoxidable, 1HP, 220V', 'Pedrollo', '4SR1m/13', 'Sumergible', 'UNID', 850.00),
('BOM-SUM-002', 'Bomba Sumergible 2HP', 'Bomba sumergible para aguas limpias, 2HP, 380V, caudal 5m3/h', 'Grundfos', 'SP 5-50', 'Sumergible', 'UNID', 1200.00),
('BOM-SUM-003', 'Bomba Sumergible 3HP', 'Bomba sumergible para aguas residuales con solidos hasta 50mm', 'Ebara', 'Drainage DVS', 'Sumergible', 'UNID', 1800.00),
('ELE-001', 'Electrobomba Centrifuga 1HP', 'Electrobomba horizontal monofasica, 1HP, caudal 1.5m3/h', 'Pedrollo', 'PKm 60', 'Centrifuga', 'UNID', 480.00),
('ELE-002', 'Electrobomba Autocebante 2HP', 'Electrobomba autocebante para riego, 2HP, 380V', 'Lowara', 'EASY', 'Autocebante', 'UNID', 750.00),
('ELE-003', 'Electrobomba Presurizadora 0.75HP', 'Electrobomba para sistema de presion constante, 0.75HP', 'Grundfos', 'SCALA2', 'Presurizadora', 'UNID', 920.00),
('BOM-SUP-001', 'Bomba Superficie 1HP', 'Bomba de superficie para riego, 1HP, caudal 3m3/h', 'Pedrollo', 'CPm 158', 'Superficie', 'UNID', 420.00),
('BOM-RES-001', 'Bomba Aguas Residuales 2HP', 'Bomba sumergible para aguas residuales con triturador', 'Franklin', 'SEWAGE', 'Residuales', 'UNID', 2100.00),
('SIS-BOM-001', 'Sistema Hidroneumatico 500L', 'Tanque hidroneumatico + bomba 2HP + controles, capacidad 500L', 'Grundfos', 'Hydro 500', 'Sistema', 'UNID', 2800.00),
('ACC-CON-002', 'Controlador de Bomba', 'Controlador electronico para bomba con proteccion por sequia', 'Franklin', 'Control Pro', 'Accesorio', 'UNID', 120.00);

-- -----------------------------------------------
-- 2.7 PROFORMA (10 registros)
-- -----------------------------------------------
INSERT INTO PROFORMA (Codigo, IdUsuario, IdCliente, IdEmpresa, FechaEmision, Referencia, ValidezOferta, TiempoEntrega, LugarEntrega, Garantia, FormaPago, PorcentajeIGV, SubTotal, TotalIGV, Total, Estado, Observaciones) VALUES
('PRO-2025-001', 1, 1, 1, '2025-01-10', 'Cotización bombas para obra', 15, '5 días hábiles', 'Obra San Isidro', '12 meses', 'Contado', 18.00, 2050.00, 369.00, 2419.00, 'APROBADA', 'Cliente requiere entrega urgente'),
('PRO-2025-002', 1, 2, 1, '2025-01-15', 'Sistema de bombeo para minería', 10, '10 días hábiles', 'Campamento minero Junín', '24 meses', '50% adelanto, 50% contra entrega', 18.00, 5000.00, 900.00, 5900.00, 'APROBADA', 'Incluye instalación'),
('PRO-2025-003', 4, 3, 1, '2025-02-01', 'Electrobombas para riego', 10, '7 días hábiles', 'Fundo Ica', '12 meses', 'Crédito 30 días', 18.00, 1500.00, 270.00, 1770.00, 'PENDIENTE', NULL),
('PRO-2025-004', 1, 4, 1, '2025-02-10', 'Bombas para parques', 15, '15 días hábiles', 'Parque Kennedy', '12 meses', 'Contado', 18.00, 3600.00, 648.00, 4248.00, 'APROBADA', 'Proyecto municipal'),
('PRO-2025-005', 8, 5, 1, '2025-02-15', 'Sistema presurización hotel', 10, '8 días hábiles', 'Hotel Costa del Sol', '24 meses', '30% adelanto', 18.00, 4720.00, 849.60, 5569.60, 'PENDIENTE', NULL),
('PRO-2025-006', 1, 6, 1, '2025-03-01', 'Bombas industriales textil', 10, '12 días hábiles', 'Planta San Cristobal', '12 meses', 'Crédito 45 días', 18.00, 3000.00, 540.00, 3540.00, 'APROBADA', 'Requiere certificado de calidad'),
('PRO-2025-007', 4, 7, 1, '2025-03-10', 'Bombeo para pesquera', 15, '10 días hábiles', 'Puerto Salaverry', '18 meses', '50% adelanto', 18.00, 6200.00, 1116.00, 7316.00, 'RECHAZADA', 'Cliente optó por otra cotización'),
('PRO-2025-008', 8, 8, 1, '2025-03-15', 'Bomba para cervecería', 10, '5 días hábiles', 'Planta Arequipa', '12 meses', 'Contado', 18.00, 920.00, 165.60, 1085.60, 'APROBADA', NULL),
('PRO-2025-009', 1, 9, 1, '2025-04-01', 'Sistema hidroneumático condominio', 10, '15 días hábiles', 'Condominio Surco', '24 meses', 'Crédito 60 días', 18.00, 2800.00, 504.00, 3304.00, 'APROBADA', 'Incluye capacitación'),
('PRO-2025-010', 4, 10, 1, '2025-04-10', 'Equipos laboratorio UNI', 15, '20 días hábiles', 'Lab. Hidráulica UNI', '12 meses', 'Orden de compra', 18.00, 1700.00, 306.00, 2006.00, 'PENDIENTE', 'Sujeto a presupuesto universitario');

-- -----------------------------------------------
-- 2.8 DETALLE_PROFORMA (10 registros)
-- -----------------------------------------------
INSERT INTO DETALLE_PROFORMA (IdProforma, IdProducto, Cantidad, UnidadMedida, PrecioUnitario, Total, DescripcionAdicional) VALUES
(1, 1, 2.00, 'UNID', 850.00, 1700.00, 'Bombas para pozo de 30m de profundidad'),
(1, 10, 2.00, 'UNID', 120.00, 240.00, 'Controladores para las bombas sumergibles'),
(2, 3, 2.00, 'UNID', 1800.00, 3600.00, 'Bombas para drenaje de mina'),
(2, 8, 1.00, 'UNID', 2100.00, 2100.00, 'Bomba de aguas residuales del campamento'),
(3, 5, 2.00, 'UNID', 750.00, 1500.00, 'Electrobombas para sistema de riego por goteo'),
(4, 3, 2.00, 'UNID', 1800.00, 3600.00, 'Bombas sumergibles para fuentes ornamentales'),
(5, 6, 2.00, 'UNID', 920.00, 1840.00, 'Presurizadoras para pisos superiores'),
(5, 9, 1.00, 'UNID', 2800.00, 2800.00, 'Sistema hidroneumático para lobby'),
(6, 2, 2.00, 'UNID', 1200.00, 2400.00, 'Bombas para proceso de teñido'),
(7, 3, 2.00, 'UNID', 1800.00, 3600.00, 'Bombas para descarga de embarcaciones');

-- -----------------------------------------------
-- 2.9 CONDICIONES_PRODUCTO (10 registros)
-- -----------------------------------------------
INSERT INTO CONDICIONES_PRODUCTO (IdDetalleProforma, NombreCondicion, ValorCondicion) VALUES
(1, 'Voltaje', '220V monofásico'),
(1, 'Garantía extendida', '24 meses con mantenimiento preventivo incluido'),
(2, 'Compatibilidad', 'Compatible con bombas Pedrollo serie 4SR'),
(3, 'Material carcasa', 'Acero inoxidable AISI 304'),
(4, 'Certificación', 'ISO 9001 - Apta para uso en minería'),
(5, 'Presión máxima', '6 bar - Apto para riego tecnificado'),
(6, 'Instalación', 'Incluye instalación y puesta en marcha'),
(7, 'Nivel de ruido', 'Menor a 55 dB - Apto para uso en hoteles'),
(8, 'Capacidad tanque', '500 litros - Acero galvanizado'),
(9, 'Temperatura máxima', 'Hasta 60°C - Apto para proceso textil');

-- -----------------------------------------------
-- 2.10 FACTURA (10 registros) - SIN triggers aún
-- -----------------------------------------------
INSERT INTO FACTURA (Codigo, IdProforma, IdUsuario, IdCliente, IdEmpresa, FechaEmision, FechaVencimiento, SubTotal, TotalIGV, Total, Estado, FormaPago, Observaciones) VALUES
('FAC-2025-001', 1, 1, 1, 1, '2025-01-20', '2025-02-19', 2050.00, 369.00, 2419.00, 'PAGADA', 'Contado', 'Pago al contado en oficina'),
('FAC-2025-002', 2, 1, 2, 1, '2025-01-25', '2025-02-24', 5000.00, 900.00, 5900.00, 'PAGADA', 'Transferencia', 'Primer pago 50% recibido'),
('FAC-2025-003', 4, 1, 4, 1, '2025-02-20', '2025-03-22', 3600.00, 648.00, 4248.00, 'PENDIENTE', 'Crédito 30 días', 'Factura municipal'),
('FAC-2025-004', 6, 1, 6, 1, '2025-03-10', '2025-04-24', 3000.00, 540.00, 3540.00, 'PENDIENTE', 'Crédito 45 días', NULL),
('FAC-2025-005', 8, 8, 8, 1, '2025-03-20', '2025-04-19', 920.00, 165.60, 1085.60, 'PAGADA', 'Contado', 'Pago inmediato'),
('FAC-2025-006', 9, 1, 9, 1, '2025-04-10', '2025-06-09', 2800.00, 504.00, 3304.00, 'PENDIENTE', 'Crédito 60 días', 'Incluye instalación'),
('FAC-2025-007', NULL, 1, 1, 1, '2025-04-15', '2025-05-15', 480.00, 86.40, 566.40, 'PAGADA', 'Contado', 'Venta directa sin proforma'),
('FAC-2025-008', NULL, 4, 3, 1, '2025-04-20', '2025-05-20', 1500.00, 270.00, 1770.00, 'PENDIENTE', 'Crédito 30 días', 'Venta directa'),
('FAC-2025-009', NULL, 1, 5, 1, '2025-05-01', '2025-05-31', 2100.00, 378.00, 2478.00, 'ANULADA', 'Transferencia', 'Factura anulada por error en datos'),
('FAC-2025-010', NULL, 8, 10, 1, '2025-05-10', '2025-06-09', 850.00, 153.00, 1003.00, 'PENDIENTE', 'Orden de compra', 'Pendiente orden de compra UNI');

-- -----------------------------------------------
-- 2.11 DETALLE_FACTURA (10 registros)
-- -----------------------------------------------
INSERT INTO DETALLE_FACTURA (IdFactura, IdProducto, Cantidad, UnidadMedida, PrecioUnitario, Total, DescripcionAdicional, IdDetalleProforma, TipoDetalle) VALUES
(1, 1, 2.00, 'UNID', 850.00, 1700.00, 'Bombas sumergibles 1HP para obra', 1, 'ORIGINAL'),
(1, 10, 2.00, 'UNID', 120.00, 240.00, 'Controladores electrónicos', 2, 'ORIGINAL'),
(2, 3, 2.00, 'UNID', 1800.00, 3600.00, 'Bombas 3HP para mina', 3, 'ORIGINAL'),
(2, 8, 1.00, 'UNID', 2100.00, 2100.00, 'Bomba aguas residuales', 4, 'ORIGINAL'),
(3, 3, 2.00, 'UNID', 1800.00, 3600.00, 'Bombas para fuentes', 6, 'ORIGINAL'),
(4, 2, 2.00, 'UNID', 1200.00, 2400.00, 'Bombas para teñido', 9, 'ORIGINAL'),
(5, 6, 1.00, 'UNID', 920.00, 920.00, 'Presurizadora cervecería', NULL, 'ORIGINAL'),
(6, 9, 1.00, 'UNID', 2800.00, 2800.00, 'Sistema hidroneumático', NULL, 'ORIGINAL'),
(7, 4, 1.00, 'UNID', 480.00, 480.00, 'Electrobomba venta directa', NULL, 'ADICIONAL'),
(8, 5, 2.00, 'UNID', 750.00, 1500.00, 'Electrobombas riego', NULL, 'ADICIONAL');

-- -----------------------------------------------
-- 2.12 VENTA (10 registros - vinculados a facturas)
-- -----------------------------------------------
INSERT INTO VENTA (IdFactura, FechaVenta, Total, Estado) VALUES
(1, '2025-01-20', 2419.00, 'COMPLETADA'),
(2, '2025-01-25', 5900.00, 'COMPLETADA'),
(3, '2025-02-20', 4248.00, 'PENDIENTE'),
(4, '2025-03-10', 3540.00, 'PENDIENTE'),
(5, '2025-03-20', 1085.60, 'COMPLETADA'),
(6, '2025-04-10', 3304.00, 'PENDIENTE'),
(7, '2025-04-15', 566.40, 'COMPLETADA'),
(8, '2025-04-20', 1770.00, 'PENDIENTE'),
(9, '2025-05-01', 2478.00, 'ANULADA'),
(10, '2025-05-10', 1003.00, 'PENDIENTE');

-- -----------------------------------------------
-- 2.13 CONTRATO (10 registros)
-- -----------------------------------------------
INSERT INTO CONTRATO (Codigo, IdCliente, IdFactura, NumeroCuentaBanco, FechaInicio, FechaFin, PagoSemanal, Estado, Terminos) VALUES
('CON-2025-001', 1, 1, '1234567890123', '2025-01-20', '2025-07-20', 400.00, 'ACTIVO', 'Contrato de suministro e instalación de bombas sumergibles. Incluye garantía de 12 meses.'),
('CON-2025-002', 2, 2, '2345678901234', '2025-01-25', '2025-12-25', 500.00, 'ACTIVO', 'Contrato de bombeo para operación minera. Mantenimiento mensual incluido.'),
('CON-2025-003', 4, 3, '3456789012345', '2025-02-20', '2025-08-20', 700.00, 'ACTIVO', 'Contrato con municipalidad para mantenimiento de fuentes ornamentales.'),
('CON-2025-004', 6, 4, '4567890123456', '2025-03-10', '2025-09-10', 600.00, 'ACTIVO', 'Contrato industrial para planta textil. Servicio técnico quincenal.'),
('CON-2025-005', 8, 5, '5678901234567', '2025-03-20', '2025-06-20', 350.00, 'FINALIZADO', 'Contrato breve para instalación en cervecería artesanal.'),
('CON-2025-006', 9, 6, '6789012345678', '2025-04-10', '2026-04-10', 280.00, 'ACTIVO', 'Contrato anual de mantenimiento sistema hidroneumático condominio.'),
('CON-2025-007', 3, NULL, '7890123456789', '2025-05-01', '2025-11-01', 250.00, 'ACTIVO', 'Contrato de servicio de riego para fundo agroindustrial.'),
('CON-2025-008', 5, NULL, '8901234567890', '2025-05-15', '2026-05-15', 300.00, 'ACTIVO', 'Contrato mantenimiento bombas del hotel. Visitas semanales.'),
('CON-2025-009', 7, NULL, '9012345678901', '2025-06-01', '2025-12-01', 450.00, 'PENDIENTE', 'Contrato en negociación para pesquera del norte.'),
('CON-2025-010', 10, NULL, '0123456789012', '2025-06-15', '2026-06-15', 200.00, 'PENDIENTE', 'Contrato de mantenimiento equipos de laboratorio UNI.');

-- -----------------------------------------------
-- 2.14 EMPLEADO (10 registros - vinculados a usuarios)
-- -----------------------------------------------
INSERT INTO EMPLEADO (IdUsuario, Cargo, Area, FechaContratacion, TipoContrato, SueldoBase, Banco, NumeroCuenta, TipoCuenta) VALUES
(1, 'Gerente General', 'Administración', '2023-01-02', 'INDEFINIDO', 500.00, 'BCP', '1111111111', 'CORRIENTE'),
(2, 'Técnico en Bombas', 'Mantenimiento', '2024-01-15', 'INDEFINIDO', 280.00, 'BCP', '2222222222', 'AHORROS'),
(3, 'Operario de Instalaciones', 'Instalaciones', '2024-02-01', 'INDEFINIDO', 240.00, 'Interbank', '3333333333', 'AHORROS'),
(4, 'Supervisor de Obra', 'Operaciones', '2023-06-15', 'INDEFINIDO', 350.00, 'BBVA', '4444444444', 'CORRIENTE'),
(5, 'Gerente Comercial', 'Ventas', '2023-03-01', 'INDEFINIDO', 450.00, 'Scotiabank', '5555555555', 'CORRIENTE'),
(6, 'Contadora', 'Contabilidad', '2023-09-01', 'INDEFINIDO', 320.00, 'BCP', '6666666666', 'AHORROS'),
(7, 'Técnico Electricista', 'Mantenimiento', '2024-04-01', 'PLAZO FIJO', 260.00, 'Interbank', '7777777777', 'AHORROS'),
(8, 'Vendedor Senior', 'Ventas', '2023-11-01', 'INDEFINIDO', 300.00, 'BBVA', '8888888888', 'AHORROS'),
(9, 'Almacenero', 'Logística', '2024-06-01', 'PLAZO FIJO', 220.00, 'BCP', '9999999999', 'AHORROS'),
(10, 'Secretaria Ejecutiva', 'Administración', '2024-03-01', 'INDEFINIDO', 250.00, 'Scotiabank', '1010101010', 'AHORROS');

-- -----------------------------------------------
-- 2.15 ASISTENCIA (10 registros - columna HorasTrabajadas es GENERATED, no se incluye)
-- -----------------------------------------------
INSERT INTO ASISTENCIA (IdEmpleado, Fecha, JornadaLaboral, HoraEntrada, HoraSalida, Estado, TipoAsistencia, Observaciones) VALUES
(1, '2025-02-24', 'COMPLETA', '08:00:00', '17:00:00', 'PRESENTE', 'REGULAR', NULL),
(2, '2025-02-24', 'COMPLETA', '08:15:00', '17:00:00', 'PRESENTE', 'REGULAR', NULL),
(3, '2025-02-24', 'COMPLETA', '08:00:00', '17:30:00', 'PRESENTE', 'REGULAR', 'Horas extra por instalación urgente'),
(4, '2025-02-24', 'COMPLETA', '08:45:00', '17:00:00', 'TARDANZA', 'REGULAR', 'Tardanza por tráfico'),
(5, '2025-02-24', 'COMPLETA', '08:00:00', '17:00:00', 'PRESENTE', 'REGULAR', NULL),
(1, '2025-02-25', 'COMPLETA', '08:00:00', '17:00:00', 'PRESENTE', 'REGULAR', NULL),
(2, '2025-02-25', 'COMPLETA', '08:00:00', '17:00:00', 'PRESENTE', 'REGULAR', NULL),
(3, '2025-02-25', 'MEDIO_MANANA', '08:00:00', '12:00:00', 'PRESENTE', 'REGULAR', 'Media jornada por cita médica'),
(6, '2025-02-24', 'COMPLETA', '08:00:00', '17:00:00', 'PRESENTE', 'REGULAR', NULL),
(7, '2025-02-24', 'COMPLETA', '09:00:00', '17:00:00', 'TARDANZA', 'REGULAR', 'Llegó tarde');

-- -----------------------------------------------
-- 2.16 PAGO (10 registros - combinación única IdEmpleado+Semana+Anio)
-- -----------------------------------------------
INSERT INTO PAGO (IdEmpleado, Semana, Anio, FechaInicio, FechaFin, HorasTrabajadas, SueldoSemanal, Bonificaciones, Descuentos, TotalPago, Estado, FechaPago, MetodoPago, Comentarios) VALUES
(1, 8, 2025, '2025-02-17', '2025-02-23', 43.00, 500.00, 0.00, 0.00, 500.00, 'PAGADO', '2025-02-23', 'TRANSFERENCIA', 'Semana completa'),
(2, 8, 2025, '2025-02-17', '2025-02-23', 43.00, 280.00, 20.00, 0.00, 300.00, 'PAGADO', '2025-02-23', 'TRANSFERENCIA', 'Bonificación por rendimiento'),
(3, 8, 2025, '2025-02-17', '2025-02-23', 40.00, 222.79, 0.00, 10.00, 212.79, 'PAGADO', '2025-02-23', 'TRANSFERENCIA', 'Descuento por préstamo'),
(4, 8, 2025, '2025-02-17', '2025-02-23', 43.00, 350.00, 50.00, 0.00, 400.00, 'PAGADO', '2025-02-23', 'TRANSFERENCIA', 'Bonificación por supervisión'),
(5, 8, 2025, '2025-02-17', '2025-02-23', 43.00, 450.00, 0.00, 0.00, 450.00, 'PAGADO', '2025-02-23', 'TRANSFERENCIA', 'Semana completa'),
(6, 8, 2025, '2025-02-17', '2025-02-23', 43.00, 320.00, 0.00, 0.00, 320.00, 'PENDIENTE', NULL, 'TRANSFERENCIA', 'Pendiente de aprobación'),
(7, 8, 2025, '2025-02-17', '2025-02-23', 38.00, 230.23, 0.00, 15.00, 215.23, 'PENDIENTE', NULL, 'TRANSFERENCIA', 'Descuento por tardanzas'),
(8, 8, 2025, '2025-02-17', '2025-02-23', 43.00, 300.00, 30.00, 0.00, 330.00, 'PAGADO', '2025-02-23', 'TRANSFERENCIA', 'Bonificación por ventas'),
(9, 8, 2025, '2025-02-17', '2025-02-23', 43.00, 220.00, 0.00, 0.00, 220.00, 'PENDIENTE', NULL, 'EFECTIVO', 'Pago en efectivo'),
(10, 8, 2025, '2025-02-17', '2025-02-23', 43.00, 250.00, 0.00, 0.00, 250.00, 'PAGADO', '2025-02-23', 'TRANSFERENCIA', 'Semana completa');

-- -----------------------------------------------
-- 2.17 NOTIFICACIONES (10 registros)
-- -----------------------------------------------
INSERT INTO notificaciones (Tipo, Modulo, Mensaje, Detalle, Usuario, Leida) VALUES
('CREAR', 'clientes', 'Se registró un nuevo cliente', 'Cliente: Constructora Los Andes S.A.C.', 'Juan Carlos Perez Lopez', 1),
('CREAR', 'proformas', 'Se creó una nueva proforma', 'Proforma: PRO-2025-001 por S/ 2,419.00', 'Juan Carlos Perez Lopez', 1),
('ACTUALIZAR', 'proformas', 'Se aprobó una proforma', 'Proforma: PRO-2025-001 cambió a APROBADA', 'Juan Carlos Perez Lopez', 1),
('CREAR', 'facturas', 'Se generó una nueva factura', 'Factura: FAC-2025-001 por S/ 2,419.00', 'Juan Carlos Perez Lopez', 1),
('CREAR', 'productos', 'Se registró un nuevo producto', 'Producto: Bomba Sumergible 1HP', 'Juan Carlos Perez Lopez', 0),
('ACTUALIZAR', 'facturas', 'Se actualizó estado de factura', 'Factura: FAC-2025-001 cambió a PAGADA', 'Juan Carlos Perez Lopez', 0),
('CREAR', 'empleados', 'Se registró un nuevo empleado', 'Empleado: Maria Elena Garcia Torres', 'Juan Carlos Perez Lopez', 0),
('ELIMINAR', 'clientes', 'Se desactivó un cliente', 'Cliente: Universidad Nacional de Ingenieria', 'Ana Lucia Martinez Rios', 0),
('CREAR', 'contratos', 'Se creó un nuevo contrato', 'Contrato: CON-2025-001 con Constructora Los Andes', 'Juan Carlos Perez Lopez', 0),
('ACTUALIZAR', 'empleados', 'Se actualizó información de empleado', 'Empleado: Pedro Antonio Rodriguez Silva - Cambio de área', 'Ana Lucia Martinez Rios', 0);


--Insertar registros para auditoría (10 registros)
insert into auditoria (Usuario, Accion, Tabla, Detalle) values
('Juan Carlos Perez Lopez', 'INSERT', 'CLIENTE', 'Se registró el cliente Constructora Los Andes S.A.C.'),
('Juan Carlos Perez Lopez', 'INSERT', 'PROFORMA', 'Se creó la proforma PRO-2025-001 por S/ 2,419.00'),
('Juan Carlos Perez Lopez', 'UPDATE', 'PROFORMA', 'Proforma PRO-2025-001 cambió a APROBADA'),
('Juan Carlos Perez Lopez', 'INSERT', 'FACTURA', 'Se generó la factura FAC-2025-001 por S/ 2,419.00'),
('Juan Carlos Perez Lopez', 'INSERT', 'PRODUCTO', 'Se registró el producto Bomba Sumergible 1HP'),
('Juan Carlos Perez Lopez', 'UPDATE', 'FACTURA', 'Factura FAC-2025-001 cambió a PAGADA'),
('Juan Carlos Perez Lopez', 'INSERT', 'EMPLEADO', 'Se registró el empleado Maria Elena Garcia Torres'),
('Ana Lucia Martinez Rios', 'DELETE', 'CLIENTE', 'Se desactivó el cliente Universidad Nacional de Ingenieria'),
('Juan Carlos Perez Lopez', 'INSERT', 'CONTRATO', 'Se creó el contrato CON-2025-001 con Constructora Los Andes'),
('Ana Lucia Martinez Rios', 'UPDATE', 'EMPLEADO', 'Empleado Pedro Antonio Rodriguez Silva - Cambio de área');



-- =============================================
-- 3. PROCEDIMIENTOS ALMACENADOS
-- =============================================

-- -----------------------------------------------
-- 3.1 Procedimiento: CalcularPagoSemanal
-- -----------------------------------------------
DELIMITER //
CREATE PROCEDURE CalcularPagoSemanal(
    IN p_IdEmpleado INT,
    IN p_Semana INT,
    IN p_Anio INT,
    IN p_FechaInicio DATE,
    IN p_FechaFin DATE,
    IN p_Bonificaciones DECIMAL(12,2),
    IN p_Descuentos DECIMAL(12,2)
)
BEGIN
    DECLARE v_HorasTrabajadas DECIMAL(10,2) DEFAULT 0;
    DECLARE v_SueldoBase DECIMAL(12,2) DEFAULT 0;
    DECLARE v_SueldoCalculado DECIMAL(12,2) DEFAULT 0;
    DECLARE v_TotalPago DECIMAL(12,2) DEFAULT 0;
    DECLARE v_HorasSemanaNormal DECIMAL(5,2) DEFAULT 43;
    DECLARE v_ValorPorHora DECIMAL(10,4) DEFAULT 0;
    
    -- Manejar valores NULL para bonificaciones y descuentos
    IF p_Bonificaciones IS NULL THEN
        SET p_Bonificaciones = 0;
    END IF;
    
    IF p_Descuentos IS NULL THEN
        SET p_Descuentos = 0;
    END IF;
    
    -- Calcular total de horas trabajadas del empleado en el rango de fechas
    SELECT COALESCE(SUM(HorasTrabajadas), 0) INTO v_HorasTrabajadas
    FROM ASISTENCIA
    WHERE IdEmpleado = p_IdEmpleado
      AND Fecha BETWEEN p_FechaInicio AND p_FechaFin
      AND Estado IN ('PRESENTE', 'TARDANZA');
    
    -- Obtener sueldo base semanal del empleado
    SELECT COALESCE(SueldoBase, 0) INTO v_SueldoBase
    FROM EMPLEADO
    WHERE IdEmpleado = p_IdEmpleado;
    
    -- Calcular valor por hora y sueldo proporcional
    IF v_SueldoBase > 0 THEN
        SET v_ValorPorHora = v_SueldoBase / v_HorasSemanaNormal;
        SET v_SueldoCalculado = ROUND(v_ValorPorHora * v_HorasTrabajadas, 2);
    END IF;
    
    -- Calcular el total a pagar
    SET v_TotalPago = v_SueldoCalculado + p_Bonificaciones - p_Descuentos;
    
    -- Insertar o actualizar el registro de pago
    INSERT INTO PAGO(
        IdEmpleado, Semana, Anio, FechaInicio, FechaFin,
        HorasTrabajadas, SueldoSemanal, Bonificaciones,
        Descuentos, TotalPago, Estado
    )
    VALUES(
        p_IdEmpleado, p_Semana, p_Anio, p_FechaInicio, p_FechaFin,
        v_HorasTrabajadas, v_SueldoCalculado, p_Bonificaciones,
        p_Descuentos, v_TotalPago, 'PENDIENTE'
    )
    ON DUPLICATE KEY UPDATE
        HorasTrabajadas = v_HorasTrabajadas,
        SueldoSemanal = v_SueldoCalculado,
        Bonificaciones = p_Bonificaciones,
        Descuentos = p_Descuentos,
        TotalPago = v_TotalPago;
        
    -- Retornar los valores calculados
    SELECT 
        v_HorasTrabajadas AS HorasCalculadas, 
        v_SueldoCalculado AS SueldoCalculado, 
        v_TotalPago AS TotalCalculado;
END //
DELIMITER ;

-- -----------------------------------------------
-- 3.2 Procedimiento: RegistrarAsistencia
-- -----------------------------------------------
DELIMITER //
CREATE PROCEDURE RegistrarAsistencia(
    IN p_IdEmpleado INT,
    IN p_Fecha DATE,
    IN p_JornadaLaboral VARCHAR(20),
    IN p_HoraEntrada TIME,
    IN p_HoraSalida TIME,
    IN p_TipoAsistencia VARCHAR(20),
    IN p_Observaciones TEXT
)
BEGIN
    DECLARE v_Estado VARCHAR(20) DEFAULT 'PRESENTE';
    
    -- Manejar valores NULL
    IF p_TipoAsistencia IS NULL THEN
        SET p_TipoAsistencia = 'REGULAR';
    END IF;
    
    IF p_JornadaLaboral IS NULL THEN
        SET p_JornadaLaboral = 'COMPLETA';
    END IF;
    
    -- Determinar el estado basándose en la jornada y hora de entrada
    IF p_HoraEntrada IS NULL THEN
        SET v_Estado = 'AUSENTE';
    ELSE
        CASE p_JornadaLaboral
            WHEN 'COMPLETA' THEN
                IF TIME(p_HoraEntrada) > '08:30:00' THEN
                    SET v_Estado = 'TARDANZA';
                END IF;
            WHEN 'MEDIO_MANANA' THEN
                IF TIME(p_HoraEntrada) > '08:30:00' THEN
                    SET v_Estado = 'TARDANZA';
                END IF;
            WHEN 'MEDIO_TARDE' THEN
                IF TIME(p_HoraEntrada) > '13:30:00' THEN
                    SET v_Estado = 'TARDANZA';
                END IF;
            WHEN 'NOCTURNO' THEN
                IF TIME(p_HoraEntrada) > '22:30:00' THEN
                    SET v_Estado = 'TARDANZA';
                END IF;
            ELSE
                SET v_Estado = 'PRESENTE';
        END CASE;
    END IF;
    
    INSERT INTO ASISTENCIA(
        IdEmpleado, Fecha, JornadaLaboral,
        HoraEntrada, HoraSalida, TipoAsistencia,
        Estado, Observaciones
    )
    VALUES(
        p_IdEmpleado, p_Fecha, p_JornadaLaboral,
        p_HoraEntrada, p_HoraSalida, p_TipoAsistencia,
        v_Estado, p_Observaciones
    )
    ON DUPLICATE KEY UPDATE
        JornadaLaboral = p_JornadaLaboral,
        HoraEntrada = p_HoraEntrada,
        HoraSalida = p_HoraSalida,
        TipoAsistencia = p_TipoAsistencia,
        Estado = v_Estado,
        Observaciones = p_Observaciones;
END //
DELIMITER ;

-- =============================================
-- 4. FUNCIÓN
-- =============================================

DELIMITER //
CREATE FUNCTION ObtenerHorasTrabajadasRango(
    p_IdEmpleado INT,
    p_FechaInicio DATE,
    p_FechaFin DATE
) RETURNS DECIMAL(10,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_TotalHoras DECIMAL(10,2) DEFAULT 0;
    
    SELECT COALESCE(SUM(HorasTrabajadas), 0) INTO v_TotalHoras
    FROM ASISTENCIA
    WHERE IdEmpleado = p_IdEmpleado
      AND Fecha BETWEEN p_FechaInicio AND p_FechaFin
      AND Estado IN ('PRESENTE', 'TARDANZA');
    
    RETURN v_TotalHoras;
END //
DELIMITER ;

-- =============================================
-- 5. VISTA
-- =============================================

CREATE VIEW VistaAsistenciaSemanal AS
SELECT 
    e.IdEmpleado,
    CONCAT(u.Nombres, ' ', u.Apellidos) AS NombreEmpleado,
    YEAR(a.Fecha) AS Anio,
    WEEK(a.Fecha, 1) AS Semana,
    DATE(DATE_SUB(a.Fecha, INTERVAL WEEKDAY(a.Fecha) DAY)) AS FechaInicioSemana,
    DATE(DATE_ADD(DATE_SUB(a.Fecha, INTERVAL WEEKDAY(a.Fecha) DAY), INTERVAL 6 DAY)) AS FechaFinSemana,
    COUNT(CASE WHEN a.Estado = 'PRESENTE' THEN 1 END) AS DiasPresente,
    COUNT(CASE WHEN a.Estado = 'TARDANZA' THEN 1 END) AS DiasTardanza,
    COUNT(CASE WHEN a.Estado = 'AUSENTE' THEN 1 END) AS DiasAusente,
    COALESCE(SUM(a.HorasTrabajadas), 0) AS TotalHorasTrabajadas,
    e.SueldoBase
FROM EMPLEADO e
INNER JOIN USUARIO u ON e.IdUsuario = u.IdUsuario
LEFT JOIN ASISTENCIA a ON e.IdEmpleado = a.IdEmpleado
WHERE e.Estado = 'ACTIVO'
GROUP BY e.IdEmpleado, YEAR(a.Fecha), WEEK(a.Fecha, 1), 
         u.Nombres, u.Apellidos, e.SueldoBase;

-- =============================================
-- 6. TRIGGERS (creados después de los datos)
-- =============================================

DELIMITER //

-- Trigger: Al insertar una factura, crear registro en VENTA
CREATE TRIGGER after_factura_insert
AFTER INSERT ON FACTURA
FOR EACH ROW
BEGIN
    IF NEW.Estado = 'PAGADA' THEN
        INSERT INTO VENTA (IdFactura, FechaVenta, Total, Estado)
        VALUES (NEW.IdFactura, NEW.FechaEmision, NEW.Total, 'COMPLETADA');
    ELSE
        INSERT INTO VENTA (IdFactura, FechaVenta, Total, Estado)
        VALUES (NEW.IdFactura, NEW.FechaEmision, NEW.Total, NEW.Estado);
    END IF;
END//

-- Trigger: Al actualizar una factura, actualizar registro en VENTA
CREATE TRIGGER after_factura_update
AFTER UPDATE ON FACTURA
FOR EACH ROW
BEGIN
    DECLARE venta_count INT;
    
    IF NEW.Estado = 'PAGADA' AND OLD.Estado != 'PAGADA' THEN
        SELECT COUNT(*) INTO venta_count FROM VENTA WHERE IdFactura = NEW.IdFactura;
        
        IF venta_count > 0 THEN
            UPDATE VENTA 
            SET Estado = 'COMPLETADA', FechaVenta = NEW.FechaEmision, Total = NEW.Total
            WHERE IdFactura = NEW.IdFactura;
        ELSE
            INSERT INTO VENTA (IdFactura, FechaVenta, Total, Estado)
            VALUES (NEW.IdFactura, NEW.FechaEmision, NEW.Total, 'COMPLETADA');
        END IF;
    ELSE
        UPDATE VENTA 
        SET Estado = NEW.Estado, Total = NEW.Total
        WHERE IdFactura = NEW.IdFactura;
    END IF;
END//

DELIMITER ;

-- =============================================
-- FIN DEL SCRIPT
-- =============================================

-- Verificar la creación de tablas
SELECT 'TABLAS CREADAS' AS Resultado, COUNT(*) AS Total 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'DBVENTASDEMO';

-- Verificar registros insertados
SELECT 'ROL' AS Tabla, COUNT(*) AS Registros FROM ROL
UNION ALL SELECT 'PERMISO', COUNT(*) FROM PERMISO
UNION ALL SELECT 'USUARIO', COUNT(*) FROM USUARIO
UNION ALL SELECT 'EMPRESA', COUNT(*) FROM EMPRESA
UNION ALL SELECT 'CLIENTE', COUNT(*) FROM CLIENTE
UNION ALL SELECT 'PRODUCTO', COUNT(*) FROM PRODUCTO
UNION ALL SELECT 'PROFORMA', COUNT(*) FROM PROFORMA
UNION ALL SELECT 'DETALLE_PROFORMA', COUNT(*) FROM DETALLE_PROFORMA
UNION ALL SELECT 'CONDICIONES_PRODUCTO', COUNT(*) FROM CONDICIONES_PRODUCTO
UNION ALL SELECT 'FACTURA', COUNT(*) FROM FACTURA
UNION ALL SELECT 'DETALLE_FACTURA', COUNT(*) FROM DETALLE_FACTURA
UNION ALL SELECT 'VENTA', COUNT(*) FROM VENTA
UNION ALL SELECT 'CONTRATO', COUNT(*) FROM CONTRATO
UNION ALL SELECT 'EMPLEADO', COUNT(*) FROM EMPLEADO
UNION ALL SELECT 'ASISTENCIA', COUNT(*) FROM ASISTENCIA
UNION ALL SELECT 'PAGO', COUNT(*) FROM PAGO
UNION ALL SELECT 'notificaciones', COUNT(*) FROM notificaciones;
