const conexion = require('../bd/conexion');

class Proforma {
    /**
     * Verifica y actualiza el estado de las proformas a 'VENCIDA' si han superado su validez.
     * Una proforma se marca como vencida si:
     *  - Estado es 'PENDIENTE' o 'APROBADA'
     *  - No tiene factura asociada
     *  - La fecha actual supera FechaEmision + ValidezOferta (en días)
     */
    static async verificarProformasVencidas() {
        try {
            console.log('Verificando proformas vencidas...');
            // Actualiza proformas vencidas según la lógica de negocio
            const sqlActualizar = `
                UPDATE PROFORMA
                SET Estado = 'VENCIDA'
                WHERE IdProforma IN (
                    SELECT IdProforma FROM (
                        SELECT p.IdProforma
                        FROM PROFORMA p
                        LEFT JOIN FACTURA f ON p.IdProforma = f.IdProforma
                        WHERE p.Estado IN ('PENDIENTE', 'APROBADA')
                        AND f.IdFactura IS NULL
                        AND DATEDIFF(CURDATE(), p.FechaEmision) > p.ValidezOferta
                    ) AS sub
                )
            `;
            const [resultado] = await conexion.query(sqlActualizar);
            console.log(`Proformas actualizadas a VENCIDA: ${resultado.affectedRows}`);
            return resultado.affectedRows;
        } catch (error) {
            console.error('Error en Proforma.verificarProformasVencidas:', error);
            throw error;
        }
    }

    static async contarProformas() {
        try {
            const sql = 'SELECT COUNT(*) as total FROM PROFORMA';
            const [resultados] = await conexion.query(sql);
            return resultados[0].total;
        } catch (error) {
            console.error('Error en Proforma.contarProformas:', error);
            throw error;
        }
    }

    // Verificar y actualizar proformas vencidas
    static async verificarProformasVencidas() {
        try {
            console.log('Verificando proformas vencidas...');
            
            // Actualizar proformas que han superado su ValidezOferta y no se han vendido
            const sqlActualizar = `
                UPDATE PROFORMA
                SET Estado = 'VENCIDA'
                WHERE IdProforma IN (
                    SELECT IdProforma FROM (
                        SELECT p.IdProforma
                        FROM PROFORMA p
                        LEFT JOIN FACTURA f ON p.IdProforma = f.IdProforma
                        WHERE p.Estado IN ('PENDIENTE', 'APROBADA')
                        AND f.IdFactura IS NULL
                        AND DATEDIFF(CURDATE(), p.FechaEmision) > p.ValidezOferta
                    ) AS sub
                )
            `;
            
            const [resultado] = await conexion.query(sqlActualizar);
            console.log(`Proformas actualizadas a VENCIDA: ${resultado.affectedRows}`);
            
            return resultado.affectedRows;
        } catch (error) {
            console.error('Error en Proforma.verificarProformasVencidas:', error);
            throw error;
        }
    }

    // Obtener estadísticas de proformas por estado
    static async obtenerEstadisticasEstados() {
        try {
            const sql = `
                SELECT 
                    Estado,
                    COUNT(*) as cantidad,
                    SUM(Total) as total_monto,
                    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM PROFORMA)), 2) as porcentaje
                FROM PROFORMA
                GROUP BY Estado
                ORDER BY cantidad DESC
            `;
            
            const [resultados] = await conexion.query(sql);
            return resultados;
        } catch (error) {
            console.error('Error en Proforma.obtenerEstadisticasEstados:', error);
            throw error;
        }
    }

    // Obtener proformas vencidas (no vendidas)
    static async obtenerProformasVencidas() {
        try {
            const sql = `
                SELECT p.*,
                       c.RazonSocial as ClienteNombre,
                       u.Nombres as UsuarioNombre,
                       u.Apellidos as UsuarioApellido,
                       DATEDIFF(CURDATE(), p.FechaEmision) as DiasTranscurridos,
                       p.ValidezOferta as DiasValidez,
                       CASE 
                           WHEN DATEDIFF(CURDATE(), p.FechaEmision) > p.ValidezOferta THEN 'VENCIDA'
                           ELSE p.Estado 
                       END as EstadoActual
                FROM PROFORMA p
                LEFT JOIN CLIENTE c ON p.IdCliente = c.IdCliente
                LEFT JOIN USUARIO u ON p.IdUsuario = u.IdUsuario
                LEFT JOIN FACTURA f ON p.IdProforma = f.IdProforma
                WHERE f.IdFactura IS NULL
                AND p.Estado IN ('PENDIENTE', 'APROBADA', 'VENCIDA')
                ORDER BY p.FechaEmision DESC
            `;
            
            const [resultados] = await conexion.query(sql);
            return resultados;
        } catch (error) {
            console.error('Error en Proforma.obtenerProformasVencidas:', error);
            throw error;
        }
    }
    
