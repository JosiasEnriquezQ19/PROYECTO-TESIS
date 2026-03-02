-- Script para crear los triggers que automatizan la tabla VENTA con las facturas

-- Paso 1: Conectarse a la base de datos correcta
USE DBVENTASDEMO;

-- Paso 2: Eliminar triggers previos si existen
DROP TRIGGER IF EXISTS after_factura_insert;
DROP TRIGGER IF EXISTS after_factura_update;

-- Paso 3: Crear el trigger que se ejecuta después de insertar una factura
DELIMITER //
CREATE TRIGGER after_factura_insert
AFTER INSERT ON FACTURA
FOR EACH ROW
BEGIN
    -- Si la factura está en estado "PAGADA", la insertamos en la tabla VENTA
    IF NEW.Estado = 'PAGADA' THEN
        INSERT INTO VENTA (IdFactura, FechaVenta, Total, Estado)
        VALUES (NEW.IdFactura, NEW.FechaEmision, NEW.Total, 'COMPLETADA');
    ELSE
        -- Si está en otro estado (PENDIENTE, etc), también la registramos pero con ese estado
        INSERT INTO VENTA (IdFactura, FechaVenta, Total, Estado)
        VALUES (NEW.IdFactura, NEW.FechaEmision, NEW.Total, NEW.Estado);
    END IF;
END//

-- Paso 4: Crear el trigger que se ejecuta después de actualizar una factura
CREATE TRIGGER after_factura_update
AFTER UPDATE ON FACTURA
FOR EACH ROW
BEGIN
    -- Si el estado cambió a "PAGADA"
    IF NEW.Estado = 'PAGADA' AND OLD.Estado != 'PAGADA' THEN
        -- Verificamos si ya existe un registro en VENTA para esta factura
        DECLARE venta_count INT;
        SELECT COUNT(*) INTO venta_count FROM VENTA WHERE IdFactura = NEW.IdFactura;
        
        IF venta_count > 0 THEN
            -- Actualiza el registro existente
            UPDATE VENTA 
            SET Estado = 'COMPLETADA', FechaVenta = NEW.FechaEmision, Total = NEW.Total
            WHERE IdFactura = NEW.IdFactura;
        ELSE
            -- Inserta un nuevo registro
            INSERT INTO VENTA (IdFactura, FechaVenta, Total, Estado)
            VALUES (NEW.IdFactura, NEW.FechaEmision, NEW.Total, 'COMPLETADA');
        END IF;
    ELSE
        -- Para otros cambios de estado, actualizamos el registro en VENTA si existe
        UPDATE VENTA 
        SET Estado = NEW.Estado, Total = NEW.Total
        WHERE IdFactura = NEW.IdFactura;
    END IF;
END//
DELIMITER ;

-- Paso 5: Verificar los triggers creados
SHOW TRIGGERS LIKE 'FACTURA';

-- Paso 6: Actualizar las facturas existentes para insertarlas en la tabla VENTA
-- Este paso es opcional, pero útil para cargar datos históricos
INSERT INTO VENTA (IdFactura, FechaVenta, Total, Estado)
SELECT 
    f.IdFactura, 
    f.FechaEmision, 
    f.Total, 
    CASE WHEN f.Estado = 'PAGADA' THEN 'COMPLETADA' ELSE f.Estado END
FROM FACTURA f
LEFT JOIN VENTA v ON f.IdFactura = v.IdFactura
WHERE v.IdVenta IS NULL;

-- Paso 7: Verificar los datos en la tabla VENTA
SELECT * FROM VENTA;
