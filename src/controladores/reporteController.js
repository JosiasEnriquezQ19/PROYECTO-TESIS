const Proforma = require('../modelos/Proforma');
const Cliente = require('../modelos/Cliente');
const conexion = require('../bd/conexion');

class ReporteController {
    // Renderizar la vista principal de reportes
    static async mostrarReportes(req, res) {
        try {
            console.log('Renderizando dashboard de reportes...');
            
            // Verificar y actualizar proformas vencidas antes de mostrar el dashboard
            await Proforma.verificarProformasVencidas();
            
            res.render('reportes/dashboard', {
                user: req.session.usuario
            });
        } catch (error) {
            console.error('Error al mostrar reportes:', error);
            res.status(500).send('Error interno del servidor: ' + error.message);
        }
    }

    // API: Obtener datos para gráfico de proformas por mes
    static async proformasPorMes(req, res) {
        try {
            const sql = `
                SELECT 
                    DATE_FORMAT(FechaEmision, '%Y-%m') as mes,
                    COUNT(*) as cantidad,
                    SUM(Total) as total_ventas
                FROM PROFORMA 
                WHERE FechaEmision >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
                GROUP BY DATE_FORMAT(FechaEmision, '%Y-%m')
                ORDER BY mes ASC
            `;
            
            const conexion = require('../bd/conexion');
            const [resultados] = await conexion.query(sql);
            
            res.json({
                success: true,
                data: resultados
            });
        } catch (error) {
            console.error('Error en proformasPorMes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener datos'
            });
        }
    }

    // API: Obtener distribución de estados de proformas
    static async proformasPorEstado(req, res) {
        try {
            const sql = `
                SELECT 
                    Estado,
                    COUNT(*) as cantidad,
                    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM PROFORMA)), 2) as porcentaje
                FROM PROFORMA 
                GROUP BY Estado
                ORDER BY cantidad DESC
            `;
            
            const conexion = require('../bd/conexion');
            const [resultados] = await conexion.query(sql);
            
            res.json({
                success: true,
                data: resultados
            });
        } catch (error) {
            console.error('Error en proformasPorEstado:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener datos'
            });
        }
    }

    // API: Obtener top clientes con más proformas
    static async topClientesProformas(req, res) {
        try {
            const sql = `
                SELECT 
                    c.RazonSocial,
                    COUNT(p.IdProforma) as total_proformas,
                    SUM(p.Total) as total_ventas,
                    ROUND(AVG(p.Total), 2) as promedio_venta
                FROM CLIENTE c
                INNER JOIN PROFORMA p ON c.IdCliente = p.IdCliente
                GROUP BY c.IdCliente, c.RazonSocial
                ORDER BY total_proformas DESC
                LIMIT 10
            `;
            
            const conexion = require('../bd/conexion');
            const [resultados] = await conexion.query(sql);
            
            res.json({
                success: true,
                data: resultados
            });
        } catch (error) {
            console.error('Error en topClientesProformas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener datos'
            });
        }
    }

    // API: Obtener KPIs principales
    static async obtenerKPIs(req, res) {
        try {
            const conexion = require('../bd/conexion');
            
            // Total de proformas
            const [totalProformas] = await conexion.query('SELECT COUNT(*) as total FROM PROFORMA');
            
            // Valor promedio de proformas
            const [promedioProformas] = await conexion.query('SELECT ROUND(AVG(Total), 2) as promedio FROM PROFORMA');
            
            // Tasa de conversión (asumiendo que 'APROBADA' es convertida)
            const [tasaConversion] = await conexion.query(`
                SELECT 
                    ROUND(
                        (COUNT(CASE WHEN Estado = 'APROBADA' THEN 1 END) * 100.0 / COUNT(*)), 2
                    ) as tasa_conversion
                FROM PROFORMA
            `);
            
            // Proformas pendientes
            const [proformasPendientes] = await conexion.query(`
                SELECT COUNT(*) as pendientes 
                FROM PROFORMA 
                WHERE Estado = 'PENDIENTE'
            `);
            
            res.json({
                success: true,
                data: {
                    totalProformas: totalProformas[0].total,
                    promedioProformas: promedioProformas[0].promedio || 0,
                    tasaConversion: tasaConversion[0].tasa_conversion || 0,
                    proformasPendientes: proformasPendientes[0].pendientes
                }
            });
        } catch (error) {
            console.error('Error en obtenerKPIs:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener KPIs'
            });
        }
    }

    // API: Obtener proformas por cliente (para gráfico circular)
    static async proformasPorCliente(req, res) {
        try {
            const sql = `
                SELECT 
                    c.RazonSocial as cliente,
                    COUNT(p.IdProforma) as cantidad,
                    SUM(p.Total) as total_ventas
                FROM CLIENTE c
                INNER JOIN PROFORMA p ON c.IdCliente = p.IdCliente
                GROUP BY c.IdCliente, c.RazonSocial
                ORDER BY cantidad DESC
                LIMIT 8
            `;
            
            const conexion = require('../bd/conexion');
            const [resultados] = await conexion.query(sql);
            
            res.json({
                success: true,
                data: resultados
            });
        } catch (error) {
            console.error('Error en proformasPorCliente:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener datos'
            });
        }
    }

    // API: Obtener datos para gráfico de proformas por mes
    static async proformasPorMes(req, res) {
        try {
            const sql = `
                SELECT 
                    DATE_FORMAT(FechaEmision, '%Y-%m') as mes,
                    COUNT(*) as cantidad,
                    SUM(Total) as total_ventas
                FROM PROFORMA 
                WHERE FechaEmision >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
                GROUP BY DATE_FORMAT(FechaEmision, '%Y-%m')
                ORDER BY mes ASC
            `;
            
            const conexion = require('../bd/conexion');
            const [resultados] = await conexion.query(sql);
            
            res.json({
                success: true,
                data: resultados
            });
        } catch (error) {
            console.error('Error en proformasPorMes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener datos'
            });
        }
    }

    // API: Obtener distribución de estados de proformas
    static async proformasPorEstado(req, res) {
        try {
            const sql = `
                SELECT 
                    Estado,
                    COUNT(*) as cantidad,
                    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM PROFORMA)), 2) as porcentaje
                FROM PROFORMA 
                GROUP BY Estado
                ORDER BY cantidad DESC
            `;
            
            const conexion = require('../bd/conexion');
            const [resultados] = await conexion.query(sql);
            
            res.json({
                success: true,
                data: resultados
            });
        } catch (error) {
            console.error('Error en proformasPorEstado:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener datos'
            });
        }
    }

    // API: Obtener top clientes con más proformas
    static async topClientesProformas(req, res) {
        try {
            const sql = `
                SELECT 
                    c.RazonSocial,
                    COUNT(p.IdProforma) as total_proformas,
                    SUM(p.Total) as total_ventas,
                    ROUND(AVG(p.Total), 2) as promedio_venta
                FROM CLIENTE c
                INNER JOIN PROFORMA p ON c.IdCliente = p.IdCliente
                GROUP BY c.IdCliente, c.RazonSocial
                ORDER BY total_proformas DESC
                LIMIT 10
            `;
            
            const conexion = require('../bd/conexion');
            const [resultados] = await conexion.query(sql);
            
            res.json({
                success: true,
                data: resultados
            });
        } catch (error) {
            console.error('Error en topClientesProformas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener datos'
            });
        }
    }

    // API: Obtener KPIs principales (separando proformas de ventas reales)
    static async obtenerKPIs(req, res) {
        try {
            console.log('Obteniendo KPIs separando proformas de ventas...');
            
            // Verificar y actualizar proformas vencidas
            await Proforma.verificarProformasVencidas();
            
            // === MÉTRICAS DE PROFORMAS (posibles ventas) ===
            
            // Total de proformas
            const [totalProformas] = await conexion.query('SELECT COUNT(*) as total FROM PROFORMA');
            console.log('Total proformas:', totalProformas[0].total);
            
            // Proformas por estado
            const [estadisticasProformas] = await conexion.query(`
                SELECT 
                    Estado,
                    COUNT(*) as cantidad,
                    SUM(Total) as total_monto
                FROM PROFORMA
                GROUP BY Estado
            `);
            
            // Procesar estadísticas de proformas
            const proformasPendientes = estadisticasProformas.find(e => e.Estado === 'PENDIENTE')?.cantidad || 0;
            const proformasAprobadas = estadisticasProformas.find(e => e.Estado === 'APROBADA')?.cantidad || 0;
            const proformasVencidas = estadisticasProformas.find(e => e.Estado === 'VENCIDA')?.cantidad || 0;
            const proformasConvertidas = estadisticasProformas.find(e => e.Estado === 'CONVERTIDA')?.cantidad || 0;
            
            // Valor promedio de proformas
            const [promedioProformas] = await conexion.query('SELECT ROUND(AVG(Total), 2) as promedio FROM PROFORMA');
            console.log('Promedio proformas:', promedioProformas[0].promedio);
            
            // === MÉTRICAS DE VENTAS REALES (desde facturas) ===
            
            // Verificar si hay datos en VENTA, si no hay, intentar inicializarlos desde FACTURA
            const [verificacionVenta] = await conexion.query('SELECT COUNT(*) as total FROM VENTA');
            console.log('Total registros en VENTA:', verificacionVenta[0].total);
            
            if (verificacionVenta[0].total === 0) {
                console.log('Inicializando registros de VENTA desde FACTURA...');
                const [facturas] = await conexion.query('SELECT COUNT(*) as total FROM FACTURA');
                
                if (facturas[0].total > 0) {
                    // Insertar registros en VENTA basados en las facturas existentes
                    await conexion.query(`
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
                    console.log('Registros de VENTA inicializados desde FACTURA');
                }
            }
            
            // Total de ventas reales
            const [totalVentas] = await conexion.query('SELECT COUNT(*) as total FROM VENTA');
            
            // Ventas del mes actual (ventas reales)
            const [ventasMes] = await conexion.query(`
                SELECT 
                    COALESCE(SUM(Total), 0) as ventas_mes,
                    COUNT(*) as cantidad_ventas_mes
                FROM VENTA 
                WHERE MONTH(FechaVenta) = MONTH(CURDATE()) 
                AND YEAR(FechaVenta) = YEAR(CURDATE())
            `);
            console.log('Ventas del mes:', ventasMes[0].ventas_mes);

            // Ventas completadas vs pendientes
            const [estadisticasVentas] = await conexion.query(`
                SELECT 
                    COUNT(CASE WHEN Estado = 'COMPLETADA' THEN 1 END) as completadas,
                    COUNT(CASE WHEN Estado != 'COMPLETADA' THEN 1 END) as pendientes,
                    COALESCE(SUM(CASE WHEN Estado = 'COMPLETADA' THEN Total END), 0) as total_completadas
                FROM VENTA
            `);
            
            // Tasa de conversión (proformas que se convirtieron en ventas)
            const [conversionData] = await conexion.query(`
                SELECT 
                    COUNT(DISTINCT p.IdProforma) as proformas_con_ventas,
                    (SELECT COUNT(*) FROM PROFORMA) as total_proformas
                FROM PROFORMA p
                INNER JOIN FACTURA f ON p.IdProforma = f.IdProforma
                INNER JOIN VENTA v ON f.IdFactura = v.IdFactura
            `);
            
            const tasaConversion = conversionData[0].total_proformas > 0 ? 
                ((conversionData[0].proformas_con_ventas * 100) / conversionData[0].total_proformas).toFixed(2) : 0;
            
            console.log('Estadísticas compiladas:', {
                proformas: {
                    total: totalProformas[0].total,
                    pendientes: proformasPendientes,
                    aprobadas: proformasAprobadas,
                    vencidas: proformasVencidas,
                    convertidas: proformasConvertidas
                },
                ventas: {
                    total: totalVentas[0].total,
                    completadas: estadisticasVentas[0].completadas,
                    pendientes: estadisticasVentas[0].pendientes
                },
                conversion: tasaConversion
            });
            
            res.json({
                success: true,
                data: {
                    // Métricas de proformas (posibles ventas)
                    totalProformas: totalProformas[0].total,
                    proformasPendientes: proformasPendientes,
                    proformasAprobadas: proformasAprobadas,
                    proformasVencidas: proformasVencidas,
                    promedioProformas: promedioProformas[0].promedio || 0,
                    
                    // Métricas de ventas reales
                    totalVentas: totalVentas[0].total,
                    ventasMes: ventasMes[0].ventas_mes || 0,
                    cantidadVentasMes: ventasMes[0].cantidad_ventas_mes || 0,
                    ventasCompletadas: estadisticasVentas[0].completadas || 0,
                    ventasPendientes: estadisticasVentas[0].pendientes || 0,
                    totalVentasCompletadas: estadisticasVentas[0].total_completadas || 0,
                    
                    // Tasa de conversión
                    tasaConversion: tasaConversion
                }
            });
        } catch (error) {
            console.error('Error en obtenerKPIs:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener KPIs: ' + error.message
            });
        }
    }

    // API: Obtener proformas por cliente (para gráfico circular)
    static async proformasPorCliente(req, res) {
        try {
            const sql = `
                SELECT 
                    c.RazonSocial as cliente,
                    COUNT(p.IdProforma) as cantidad,
                    SUM(p.Total) as total_ventas
                FROM CLIENTE c
                INNER JOIN PROFORMA p ON c.IdCliente = p.IdCliente
                GROUP BY c.IdCliente, c.RazonSocial
                ORDER BY cantidad DESC
                LIMIT 8
            `;
            
            const conexion = require('../bd/conexion');
            const [resultados] = await conexion.query(sql);
            
            res.json({
                success: true,
                data: resultados
            });
        } catch (error) {
            console.error('Error en proformasPorCliente:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener datos'
            });
        }
    }
    // NUEVO ENDPOINT: Obtener datos de ventas mensuales
    static async ventasPorMes(req, res) {
        try {
            console.log('=== INICIO DIAGNÓSTICO VENTAS ===');
            
            // Verificar estructura de la tabla VENTA
            try {
                const [tablas] = await conexion.query("SHOW TABLES LIKE 'VENTA'");
                console.log('¿Existe la tabla VENTA?', tablas.length > 0 ? 'SÍ' : 'NO');
                
                if (tablas.length > 0) {
                    const [columnas] = await conexion.query("DESCRIBE VENTA");
                    console.log('Estructura de la tabla VENTA:', columnas.map(c => `${c.Field} (${c.Type})`));
                }
            } catch (err) {
                console.error('Error al verificar estructura de tabla:', err.message);
            }
            
            // Verificar triggers
            try {
                const [triggers] = await conexion.query("SHOW TRIGGERS WHERE `Table` = 'FACTURA'");
                console.log('Triggers para tabla FACTURA:', triggers.map(t => t.Trigger));
            } catch (err) {
                console.error('Error al verificar triggers:', err.message);
            }
            
            // Primero verificamos si hay datos en la tabla VENTA
            const [verificacion] = await conexion.query('SELECT COUNT(*) as total FROM VENTA');
            console.log('Total de registros en VENTA:', verificacion[0].total);
            
            // Mostrar algunos registros de VENTA (muestra)
            if (verificacion[0].total > 0) {
                const [muestra] = await conexion.query('SELECT * FROM VENTA LIMIT 5');
                console.log('Muestra de registros en VENTA:', JSON.stringify(muestra, null, 2));
            }
            
            // Verificar facturas existentes
            const [facturas] = await conexion.query('SELECT COUNT(*) as total FROM FACTURA');
            console.log('Total de facturas existentes:', facturas[0].total);
            
            if (facturas[0].total > 0) {
                const [muestraFacturas] = await conexion.query('SELECT IdFactura, Codigo, FechaEmision, Total, Estado FROM FACTURA LIMIT 5');
                console.log('Muestra de facturas existentes:', JSON.stringify(muestraFacturas, null, 2));
            }
            
            // Si no hay datos, buscamos facturas para generar datos en VENTA
            if (verificacion[0].total === 0) {
                console.log('No hay registros en la tabla VENTA. Intentando insertar desde facturas existentes...');
                
                if (facturas[0].total > 0) {
                    console.log('Inicializando la tabla VENTA con datos de facturas existentes...');
                    // Insertar registros en VENTA basados en las facturas existentes
                    const sqlInsert = `
                        INSERT INTO VENTA (IdFactura, FechaVenta, Total, Estado)
                        SELECT 
                            f.IdFactura, 
                            f.FechaEmision, 
                            f.Total, 
                            CASE WHEN f.Estado = 'PAGADA' THEN 'COMPLETADA' ELSE f.Estado END
                        FROM FACTURA f
                        LEFT JOIN VENTA v ON f.IdFactura = v.IdFactura
                        WHERE v.IdVenta IS NULL
                    `;
                    const [resultInsert] = await conexion.query(sqlInsert);
                    console.log('Resultado de inserción en VENTA:', resultInsert);
                    console.log(`Se insertaron ${resultInsert.affectedRows || 0} registros en VENTA`);
                    
                    // Verificar nuevamente después de insertar
                    const [verificacionDespues] = await conexion.query('SELECT COUNT(*) as total FROM VENTA');
                    console.log('Total de registros en VENTA después de inserción:', verificacionDespues[0].total);
                } else {
                    console.log('No hay facturas para migrar a VENTA');
                }
            } else {
                // Verificar si hay facturas que no están en VENTA
                const [faltantes] = await conexion.query(`
                    SELECT COUNT(*) as total FROM FACTURA f 
                    LEFT JOIN VENTA v ON f.IdFactura = v.IdFactura 
                    WHERE v.IdVenta IS NULL
                `);
                
                console.log('Facturas que no están en VENTA:', faltantes[0].total);
                
                if (faltantes[0].total > 0) {
                    console.log('Agregando facturas faltantes a VENTA...');
                    const sqlInsertFaltantes = `
                        INSERT INTO VENTA (IdFactura, FechaVenta, Total, Estado)
                        SELECT 
                            f.IdFactura, 
                            f.FechaEmision, 
                            f.Total, 
                            CASE WHEN f.Estado = 'PAGADA' THEN 'COMPLETADA' ELSE f.Estado END
                        FROM FACTURA f
                        LEFT JOIN VENTA v ON f.IdFactura = v.IdFactura
                        WHERE v.IdVenta IS NULL
                    `;
                    const [resultInsertFaltantes] = await conexion.query(sqlInsertFaltantes);
                    console.log(`Se insertaron ${resultInsertFaltantes.affectedRows || 0} registros faltantes en VENTA`);
                }
            }
            
            const sql = `
                SELECT 
                    DATE_FORMAT(FechaVenta, '%Y-%m') as mes,
                    COUNT(*) as cantidad,
                    SUM(Total) as total_ventas
                FROM VENTA 
                GROUP BY DATE_FORMAT(FechaVenta, '%Y-%m')
                ORDER BY mes ASC
            `;
            
            console.log('Ejecutando consulta para ventas por mes:', sql);
            const [resultados] = await conexion.query(sql);
            console.log('Resultados ventas por mes:', JSON.stringify(resultados, null, 2));
            
            // Si no hay resultados, devolvemos un array vacío
            if (resultados.length === 0) {
                console.log('No hay datos de ventas agrupados por mes. Generando datos de ejemplo...');
                
                // Intentar obtener datos sin agrupar para diagnosticar
                const [todosRegistros] = await conexion.query('SELECT * FROM VENTA LIMIT 20');
                console.log('Registros en VENTA (sin agrupar):', JSON.stringify(todosRegistros, null, 2));
                
                // Verificar si hay problema con el formato de fechas
                const [verificacionFechas] = await conexion.query("SELECT IdVenta, FechaVenta, DATE_FORMAT(FechaVenta, '%Y-%m') as mes_formateado FROM VENTA LIMIT 10");
                console.log('Verificación de formato de fechas:', JSON.stringify(verificacionFechas, null, 2));
                
                // Crear algunos datos de ejemplo para mostrar el gráfico
                const datosPrueba = [
                    { mes: '2025-01', cantidad: 0, total_ventas: 0 },
                    { mes: '2025-02', cantidad: 0, total_ventas: 0 },
                    { mes: '2025-03', cantidad: 0, total_ventas: 0 },
                    { mes: '2025-04', cantidad: 0, total_ventas: 0 },
                    { mes: '2025-05', cantidad: 0, total_ventas: 0 },
                    { mes: '2025-06', cantidad: 0, total_ventas: 0 },
                    { mes: '2025-07', cantidad: 0, total_ventas: 0 },
                ];
                
                console.log('=== FIN DIAGNÓSTICO VENTAS (SIN DATOS) ===');
                
                res.json({
                    success: true,
                    data: datosPrueba,
                    message: 'No hay datos reales de ventas. Se muestran datos vacíos para el gráfico.'
                });
                return;
            }
            
            console.log('=== FIN DIAGNÓSTICO VENTAS (CON DATOS) ===');
            
            res.json({
                success: true,
                data: resultados
            });
        } catch (error) {
            console.error('Error en ventasPorMes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener datos de ventas: ' + error.message
            });
        }
    }

    // NUEVO ENDPOINT: Obtener top clientes con más ventas
    static async topClientesVentas(req, res) {
        try {
            console.log('=== INICIO DIAGNÓSTICO TOP CLIENTES VENTAS ===');
            
            // Verificar datos directamente de VENTA
            const [totalVentas] = await conexion.query('SELECT COUNT(*) as total FROM VENTA');
            console.log('Total registros en tabla VENTA:', totalVentas[0].total);
            
            // Verificar VENTAS por FACTURA
            const [ventasFactura] = await conexion.query(`
                SELECT COUNT(*) as total
                FROM VENTA v
                INNER JOIN FACTURA f ON v.IdFactura = f.IdFactura
            `);
            console.log('Ventas con relación a facturas:', ventasFactura[0].total);
            
            // Verificar FACTURAS por CLIENTE
            const [facturasCliente] = await conexion.query(`
                SELECT COUNT(*) as total
                FROM FACTURA f
                INNER JOIN CLIENTE c ON f.IdCliente = c.IdCliente
            `);
            console.log('Facturas con relación a clientes:', facturasCliente[0].total);
            
            // Primero verificamos si hay datos para este gráfico
            const [verificacion] = await conexion.query(`
                SELECT COUNT(*) as total
                FROM CLIENTE c
                INNER JOIN FACTURA f ON c.IdCliente = f.IdCliente
                INNER JOIN VENTA v ON f.IdFactura = v.IdFactura
            `);
            
            console.log('Total de registros para top clientes ventas:', verificacion[0].total);
            
            if (verificacion[0].total === 0) {
                console.log('Diagnóstico de JOIN vacío:');
                
                // Verificar si hay algún cliente sin facturas
                const [clientesSinFacturas] = await conexion.query(`
                    SELECT COUNT(*) as total 
                    FROM CLIENTE c 
                    LEFT JOIN FACTURA f ON c.IdCliente = f.IdCliente 
                    WHERE f.IdFactura IS NULL
                `);
                console.log('Clientes sin facturas:', clientesSinFacturas[0].total);
                
                // Verificar si hay facturas sin ventas asociadas
                const [facturasSinVentas] = await conexion.query(`
                    SELECT COUNT(*) as total 
                    FROM FACTURA f 
                    LEFT JOIN VENTA v ON f.IdFactura = v.IdFactura 
                    WHERE v.IdVenta IS NULL
                `);
                console.log('Facturas sin ventas:', facturasSinVentas[0].total);
                
                // Si hay facturas sin ventas, insertar registros faltantes
                if (facturasSinVentas[0].total > 0) {
                    console.log('Insertando ventas para facturas sin registro...');
                    const sqlInsert = `
                        INSERT INTO VENTA (IdFactura, FechaVenta, Total, Estado)
                        SELECT 
                            f.IdFactura, 
                            f.FechaEmision, 
                            f.Total, 
                            CASE WHEN f.Estado = 'PAGADA' THEN 'COMPLETADA' ELSE f.Estado END
                        FROM FACTURA f
                        LEFT JOIN VENTA v ON f.IdFactura = v.IdFactura
                        WHERE v.IdVenta IS NULL
                    `;
                    const [resultInsert] = await conexion.query(sqlInsert);
                    console.log(`Se insertaron ${resultInsert.affectedRows || 0} registros en VENTA`);
                    
                    // Verificar de nuevo después de insertar
                    const [verificacionDespues] = await conexion.query(`
                        SELECT COUNT(*) as total
                        FROM CLIENTE c
                        INNER JOIN FACTURA f ON c.IdCliente = f.IdCliente
                        INNER JOIN VENTA v ON f.IdFactura = v.IdFactura
                    `);
                    console.log('Total después de inserción:', verificacionDespues[0].total);
                    
                    if (verificacionDespues[0].total > 0) {
                        // Continuar con la consulta después de arreglar
                        const sql = `
                            SELECT 
                                c.RazonSocial,
                                COUNT(v.IdVenta) as total_ventas,
                                SUM(v.Total) as total_monto,
                                ROUND(AVG(v.Total), 2) as promedio_venta
                            FROM CLIENTE c
                            INNER JOIN FACTURA f ON c.IdCliente = f.IdCliente
                            INNER JOIN VENTA v ON f.IdFactura = v.IdFactura
                            GROUP BY c.IdCliente, c.RazonSocial
                            ORDER BY total_monto DESC
                            LIMIT 10
                        `;
                        
                        console.log('Ejecutando consulta para top clientes ventas después de arreglar');
                        const [resultados] = await conexion.query(sql);
                        console.log('Resultados top clientes ventas:', JSON.stringify(resultados, null, 2));
                        console.log('=== FIN DIAGNÓSTICO TOP CLIENTES VENTAS (DATOS ARREGLADOS) ===');
                        
                        res.json({
                            success: true,
                            data: resultados
                        });
                        return;
                    }
                }
                
                console.log('=== FIN DIAGNÓSTICO TOP CLIENTES VENTAS (SIN DATOS) ===');
                res.json({
                    success: true,
                    data: [],
                    message: 'No hay datos de ventas por cliente'
                });
                return;
            }
            
            const sql = `
                SELECT 
                    c.RazonSocial,
                    COUNT(v.IdVenta) as total_ventas,
                    SUM(v.Total) as total_monto,
                    ROUND(AVG(v.Total), 2) as promedio_venta
                FROM CLIENTE c
                INNER JOIN FACTURA f ON c.IdCliente = f.IdCliente
                INNER JOIN VENTA v ON f.IdFactura = v.IdFactura
                GROUP BY c.IdCliente, c.RazonSocial
                ORDER BY total_monto DESC
                LIMIT 10
            `;
            
            console.log('Ejecutando consulta para top clientes ventas');
            const [resultados] = await conexion.query(sql);
            console.log('Resultados top clientes ventas:', JSON.stringify(resultados, null, 2));
            console.log('=== FIN DIAGNÓSTICO TOP CLIENTES VENTAS (CON DATOS) ===');
            
            res.json({
                success: true,
                data: resultados
            });
        } catch (error) {
            console.error('Error en topClientesVentas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener datos de ventas por cliente: ' + error.message
            });
        }
    }

    // NUEVO ENDPOINT: Diagnóstico directo de la tabla VENTA
    static async diagnosticoVenta(req, res) {
        try {
            console.log('=== INICIANDO DIAGNÓSTICO COMPLETO DE VENTA ===');
            const resultados = {};
            
            // 1. Verificar si la tabla existe y su estructura
            const [tablas] = await conexion.query("SHOW TABLES LIKE 'VENTA'");
            resultados.tablaExiste = tablas.length > 0;
            
            if (resultados.tablaExiste) {
                const [columnas] = await conexion.query("DESCRIBE VENTA");
                resultados.estructura = columnas;
            }
            
            // 2. Verificar triggers existentes
            const [triggers] = await conexion.query("SHOW TRIGGERS WHERE `Table` = 'FACTURA'");
            resultados.triggers = triggers;
            
            // 3. Verificar total de registros en VENTA
            const [totalVenta] = await conexion.query("SELECT COUNT(*) as total FROM VENTA");
            resultados.totalRegistros = totalVenta[0].total;
            
            // 4. Verificar total de facturas
            const [totalFacturas] = await conexion.query("SELECT COUNT(*) as total FROM FACTURA");
            resultados.totalFacturas = totalFacturas[0].total;
            
            // 5. Verificar facturas sin registro en VENTA
            const [faltantes] = await conexion.query(`
                SELECT COUNT(*) as total FROM FACTURA f
                LEFT JOIN VENTA v ON f.IdFactura = v.IdFactura
                WHERE v.IdVenta IS NULL
            `);
            resultados.facturasSinVenta = faltantes[0].total;
            
            // 6. Muestra de registros
            if (resultados.totalRegistros > 0) {
                const [muestra] = await conexion.query("SELECT * FROM VENTA LIMIT 10");
                resultados.muestraVentas = muestra;
            }
            
            // 7. Verificar distribución por mes
            const [distribucionMeses] = await conexion.query(`
                SELECT 
                    DATE_FORMAT(FechaVenta, '%Y-%m') as mes,
                    COUNT(*) as cantidad,
                    SUM(Total) as total_ventas
                FROM VENTA 
                GROUP BY DATE_FORMAT(FechaVenta, '%Y-%m')
                ORDER BY mes ASC
            `);
            resultados.distribucionMeses = distribucionMeses;
            
            // 8. Verificar ventas por cliente
            const [ventasPorCliente] = await conexion.query(`
                SELECT 
                    c.IdCliente,
                    c.RazonSocial,
                    COUNT(v.IdVenta) as cantidad,
                    SUM(v.Total) as total
                FROM CLIENTE c
                INNER JOIN FACTURA f ON c.IdCliente = f.IdCliente
                INNER JOIN VENTA v ON f.IdFactura = v.IdFactura
                GROUP BY c.IdCliente, c.RazonSocial
                ORDER BY total DESC
                LIMIT 10
            `);
            resultados.ventasPorCliente = ventasPorCliente;
            
            // 9. Incluir la fecha y hora actual
            resultados.fechaHoraDiagnostico = new Date().toISOString();
            
            console.log('=== FIN DIAGNÓSTICO COMPLETO DE VENTA ===');
            
            res.json({
                success: true,
                diagnostico: resultados
            });
        } catch (error) {
            console.error('Error en diagnósticoVenta:', error);
            res.status(500).json({
                success: false,
                message: 'Error al realizar diagnóstico: ' + error.message
            });
        }
    }

    // NUEVO ENDPOINT: Obtener proformas vencidas/no vendidas
    static async proformasVencidas(req, res) {
        try {
            console.log('Obteniendo proformas vencidas...');
            
            // Verificar y actualizar proformas vencidas
            await Proforma.verificarProformasVencidas();
            
            // Obtener proformas vencidas
            const proformasVencidas = await Proforma.obtenerProformasVencidas();
            
            console.log(`Proformas vencidas encontradas: ${proformasVencidas.length}`);
            
            res.json({
                success: true,
                data: proformasVencidas.map(proforma => ({
                    IdProforma: proforma.IdProforma,
                    Codigo: proforma.Codigo,
                    ClienteNombre: proforma.ClienteNombre,
                    FechaEmision: proforma.FechaEmision,
                    Total: proforma.Total,
                    Estado: proforma.Estado,
                    ValidezOferta: proforma.ValidezOferta,
                    DiasTranscurridos: proforma.DiasTranscurridos,
                    DiasVencidos: Math.max(0, proforma.DiasTranscurridos - proforma.ValidezOferta)
                }))
            });
        } catch (error) {
            console.error('Error en proformasVencidas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener proformas vencidas: ' + error.message
            });
        }
    }

    // NUEVO ENDPOINT: Obtener estadísticas de proformas por estado (incluyendo vencidas)
    static async estadisticasProformas(req, res) {
        try {
            console.log('Obteniendo estadísticas de proformas...');
            
            // Verificar y actualizar proformas vencidas
            await Proforma.verificarProformasVencidas();
            
            // Obtener estadísticas por estado
            const estadisticas = await Proforma.obtenerEstadisticasEstados();
            
            console.log('Estadísticas de proformas:', estadisticas);
            
            res.json({
                success: true,
                data: estadisticas
            });
        } catch (error) {
            console.error('Error en estadisticasProformas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas de proformas: ' + error.message
            });
        }
    }
}

module.exports = ReporteController;