    static async listar() {
        try {
            console.log('Obteniendo lista de proformas...');
            const sqlProformas = `SELECT p.*, 
                                     COALESCE(c.RazonSocial, 'Cliente no encontrado') as ClienteNombre, 
                                     COALESCE(c.Documento, '') as ClienteDocumento,
                                     COALESCE(CONCAT(u.Nombres, ' ', u.Apellidos), 'Usuario no encontrado') as UsuarioNombre, 
                                     COALESCE(u.Apellidos, '') as UsuarioApellido,
                                     COALESCE(e.Nombre, 'Empresa no encontrada') as EmpresaNombre,
                                     COALESCE(e.RUC, '') as EmpresaRUC,
                                     f.IdFactura as FacturaId,
                                     f.Codigo as FacturaCodigo,
                                     f.Estado as FacturaEstado
                              FROM PROFORMA p 
                              LEFT JOIN CLIENTE c ON p.IdCliente = c.IdCliente
                              LEFT JOIN USUARIO u ON p.IdUsuario = u.IdUsuario  
                              LEFT JOIN EMPRESA e ON p.IdEmpresa = e.IdEmpresa
                              LEFT JOIN FACTURA f ON p.IdProforma = f.IdProforma
                              ORDER BY p.FechaRegistro DESC`;
        
            const [proformas] = await conexion.query(sqlProformas);

            // Calcular EstadoVisual: si la proforma está vencida por fecha y validez, mostrar VENCIDA, si no, mostrar el estado real
            const hoy = new Date();
            for (let proforma of proformas) {
                const fechaEmision = new Date(proforma.FechaEmision);
                const diasTranscurridos = Math.floor((hoy - fechaEmision) / (1000 * 60 * 60 * 24));
                if (diasTranscurridos > proforma.ValidezOferta) {
                    proforma.EstadoVisual = 'VENCIDA';
                } else {
                    proforma.EstadoVisual = proforma.Estado;
                }
            }

            // Para cada proforma, obtener sus detalles
            for (let proforma of proformas) {
                const sqlDetalle = `SELECT dp.*, 
                                           COALESCE(p.Codigo, 'Sin código') as CodigoProducto, 
                                           COALESCE(p.Nombre, 'Producto no encontrado') as ProductoNombre,
                                           COALESCE(p.Descripcion, '') as ProductoDescripcion
                                   FROM DETALLE_PROFORMA dp 
                                   LEFT JOIN PRODUCTO p ON dp.IdProducto = p.IdProducto 
                                   WHERE dp.IdProforma = ?`;
                const [detalles] = await conexion.query(sqlDetalle, [proforma.IdProforma]);
                proforma.detalle = detalles;
            }
            
            return proformas;
            
        } catch (error) {
            console.error('Error en Proforma.listar:', error);
            throw error;
        }
    }

