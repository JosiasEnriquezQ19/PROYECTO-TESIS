const conexion = require('../bd/conexion');

class Factura {
    constructor() {
        this.conexion = conexion;
    }

    // Obtener todas las facturas con datos relacionados
    async listar() {
        try {
            const query = `
                SELECT 
                    f.IdFactura,
                    f.Codigo,
                    f.IdProforma,
                    f.IdUsuario,
                    f.IdCliente,
                    f.IdEmpresa,
                    f.FechaEmision,
                    f.FechaVencimiento,
                    f.SubTotal,
                    f.TotalIGV,
                    f.Total,
                    f.Estado,
                    f.FormaPago,
                    f.Observaciones,
                    f.FechaRegistro,
                    c.RazonSocial as ClienteNombre,
                    c.Documento as ClienteDocumento,
                    c.Email as ClienteEmail,
                    c.Direccion as ClienteDireccion,
                    c.Contacto as ClienteContacto,
                    u.Nombres as UsuarioNombre,
                    u.Apellidos as UsuarioApellido,
                    e.Nombre as EmpresaNombre,
                    e.RUC as EmpresaRUC,
                    p.Codigo as ProformaCodigo
                FROM FACTURA f
                LEFT JOIN CLIENTE c ON f.IdCliente = c.IdCliente
                LEFT JOIN USUARIO u ON f.IdUsuario = u.IdUsuario
                LEFT JOIN EMPRESA e ON f.IdEmpresa = e.IdEmpresa
                LEFT JOIN PROFORMA p ON f.IdProforma = p.IdProforma
                ORDER BY f.FechaRegistro DESC
            `;
            
            const [rows] = await this.conexion.execute(query);
            return rows;
        } catch (error) {
            console.error('Error al listar facturas:', error);
            throw error;
        }
    }

    // Obtener factura por ID con todos los detalles
    async obtenerPorId(idFactura) {
        try {
            // Obtener datos de la factura
            const queryFactura = `
                SELECT 
                    f.IdFactura,
                    f.Codigo,
                    f.IdProforma,
                    f.IdUsuario,
                    f.IdCliente,
                    f.IdEmpresa,
                    f.FechaEmision,
                    f.FechaVencimiento,
                    f.SubTotal,
                    f.TotalIGV,
                    f.Total,
                    f.Estado,
                    f.FormaPago,
                    f.Observaciones,
                    f.FechaRegistro,
                    c.RazonSocial as ClienteNombre,
                    c.Documento as ClienteDocumento,
                    c.Email as ClienteEmail,
                    c.Direccion as ClienteDireccion,
                    c.Contacto as ClienteContacto,
                    u.Nombres as UsuarioNombre,
                    u.Apellidos as UsuarioApellido,
                    e.Nombre as EmpresaNombre,
                    e.RUC as EmpresaRUC,
                    e.Direccion as EmpresaDireccion,
                    e.Telefono as EmpresaTelefono,
                    e.CuentaBancaria as EmpresaCuentaBancaria,
                    e.NombreCuentaBancaria as EmpresaNombreCuentaBancaria,
                    p.Codigo as ProformaCodigo
                FROM FACTURA f
                LEFT JOIN CLIENTE c ON f.IdCliente = c.IdCliente
                LEFT JOIN USUARIO u ON f.IdUsuario = u.IdUsuario
                LEFT JOIN EMPRESA e ON f.IdEmpresa = e.IdEmpresa
                LEFT JOIN PROFORMA p ON f.IdProforma = p.IdProforma
                WHERE f.IdFactura = ?
            `;
            
            const [facturaRows] = await this.conexion.execute(queryFactura, [idFactura]);
            
            if (facturaRows.length === 0) {
                return null;
            }
            
            const factura = facturaRows[0];
            
            // Obtener detalles de la factura - NUEVA CONSULTA MEJORADA
            console.log('=== INICIANDO CONSULTA DE DETALLES ===');
            console.log('ID Factura a consultar:', idFactura);
            
            // PRIMERA CONSULTA: Verificar si existen detalles básicos
            console.log('1. Verificando existencia de detalles...');
            const [verificacionSimple] = await this.conexion.execute(
                'SELECT COUNT(*) as total FROM DETALLE_FACTURA WHERE IdFactura = ?', 
                [idFactura]
            );
            console.log(`Detalles encontrados en BD: ${verificacionSimple[0].total}`);
            
            if (verificacionSimple[0].total === 0) {
                console.log('❌ NO HAY DETALLES EN LA BASE DE DATOS');
                return {
                    factura: factura,
                    detalles: []
                };
            }
            
            // SEGUNDA CONSULTA: Obtener detalles completos con manejo robusto de JOIN
            console.log('2. Obteniendo detalles completos...');
            const queryDetalles = `
                SELECT 
                    df.IdDetalleFactura,
                    df.IdFactura,
                    df.IdProducto,
                    df.Cantidad,
                    df.UnidadMedida,
                    df.PrecioUnitario,
                    df.Total,
                    df.DescripcionAdicional,
                    df.FechaRegistro,
                    CASE 
                        WHEN prod.Nombre IS NULL THEN CONCAT('Producto ID: ', df.IdProducto)
                        ELSE prod.Nombre 
                    END as ProductoNombre,
                    COALESCE(prod.Descripcion, 'Sin descripción') as ProductoDescripcion,
                    COALESCE(prod.PrecioUnitario, df.PrecioUnitario) as ProductoPrecio,
                    COALESCE(prod.Codigo, CONCAT('PROD-', df.IdProducto)) as CodigoProducto
                FROM DETALLE_FACTURA df
                LEFT JOIN PRODUCTO prod ON df.IdProducto = prod.IdProducto
                WHERE df.IdFactura = ?
                ORDER BY df.IdDetalleFactura
            `;
            
            console.log('Ejecutando consulta con JOIN...');
            console.log('SQL:', queryDetalles);
            
            const [detalleRows] = await this.conexion.execute(queryDetalles, [idFactura]);
            
            return {
                factura: factura,
                detalles: detalleRows
            };
            
        } catch (error) {
            console.error('Error al obtener factura por ID:', error);
            throw error;
        }
    }

