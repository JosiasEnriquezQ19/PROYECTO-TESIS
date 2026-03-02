/**
 * Script para instalar los triggers necesarios para mantener la tabla VENTA sincronizada
 * Este script puede ejecutarse directamente con Node.js para aplicar los triggers
 * a la base de datos sin necesidad de herramientas externas como phpMyAdmin
 */
const conexion = require('./conexion');

async function instalarTriggers() {
    console.log('=== INICIANDO INSTALACIÓN DE TRIGGERS DE VENTA ===');
    
    try {
        // Primero verificamos si la tabla VENTA existe
        const [tablas] = await conexion.query("SHOW TABLES LIKE 'VENTA'");
        if (tablas.length === 0) {
            console.error('Error: La tabla VENTA no existe en la base de datos.');
            return;
        }
        console.log('✓ Tabla VENTA existe');
        
        // Eliminar triggers existentes si existen
        console.log('Eliminando triggers existentes...');
        await conexion.query("DROP TRIGGER IF EXISTS after_factura_insert");
        await conexion.query("DROP TRIGGER IF EXISTS after_factura_update");
        console.log('✓ Triggers antiguos eliminados');
        
        // Crear trigger para inserción de facturas
        console.log('Creando trigger after_factura_insert...');
        await conexion.query(`
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
            END
        `);
        console.log('✓ Trigger after_factura_insert creado');
        
        // Crear trigger para actualización de facturas
        console.log('Creando trigger after_factura_update...');
        await conexion.query(`
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
            END
        `);
        console.log('✓ Trigger after_factura_update creado');
        
        // Verificar triggers instalados
        const [triggersInstalados] = await conexion.query("SHOW TRIGGERS WHERE `Table` = 'FACTURA'");
        console.log('Triggers instalados:', triggersInstalados.map(t => t.Trigger));
        
        // Actualizar ventas existentes
        console.log('Verificando facturas sin registro en VENTA...');
        const [facturasSinVenta] = await conexion.query(`
            SELECT COUNT(*) as total FROM FACTURA f
            LEFT JOIN VENTA v ON f.IdFactura = v.IdFactura
            WHERE v.IdVenta IS NULL
        `);
        
        if (facturasSinVenta[0].total > 0) {
            console.log(`Se encontraron ${facturasSinVenta[0].total} facturas sin registro en VENTA. Actualizando...`);
            
            const [resultInsert] = await conexion.query(`
                INSERT INTO VENTA (IdFactura, FechaVenta, Total, Estado)
                SELECT 
                    f.IdFactura, 
                    f.FechaEmision, 
                    f.Total, 
                    CASE WHEN f.Estado = 'PAGADA' THEN 'COMPLETADA' ELSE f.Estado END
                FROM FACTURA f
                LEFT JOIN VENTA v ON f.IdFactura = v.IdFactura
                WHERE v.IdVenta IS NULL
            `);
            
            console.log(`✓ Se insertaron ${resultInsert.affectedRows} registros en VENTA`);
        } else {
            console.log('✓ No se encontraron facturas sin registro en VENTA');
        }
        
        // Mostrar algunos registros de ejemplo
        const [muestra] = await conexion.query('SELECT * FROM VENTA LIMIT 5');
        console.log('Muestra de registros en VENTA:', muestra);
        
        console.log('=== INSTALACIÓN DE TRIGGERS COMPLETADA ===');
    } catch (error) {
        console.error('Error al instalar triggers:', error);
    } finally {
        // Cerrar conexión
        conexion.end();
    }
}

// Ejecutar la función principal
instalarTriggers();