    static async crear(data) {
        const connection = await conexion.getConnection();
        try {
            // Iniciar transacción
            await connection.beginTransaction();
            
            // 1. Insertar en tabla PROFORMA
            const sqlProforma = `INSERT INTO PROFORMA 
                (Codigo, IdUsuario, IdCliente, IdEmpresa, FechaEmision, Referencia, ValidezOferta, TiempoEntrega, LugarEntrega, Garantia, FormaPago, PorcentajeIGV, SubTotal, TotalIGV, Total, Estado, Observaciones)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const valoresProforma = [
                data.Codigo,
                data.IdUsuario,
                data.IdCliente,
                data.IdEmpresa,
                data.FechaEmision,
                data.Referencia || null,
                data.ValidezOferta || 10,
                data.TiempoEntrega || null,
                data.LugarEntrega || null,
                data.Garantia || null,
                data.FormaPago || null,
                data.PorcentajeIGV || 18.00,
                data.SubTotal,
                data.TotalIGV,
                data.Total,
                data.Estado || 'PENDIENTE',
                data.Observaciones || null
            ];
            
            const [resultadoProforma] = await connection.query(sqlProforma, valoresProforma);
            const idProforma = resultadoProforma.insertId;
            console.log('Proforma creada con ID:', idProforma);
            
            // 2. Insertar detalles en tabla DETALLE_PROFORMA
            if (data.detalle && Array.isArray(data.detalle)) {
                const sqlDetalle = `INSERT INTO DETALLE_PROFORMA 
                    (IdProforma, IdProducto, Cantidad, UnidadMedida, PrecioUnitario, Total, DescripcionAdicional)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`;
                
                for (const item of data.detalle) {
                    if (item.IdProducto && item.Cantidad && item.PrecioUnitario) {
                        const valoresDetalle = [
                            idProforma,
                            item.IdProducto,
                            item.Cantidad,
                            item.UnidadMedida || 'UNID',
                            item.PrecioUnitario,
                            item.Total || (item.Cantidad * item.PrecioUnitario),
                            item.DescripcionAdicional || null
                        ];
                        await connection.query(sqlDetalle, valoresDetalle);
                        console.log('Detalle agregado para producto:', item.IdProducto);
                    }
                }
            }
            
            // Confirmar transacción
            await connection.commit();
            console.log('Proforma y detalles creados exitosamente');
            
        } catch (error) {
            // Revertir transacción en caso de error
            await connection.rollback();
            console.error('Error en Proforma.crear:', error);
            throw error;
        } finally {
            // Liberar conexión
            connection.release();
        }
    }

    static async obtenerPorId(id) {
        try {
            // Obtener proforma principal
            const sqlProforma = 'SELECT * FROM PROFORMA WHERE IdProforma = ?';
            const [resultadosProforma] = await conexion.query(sqlProforma, [id]);
            
            if (resultadosProforma.length === 0) {
                return null;
            }
            
            const proforma = resultadosProforma[0];
            console.log('Proforma obtenida por ID:', proforma);
            
            // Calcular estado visual dinámicamente según fecha y validez
            const hoy = new Date();
            const fechaEmision = new Date(proforma.FechaEmision);
            const diasTranscurridos = Math.floor((hoy - fechaEmision) / (1000 * 60 * 60 * 24));
            if (
                (proforma.Estado === 'PENDIENTE' || proforma.Estado === 'APROBADA') &&
                diasTranscurridos > proforma.ValidezOferta
            ) {
                proforma.EstadoVisual = 'VENCIDA';
            } else {
                proforma.EstadoVisual = proforma.Estado;
            }
            
            // Obtener detalles de la proforma
            const sqlDetalle = `SELECT dp.*, 
                               p.Codigo as CodigoProducto, 
                               p.Nombre as ProductoNombre,
                               p.Descripcion as ProductoDescripcion
                               FROM DETALLE_PROFORMA dp 
                               LEFT JOIN PRODUCTO p ON dp.IdProducto = p.IdProducto 
                               WHERE dp.IdProforma = ?`;
            const [resultadosDetalle] = await conexion.query(sqlDetalle, [id]);
            
            // Agregar detalles a la proforma
            proforma.detalle = resultadosDetalle;
            console.log('Detalles obtenidos:', resultadosDetalle.length);
            
            return proforma;
        } catch (error) {
            console.error('Error en Proforma.obtenerPorId:', error);
            throw error;
        }
    }

    static async actualizar(id, data) {
        const connection = await conexion.getConnection();
        try {
            // Iniciar transacción
            await connection.beginTransaction();
            
            // 1. Actualizar tabla PROFORMA
            const sqlProforma = `UPDATE PROFORMA SET 
                Codigo = ?, IdUsuario = ?, IdCliente = ?, IdEmpresa = ?, FechaEmision = ?, Referencia = ?, ValidezOferta = ?, TiempoEntrega = ?, LugarEntrega = ?, Garantia = ?, FormaPago = ?, PorcentajeIGV = ?, SubTotal = ?, TotalIGV = ?, Total = ?, Estado = ?, Observaciones = ?
                WHERE IdProforma = ?`;
            const valoresProforma = [
                data.Codigo,
                data.IdUsuario,
                data.IdCliente,
                data.IdEmpresa,
                data.FechaEmision,
                data.Referencia || null,
                data.ValidezOferta || 10,
                data.TiempoEntrega || null,
                data.LugarEntrega || null,
                data.Garantia || null,
                data.FormaPago || null,
                data.PorcentajeIGV || 18.00,
                data.SubTotal,
                data.TotalIGV,
                data.Total,
                data.Estado || 'PENDIENTE',
                data.Observaciones || null,
                id
            ];
            await connection.query(sqlProforma, valoresProforma);
            console.log('Proforma actualizada');
            
            // 2. Eliminar detalles existentes
            const sqlEliminarDetalles = 'DELETE FROM DETALLE_PROFORMA WHERE IdProforma = ?';
            await connection.query(sqlEliminarDetalles, [id]);
            console.log('Detalles anteriores eliminados');
            
            // 3. Insertar nuevos detalles
            if (data.detalle && Array.isArray(data.detalle)) {
                const sqlDetalle = `INSERT INTO DETALLE_PROFORMA 
                    (IdProforma, IdProducto, Cantidad, UnidadMedida, PrecioUnitario, Total, DescripcionAdicional)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`;
                
                for (const item of data.detalle) {
                    if (item.IdProducto && item.Cantidad && item.PrecioUnitario) {
                        const valoresDetalle = [
                            id,
                            item.IdProducto,
                            item.Cantidad,
                            item.UnidadMedida || 'UNID',
                            item.PrecioUnitario,
                            item.Total || (item.Cantidad * item.PrecioUnitario),
                            item.DescripcionAdicional || null
                        ];
                        await connection.query(sqlDetalle, valoresDetalle);
                        console.log('Nuevo detalle agregado para producto:', item.IdProducto);
                    }
                }
            }
            
            // Confirmar transacción
            await connection.commit();
            console.log('Proforma y detalles actualizados exitosamente');
            
        } catch (error) {
            // Revertir transacción en caso de error
            await connection.rollback();
            console.error('Error en Proforma.actualizar:', error);
            throw error;
        } finally {
            // Liberar conexión
            connection.release();
        }
    }

    static async eliminar(id) {
        const connection = await conexion.getConnection();
        try {
            // Iniciar transacción
            await connection.beginTransaction();
            
            // 1. Eliminar detalles primero (por integridad referencial)
            const sqlEliminarDetalles = 'DELETE FROM DETALLE_PROFORMA WHERE IdProforma = ?';
            await connection.query(sqlEliminarDetalles, [id]);
            console.log('Detalles de proforma eliminados');
            
            // 2. Eliminar proforma principal
            const sqlEliminarProforma = 'DELETE FROM PROFORMA WHERE IdProforma = ?';
            await connection.query(sqlEliminarProforma, [id]);
            console.log('Proforma eliminada');
            
            // Confirmar transacción
            await connection.commit();
            console.log('Proforma y detalles eliminados exitosamente');
            
        } catch (error) {
            // Revertir transacción en caso de error
            await connection.rollback();
            console.error('Error en Proforma.eliminar:', error);
            throw error;
        } finally {
            // Liberar conexión
            connection.release();
        }
    }

    static async obtenerPorCodigo(codigo) {
        try {
            // Obtener proforma principal por código
            const sqlProforma = `SELECT p.*, 
                                        COALESCE(c.RazonSocial, 'Cliente no encontrado') as ClienteNombre, 
                                        COALESCE(c.Documento, '') as ClienteDocumento,
                                        COALESCE(CONCAT(u.Nombres, ' ', u.Apellidos), 'Usuario no encontrado') as UsuarioNombre, 
                                        COALESCE(e.Nombre, 'Empresa no encontrada') as EmpresaNombre
                                 FROM PROFORMA p 
                                 LEFT JOIN CLIENTE c ON p.IdCliente = c.IdCliente
                                 LEFT JOIN USUARIO u ON p.IdUsuario = u.IdUsuario  
                                 LEFT JOIN EMPRESA e ON p.IdEmpresa = e.IdEmpresa
                                 WHERE p.Codigo = ? AND p.Estado = 'APROBADA'`;
            const [resultadosProforma] = await conexion.query(sqlProforma, [codigo]);
            
            if (resultadosProforma.length === 0) {
                return null;
            }
            
            const proforma = resultadosProforma[0];
            console.log('Proforma obtenida por código:', proforma);
            
            // Obtener detalles de la proforma
            const sqlDetalle = `SELECT dp.*, 
                               p.Codigo as CodigoProducto, 
                               p.Nombre as ProductoNombre,
                               p.Descripcion as ProductoDescripcion,
                               dp.PrecioUnitario,
                               dp.Total as Subtotal
                               FROM DETALLE_PROFORMA dp 
                               LEFT JOIN PRODUCTO p ON dp.IdProducto = p.IdProducto 
                               WHERE dp.IdProforma = ?`;
            const [resultadosDetalle] = await conexion.query(sqlDetalle, [proforma.IdProforma]);
            
            // Retornar tanto la proforma como sus detalles
            return {
                proforma: proforma,
                detalles: resultadosDetalle
            };
        } catch (error) {
            console.error('Error en Proforma.obtenerPorCodigo:', error);
            throw error;
        }
    }
}

module.exports = Proforma;