    // Crear nueva factura
    async crear(datosFactura, detalles) {
        let connection;
        
        try {
            // Obtener una conexión dedicada para la transacción
            connection = await this.conexion.getConnection();
            await connection.beginTransaction();
            
            // Validar que la proforma esté aprobada (si se proporciona IdProforma)
            if (datosFactura.IdProforma) {
                const queryProforma = `
                    SELECT Estado 
                    FROM PROFORMA 
                    WHERE IdProforma = ?
                `;
                const [proformaRows] = await connection.execute(queryProforma, [datosFactura.IdProforma]);
                
                if (proformaRows.length === 0) {
                    throw new Error('La proforma especificada no existe');
                }
                
                if (proformaRows[0].Estado !== 'APROBADA') {
                    throw new Error('Solo se pueden generar facturas de proformas aprobadas. Estado actual: ' + proformaRows[0].Estado);
                }
            }
            
            // Generar código de factura
            const codigo = await this.generarCodigo();
            
            // Calcular totales si no están presentes
            let subTotal = datosFactura.SubTotal || 0;
            let totalIGV = datosFactura.TotalIGV || 0;
            let total = datosFactura.Total || 0;
            
            // Si hay detalles y no se calcularon totales, calcularlos
            if (detalles && detalles.length > 0 && (!datosFactura.SubTotal || datosFactura.SubTotal === 0)) {
                subTotal = 0;
                detalles.forEach(detalle => {
                    const cantidad = parseFloat(detalle.Cantidad || 0);
                    const precio = parseFloat(detalle.PrecioUnitario || 0);
                    const totalDetalle = cantidad * precio;
                    subTotal += totalDetalle;
                    
                    // Actualizar el total en el detalle
                    detalle.Total = totalDetalle;
                });
                
                totalIGV = subTotal * 0.18;
                total = subTotal + totalIGV;
            }
            
            // Insertar factura
            const queryFactura = `
                INSERT INTO FACTURA (
                    Codigo, IdProforma, IdUsuario, IdCliente, IdEmpresa,
                    FechaEmision, FechaVencimiento, SubTotal, TotalIGV, Total,
                    Estado, FormaPago, Observaciones
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const [resultFactura] = await connection.execute(queryFactura, [
                codigo,
                datosFactura.IdProforma || null,
                datosFactura.IdUsuario,
                datosFactura.IdCliente,
                datosFactura.IdEmpresa,
                datosFactura.FechaEmision || new Date().toISOString().split('T')[0],
                datosFactura.FechaVencimiento || null,
                subTotal,
                totalIGV,
                total,
                datosFactura.Estado || 'PENDIENTE',
                datosFactura.FormaPago || null,
                datosFactura.Observaciones || null
            ]);
            
            const idFactura = resultFactura.insertId;
            
            // Insertar detalles
            if (detalles && detalles.length > 0) {
                console.log(`=== INSERTANDO ${detalles.length} DETALLES EN FACTURA ${idFactura} ===`);
                const queryDetalle = `
                    INSERT INTO DETALLE_FACTURA (
                        IdFactura, IdProducto, Cantidad, UnidadMedida,
                        PrecioUnitario, Total, DescripcionAdicional
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                `;
                
                for (let i = 0; i < detalles.length; i++) {
                    const detalle = detalles[i];
                    try {
                        // Logging para depurar cada detalle que se va a insertar
                        console.log(`Insertando detalle ${i + 1}/${detalles.length}:`, {
                            IdFactura: idFactura,
                            IdProducto: detalle.IdProducto,
                            Cantidad: detalle.Cantidad || 1,
                            UnidadMedida: detalle.UnidadMedida || 'UNID',
                            PrecioUnitario: detalle.PrecioUnitario || 0,
                            Total: detalle.Total || 0,
                            DescripcionAdicional: detalle.DescripcionAdicional || null
                        });
                        
                        const result = await connection.execute(queryDetalle, [
                            idFactura,
                            detalle.IdProducto,
                            detalle.Cantidad || 1,
                            detalle.UnidadMedida || 'UNID',
                            detalle.PrecioUnitario || 0,
                            detalle.Total || 0,
                            detalle.DescripcionAdicional || null
                        ]);
                        
                        console.log(`✅ Detalle ${i + 1} insertado con éxito. ID: ${result.insertId || 'N/A'}`);
                        
                        // VERIFICAR INMEDIATAMENTE que se insertó
                        const [verificacion] = await connection.execute(
                            'SELECT * FROM DETALLE_FACTURA WHERE IdFactura = ? AND IdProducto = ?',
                            [idFactura, detalle.IdProducto]
                        );
                        console.log(`Verificación inmediata detalle ${i + 1}: ${verificacion.length} registros encontrados`);
                        
                    } catch (detalleError) {
                        console.error(`❌ Error insertando detalle ${i + 1}:`, detalleError);
                        console.error('Detalle que falló:', detalle);
                        throw detalleError; // Re-lanzar el error para que la transacción se revierta
                    }
                }
                console.log("=== FIN INSERCION DETALLES ===");
            } else {
                console.log("⚠️ WARNING: No hay detalles para insertar en la factura");
                console.log("Valor de detalles recibido:", detalles);
            }
            
            await connection.commit();
            
            // VERIFICACIÓN FINAL: Comprobar que los detalles están en la base de datos después del commit
            console.log('=== VERIFICACIÓN FINAL DESPUÉS DEL COMMIT ===');
            const [verificacionFinal] = await this.conexion.execute(
                'SELECT COUNT(*) as total FROM DETALLE_FACTURA WHERE IdFactura = ?',
                [idFactura]
            );
            console.log(`Total detalles en BD después del commit: ${verificacionFinal[0].total}`);
            console.log('=== FIN VERIFICACIÓN FINAL ===');
            
            return idFactura;
            
        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            console.error('Error al crear factura:', error);
            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    // Actualizar factura
    async actualizar(idFactura, datosFactura, detalles) {
        let connection;
        
        try {
            // Obtener una conexión dedicada para la transacción
            connection = await this.conexion.getConnection();
            await connection.beginTransaction();
            
            // Actualizar factura
            const queryFactura = `
                UPDATE FACTURA SET
                    IdProforma = ?, IdCliente = ?, FechaEmision = ?, FechaVencimiento = ?,
                    SubTotal = ?, TotalIGV = ?, Total = ?, Estado = ?,
                    FormaPago = ?, Observaciones = ?
                WHERE IdFactura = ?
            `;
            
            await connection.execute(queryFactura, [
                datosFactura.IdProforma || null,
                datosFactura.IdCliente,
                datosFactura.FechaEmision,
                datosFactura.FechaVencimiento || null,
                datosFactura.SubTotal,
                datosFactura.TotalIGV,
                datosFactura.Total,
                datosFactura.Estado,
                datosFactura.FormaPago || null,
                datosFactura.Observaciones || null,
                idFactura
            ]);
            
            // Eliminar detalles existentes
            const deleteResult = await connection.execute('DELETE FROM DETALLE_FACTURA WHERE IdFactura = ?', [idFactura]);
            
            // Insertar nuevos detalles
            if (detalles && detalles.length > 0) {
                const queryDetalle = `
                    INSERT INTO DETALLE_FACTURA (
                        IdFactura, IdProducto, Cantidad, UnidadMedida,
                        PrecioUnitario, Total, DescripcionAdicional
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                `;
                
                for (const detalle of detalles) {
                    await connection.execute(queryDetalle, [
                        idFactura,
                        detalle.IdProducto,
                        detalle.Cantidad,
                        detalle.UnidadMedida || 'UNID',
                        detalle.PrecioUnitario,
                        detalle.Total,
                        detalle.DescripcionAdicional || null
                    ]);
                }
            }
            
            await connection.commit();
            return true;
            
        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            console.error('Error al actualizar factura:', error);
            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    // Actualizar solo datos de la factura sin modificar detalles
    async actualizarSoloFactura(idFactura, datosFactura) {
        try {
            const queryFactura = `
                UPDATE FACTURA SET
                    IdProforma = ?, IdCliente = ?, FechaEmision = ?, FechaVencimiento = ?,
                    SubTotal = ?, TotalIGV = ?, Total = ?, Estado = ?,
                    FormaPago = ?, Observaciones = ?
                WHERE IdFactura = ?
            `;
            
            const [resultado] = await this.conexion.execute(queryFactura, [
                datosFactura.IdProforma || null,
                datosFactura.IdCliente,
                datosFactura.FechaEmision,
                datosFactura.FechaVencimiento || null,
                datosFactura.SubTotal,
                datosFactura.TotalIGV,
                datosFactura.Total,
                datosFactura.Estado,
                datosFactura.FormaPago || null,
                datosFactura.Observaciones || null,
                idFactura
            ]);
            
            return resultado.affectedRows > 0;
            
        } catch (error) {
            console.error('Error al actualizar solo factura:', error);
            throw error;
        }
    }

    // Eliminar factura
    async eliminar(idFactura) {
        let connection;
        
        try {
            // Obtener una conexión dedicada para la transacción
            connection = await this.conexion.getConnection();
            await connection.beginTransaction();
            
            console.log(`=== ELIMINANDO FACTURA ${idFactura} ===`);
            
            // 1. Eliminar registros de VENTA que referencien esta factura
            console.log('Eliminando registros de VENTA...');
            const [ventasEliminadas] = await connection.execute(
                'DELETE FROM VENTA WHERE IdFactura = ?', 
                [idFactura]
            );
            console.log(`Registros de VENTA eliminados: ${ventasEliminadas.affectedRows}`);
            
            // 2. Actualizar CONTRATO para quitar la referencia a la factura (no eliminar el contrato)
            console.log('Actualizando contratos para quitar referencia...');
            const [contratosActualizados] = await connection.execute(
                'UPDATE CONTRATO SET IdFactura = NULL WHERE IdFactura = ?', 
                [idFactura]
            );
            console.log(`Contratos actualizados: ${contratosActualizados.affectedRows}`);
            
            // 3. Eliminar detalles de la factura
            console.log('Eliminando detalles de factura...');
            const [detallesEliminados] = await connection.execute(
                'DELETE FROM DETALLE_FACTURA WHERE IdFactura = ?', 
                [idFactura]
            );
            console.log(`Detalles eliminados: ${detallesEliminados.affectedRows}`);
            
            // 4. Finalmente eliminar la factura
            console.log('Eliminando factura...');
            const [facturaEliminada] = await connection.execute(
                'DELETE FROM FACTURA WHERE IdFactura = ?', 
                [idFactura]
            );
            console.log(`Factura eliminada: ${facturaEliminada.affectedRows > 0 ? 'SÍ' : 'NO'}`);
            
            if (facturaEliminada.affectedRows === 0) {
                throw new Error('No se pudo eliminar la factura. Puede que no exista.');
            }
            
            await connection.commit();
            console.log('=== FACTURA ELIMINADA EXITOSAMENTE ===');
            return true;
            
        } catch (error) {
            if (connection) {
                await connection.rollback();
            }
            console.error('Error al eliminar factura:', error);
            console.error('Detalles del error:', {
                message: error.message,
                code: error.code,
                errno: error.errno,
                sqlState: error.sqlState,
                sqlMessage: error.sqlMessage
            });
            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    // Verificar si una factura puede ser eliminada
    async puedeEliminar(idFactura) {
        try {
            const verificaciones = {
                facturaExiste: false,
                tieneVentas: false,
                tieneContratos: false,
                detalles: 0,
                puedeEliminar: false,
                razon: ''
            };
            
            // Verificar si la factura existe
            const [factura] = await this.conexion.execute(
                'SELECT IdFactura, Estado FROM FACTURA WHERE IdFactura = ?', 
                [idFactura]
            );
            
            verificaciones.facturaExiste = factura.length > 0;
            
            if (!verificaciones.facturaExiste) {
                verificaciones.razon = 'La factura no existe';
                return verificaciones;
            }
            
            // Verificar si tiene ventas asociadas
            const [ventas] = await this.conexion.execute(
                'SELECT COUNT(*) as total FROM VENTA WHERE IdFactura = ?', 
                [idFactura]
            );
            verificaciones.tieneVentas = ventas[0].total > 0;
            
            // Verificar si tiene contratos asociados
            const [contratos] = await this.conexion.execute(
                'SELECT COUNT(*) as total FROM CONTRATO WHERE IdFactura = ?', 
                [idFactura]
            );
            verificaciones.tieneContratos = contratos[0].total > 0;
            
            // Contar detalles
            const [detalles] = await this.conexion.execute(
                'SELECT COUNT(*) as total FROM DETALLE_FACTURA WHERE IdFactura = ?', 
                [idFactura]
            );
            verificaciones.detalles = detalles[0].total;
            
            // Determinar si puede eliminar (siempre se puede eliminar, pero informamos qué se afectará)
            verificaciones.puedeEliminar = true;
            
            if (verificaciones.tieneVentas || verificaciones.tieneContratos) {
                verificaciones.razon = 'La factura tiene registros asociados que serán modificados: ';
                const afectados = [];
                if (verificaciones.tieneVentas) afectados.push(`${ventas[0].total} venta(s)`);
                if (verificaciones.tieneContratos) afectados.push(`${contratos[0].total} contrato(s)`);
                verificaciones.razon += afectados.join(', ');
            } else {
                verificaciones.razon = 'La factura puede eliminarse sin afectar otros registros';
            }
            
            return verificaciones;
            
        } catch (error) {
            console.error('Error al verificar si puede eliminar factura:', error);
            throw error;
        }
    }

    // Generar código único para la factura
    async generarCodigo() {
        try {
            const year = new Date().getFullYear();
            const query = `
                SELECT COUNT(*) as total 
                FROM FACTURA 
                WHERE YEAR(FechaRegistro) = ?
            `;
            
            const [rows] = await this.conexion.execute(query, [year]);
            const numero = (rows[0].total + 1).toString().padStart(6, '0');
            
            return `F${year}-${numero}`;
        } catch (error) {
            console.error('Error al generar código:', error);
            throw error;
        }
    }

    // Crear factura desde proforma
    async crearDesdeProforma(idProforma, idUsuario) {
        try {
            // Obtener datos de la proforma
            const Proforma = require('./Proforma');
            const proformaModel = new Proforma();
            const proformaData = await proformaModel.obtenerPorId(idProforma);
            
            if (!proformaData) {
                throw new Error('Proforma no encontrada');
            }

            // Verificamos cómo llega la estructura de los datos de la proforma
            console.log("Estructura de proformaData en crearDesdeProforma:", 
                        Object.keys(proformaData));
            
            // En algunas versiones del código, proformaData tiene directamente la estructura
            // y en otros viene como {proforma, productos}, adaptamos para ambos casos
            let proforma, detalle;
            
            if (proformaData.IdProforma) {
                // Es directamente el objeto proforma
                proforma = proformaData;
                detalle = proformaData.detalle || [];
            } else if (proformaData.proforma) {
                // Es la estructura {proforma, productos}
                proforma = proformaData.proforma;
                detalle = proformaData.productos || [];
            } else {
                throw new Error('Estructura de datos de proforma inválida');
            }
            
            // Verificar que la proforma esté aprobada
            if (proforma.Estado !== 'APROBADA') {
                throw new Error(`La proforma debe estar APROBADA para generar factura. Estado actual: ${proforma.Estado}`);
            }
            
            // Log para verificar los detalles de productos
            console.log(`Encontrados ${detalle.length} productos en la proforma`);
            if (detalle.length > 0) {
                console.log("Ejemplo de producto:", JSON.stringify(detalle[0]));
            }
            
            // Crear factura con datos de la proforma
            const datosFactura = {
                IdProforma: idProforma,
                IdUsuario: idUsuario,
                IdCliente: proforma.IdCliente,
                IdEmpresa: proforma.IdEmpresa,
                FechaEmision: new Date().toISOString().split('T')[0],
                FechaVencimiento: null,
                SubTotal: proforma.SubTotal,
                TotalIGV: proforma.TotalIGV,
                Total: proforma.Total,
                Estado: 'PENDIENTE',
                FormaPago: proforma.FormaPago,
                Observaciones: proforma.Observaciones
            };
            
            // Convertir productos a detalles de factura
            const detalles = detalle.map(producto => ({
                IdProducto: producto.IdProducto,
                Cantidad: producto.Cantidad,
                UnidadMedida: producto.UnidadMedida || 'UNID',
                PrecioUnitario: producto.PrecioUnitario,
                Total: producto.Total || (producto.Cantidad * producto.PrecioUnitario),
                DescripcionAdicional: producto.DescripcionAdicional || null,
                // Añadimos estos campos para mantener la información que necesitará la vista
                ProductoNombre: producto.ProductoNombre || producto.CodigoProducto || 'Producto sin nombre',
                ProductoDescripcion: producto.ProductoDescripcion || ''
            }));
            
            // MODIFICAR: Convertir productos a detalles de factura con TipoDetalle
            const detallesConTipo = detalle.map(producto => ({
                IdProducto: producto.IdProducto,
                Cantidad: producto.Cantidad,
                UnidadMedida: producto.UnidadMedida || 'UNID',
                PrecioUnitario: producto.PrecioUnitario,
                Total: producto.Total || (producto.Cantidad * producto.PrecioUnitario),
                DescripcionAdicional: producto.DescripcionAdicional || null,
                IdDetalleProforma: producto.IdDetalleProforma, // Relacionar con el detalle de proforma
                TipoDetalle: 'ORIGINAL' // Marcar como producto original de proforma
            }));
            
            return await this.crear(datosFactura, detallesConTipo);
            
        } catch (error) {
            console.error('Error al crear factura desde proforma:', error);
            throw error;
        }
    }

    // Obtener factura por ID de proforma
    async obtenerPorProforma(idProforma) {
        try {
            const query = `
                SELECT 
                    f.IdFactura,
                    f.Codigo,
                    f.Estado,
                    f.Total,
                    f.FechaEmision
                FROM FACTURA f
                WHERE f.IdProforma = ?
                LIMIT 1
            `;
            
            const [rows] = await this.conexion.execute(query, [idProforma]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error al obtener factura por proforma:', error);
            throw error;
        }
    }

    // Buscar facturas
    async buscar(termino) {
        try {
            const query = `
                SELECT 
                    f.IdFactura,
                    f.Codigo,
                    f.FechaEmision,
                    f.Total,
                    f.Estado,
                    c.RazonSocial as ClienteNombre,
                    c.Documento as ClienteDocumento
                FROM FACTURA f
                LEFT JOIN CLIENTE c ON f.IdCliente = c.IdCliente
                WHERE f.Codigo LIKE ? 
                   OR c.RazonSocial LIKE ?
                   OR c.Documento LIKE ?
                ORDER BY f.FechaRegistro DESC
                LIMIT 50
            `;
            
            const terminoBusqueda = `%${termino}%`;
            const [rows] = await this.conexion.execute(query, [
                terminoBusqueda, terminoBusqueda, terminoBusqueda
            ]);
            
            return rows;
        } catch (error) {
            console.error('Error al buscar facturas:', error);
            throw error;
        }
    }

    // Obtener estadísticas de facturas
    async obtenerEstadisticas() {
        try {
            const queries = {
                total: 'SELECT COUNT(*) as total FROM FACTURA',
                pendientes: "SELECT COUNT(*) as total FROM FACTURA WHERE Estado = 'PENDIENTE'",
                pagadas: "SELECT COUNT(*) as total FROM FACTURA WHERE Estado = 'PAGADA'",
                vencidas: "SELECT COUNT(*) as total FROM FACTURA WHERE FechaVencimiento < CURDATE() AND Estado = 'PENDIENTE'",
                totalVentas: 'SELECT SUM(Total) as total FROM FACTURA WHERE Estado = \'PAGADA\'',
                ventasEsteMes: `
                    SELECT SUM(Total) as total 
                    FROM FACTURA 
                    WHERE Estado = 'PAGADA' 
                    AND MONTH(FechaEmision) = MONTH(CURDATE()) 
                    AND YEAR(FechaEmision) = YEAR(CURDATE())
                `
            };
            
            const resultados = {};
            
            for (const [key, query] of Object.entries(queries)) {
                const [rows] = await this.conexion.execute(query);
                resultados[key] = rows[0].total || 0;
            }
            
            return resultados;
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            throw error;
        }
   }

    // NUEVO MÉTODO: Agregar producto adicional a factura existente
    async agregarProductoAdicional(idFactura, productoData) {
        let connection;
        
        try {
            connection = await this.conexion.getConnection();
            await connection.beginTransaction();
            
            const { IdProducto, Cantidad, PrecioUnitario, DescripcionAdicional } = productoData;
            
            // Obtener unidad de medida del producto
            const [producto] = await connection.execute(
                'SELECT UnidadMedida FROM PRODUCTO WHERE IdProducto = ?',
                [IdProducto]
            );
            
            const unidadMedida = producto.length > 0 ? producto[0].UnidadMedida : 'UNID';
            const total = parseFloat(Cantidad) * parseFloat(PrecioUnitario);
            
            // Insertar el producto adicional
            // Intentar insertar incluyendo columnas nuevas (TipoDetalle, IdDetalleProforma).
            // Si la columna no existe en la BD (ER_BAD_FIELD_ERROR), reintentar sin esas columnas.
            const queryInsertConTipo = `
                INSERT INTO DETALLE_FACTURA (
                    IdFactura, IdProducto, Cantidad, UnidadMedida, 
                    PrecioUnitario, Total, DescripcionAdicional, 
                    IdDetalleProforma, TipoDetalle
                ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 'ADICIONAL')
            `;

            try {
                await connection.execute(queryInsertConTipo, [
                    idFactura, IdProducto, Cantidad, unidadMedida,
                    PrecioUnitario, total, DescripcionAdicional || null
                ]);
            } catch (err) {
                if (err && err.code === 'ER_BAD_FIELD_ERROR') {
                    const queryInsertFallback = `
                        INSERT INTO DETALLE_FACTURA (
                            IdFactura, IdProducto, Cantidad, UnidadMedida,
                            PrecioUnitario, Total, DescripcionAdicional
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    `;
                    await connection.execute(queryInsertFallback, [
                        idFactura, IdProducto, Cantidad, unidadMedida,
                        PrecioUnitario, total, DescripcionAdicional || null
                    ]);
                } else {
                    throw err;
                }
            }
            
            // Recalcular totales de la factura
            await this.recalcularTotales(idFactura, connection);
            
            await connection.commit();
            return true;
            
        } catch (error) {
            if (connection) await connection.rollback();
            console.error('Error al agregar producto adicional:', error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    // NUEVO MÉTODO: Eliminar producto adicional
    async eliminarProductoAdicional(idDetalleFactura, idFactura) {
        let connection;
        
        try {
            connection = await this.conexion.getConnection();
            await connection.beginTransaction();
            
            // Verificar que exista el detalle. Intentar leer TipoDetalle si está disponible.
            let detalle;
            try {
                const [rows] = await connection.execute(
                    'SELECT TipoDetalle FROM DETALLE_FACTURA WHERE IdDetalleFactura = ? AND IdFactura = ?',
                    [idDetalleFactura, idFactura]
                );
                detalle = rows;
            } catch (err) {
                if (err && err.code === 'ER_BAD_FIELD_ERROR') {
                    // La columna TipoDetalle no existe en la BD; verificar existencia mínima
                    const [rows] = await connection.execute(
                        'SELECT IdDetalleFactura FROM DETALLE_FACTURA WHERE IdDetalleFactura = ? AND IdFactura = ?',
                        [idDetalleFactura, idFactura]
                    );
                    detalle = rows;
                } else {
                    throw err;
                }
            }

            if (!detalle || detalle.length === 0) {
                throw new Error('Detalle de factura no encontrado');
            }

            // Si la BD tiene TipoDetalle, prevengamos eliminar no ADICIONAL
            if (detalle[0].TipoDetalle !== undefined && detalle[0].TipoDetalle !== 'ADICIONAL') {
                throw new Error('Solo se pueden eliminar productos adicionales');
            }

            // Eliminar el detalle
            await connection.execute(
                'DELETE FROM DETALLE_FACTURA WHERE IdDetalleFactura = ?',
                [idDetalleFactura]
            );
            
            // Recalcular totales
            await this.recalcularTotales(idFactura, connection);
            
            await connection.commit();
            return true;
            
        } catch (error) {
            if (connection) await connection.rollback();
            console.error('Error al eliminar producto adicional:', error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }

    // NUEVO MÉTODO: Recalcular totales de factura
    async recalcularTotales(idFactura, connection = null) {
        const conn = connection || this.conexion;
        
        try {
            // Calcular subtotal sumando todos los detalles
            const [totales] = await conn.execute(
                'SELECT COALESCE(SUM(Total), 0) as SubTotal FROM DETALLE_FACTURA WHERE IdFactura = ?',
                [idFactura]
            );
            
            const subTotal = totales[0].SubTotal;
            const igv = subTotal * 0.18;
            const total = subTotal + igv;
            
            // Actualizar la factura
            await conn.execute(
                'UPDATE FACTURA SET SubTotal = ?, TotalIGV = ?, Total = ? WHERE IdFactura = ?',
                [subTotal, igv, total, idFactura]
            );
            
            return { subTotal, igv, total };
            
        } catch (error) {
            console.error('Error al recalcular totales:', error);
            throw error;
        }
    }

    // NUEVO MÉTODO: Actualizar detalle específico de factura
    async actualizarDetalleFactura(idDetalleFactura, datosDetalle) {
        try {
            const query = `
                UPDATE DETALLE_FACTURA 
                SET Cantidad = ?, PrecioUnitario = ?, Total = ?
                WHERE IdDetalleFactura = ?
            `;
            
            await this.conexion.execute(query, [
                datosDetalle.Cantidad,
                datosDetalle.PrecioUnitario,
                datosDetalle.Total,
                idDetalleFactura
            ]);
            
            return true;
        } catch (error) {
            console.error('Error al actualizar detalle de factura:', error);
            throw error;
        }
    }

    // NUEVO MÉTODO: Eliminar detalle específico de factura
    async eliminarDetalleFactura(idDetalleFactura) {
        try {
            const query = 'DELETE FROM DETALLE_FACTURA WHERE IdDetalleFactura = ?';
            await this.conexion.execute(query, [idDetalleFactura]);
            return true;
        } catch (error) {
            console.error('Error al eliminar detalle de factura:', error);
            throw error;
        }
    }

    // NUEVO MÉTODO: Agregar nuevo detalle a factura
    async agregarDetalleFactura(idFactura, datosDetalle) {
        try {
            const query = `
                INSERT INTO DETALLE_FACTURA 
                (IdFactura, IdProducto, Cantidad, UnidadMedida, PrecioUnitario, Total, 
                 DescripcionAdicional, TipoDetalle, IdDetalleProforma)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await this.conexion.execute(query, [
                idFactura,
                datosDetalle.IdProducto,
                datosDetalle.Cantidad,
                datosDetalle.UnidadMedida || 'UNID',
                datosDetalle.PrecioUnitario,
                datosDetalle.Total,
                datosDetalle.DescripcionAdicional || null,
                datosDetalle.TipoDetalle || 'ADICIONAL',
                datosDetalle.IdDetalleProforma || null
            ]);

            return result.insertId;
        } catch (error) {
            // Si la BD no contiene las columnas TipoDetalle/IdDetalleProforma, reintentar sin ellas
            if (error && error.code === 'ER_BAD_FIELD_ERROR') {
                try {
                    const fallbackQuery = `
                        INSERT INTO DETALLE_FACTURA 
                        (IdFactura, IdProducto, Cantidad, UnidadMedida, PrecioUnitario, Total, DescripcionAdicional)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `;

                    const [resultFallback] = await this.conexion.execute(fallbackQuery, [
                        idFactura,
                        datosDetalle.IdProducto,
                        datosDetalle.Cantidad,
                        datosDetalle.UnidadMedida || 'UNID',
                        datosDetalle.PrecioUnitario,
                        datosDetalle.Total,
                        datosDetalle.DescripcionAdicional || null
                    ]);

                    return resultFallback.insertId;
                } catch (err2) {
                    console.error('Error fallback al agregar detalle de factura:', err2);
                    throw err2;
                }
            }

            console.error('Error al agregar detalle de factura:', error);
            throw error;
        }
    }

    // NUEVO MÉTODO: Obtener detalles de una factura específica
    async obtenerDetallesPorFactura(idFactura) {
        try {
            const query = `
                SELECT 
                    df.IdDetalleFactura,
                    df.IdFactura,
                    df.IdProducto,
                    df.Cantidad,
                    df.UnidadMedida,
                    df.PrecioUnitario,
                    df.Total,
                    df.DescripcionAdicional,
                    df.TipoDetalle,
                    df.IdDetalleProforma,
                    p.Nombre as ProductoNombre,
                    p.Marca as ProductoMarca,
                    p.Modelo as ProductoModelo
                FROM DETALLE_FACTURA df
                LEFT JOIN PRODUCTO p ON df.IdProducto = p.IdProducto
                WHERE df.IdFactura = ?
                ORDER BY df.TipoDetalle, df.IdDetalleFactura
            `;
            
            const [rows] = await this.conexion.execute(query, [idFactura]);
            return rows;
        } catch (error) {
            console.error('Error al obtener detalles de factura:', error);
            throw error;
        }
    }
}

module.exports = Factura;
