const Cliente = require('../modelos/Cliente');
const Empleado = require('../modelos/Empleado');
const Proforma = require('../modelos/Proforma');
const Producto = require('../modelos/Producto');
const Auditoria = require('../modelos/Auditoria');
const pool = require('../bd/conexion');

exports.mostrarMenu = async (req, res) => {
    try {
        const periodo = req.query.periodo || 'todo';
        let filterWhere = '';
        if (periodo === 'mes') {
            filterWhere = 'AND MONTH(FechaRegistro) = MONTH(CURDATE()) AND YEAR(FechaRegistro) = YEAR(CURDATE())';
        } else if (periodo === 'trimestre') {
            filterWhere = 'AND FechaRegistro >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)';
        } else if (periodo === 'semestre') {
            filterWhere = 'AND FechaRegistro >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)';
        } else if (periodo === 'anio') {
            filterWhere = 'AND YEAR(FechaRegistro) = YEAR(CURDATE())';
        }

        // Objeto para almacenar estadisticas
        let estadisticas = {
            clientes: 0,
            empleados: 0,
            proformas: 0,
            productos: 0
        };

        // Contadores basicos
        try {
            const [c] = await pool.query(`SELECT COUNT(*) as t FROM CLIENTE WHERE Estado = 'ACTIVO' ${filterWhere}`);
            estadisticas.clientes = c[0].t;
        } catch (err) { console.error('Error al contar clientes:', err); }

        try {
            const [e] = await pool.query(`SELECT COUNT(*) as t FROM EMPLEADO WHERE Estado = 'ACTIVO'`);
            estadisticas.empleados = e[0].t;
        } catch (err) { console.error('Error al contar empleados:', err); }

        try {
            const [p] = await pool.query(`SELECT COUNT(*) as t FROM PROFORMA WHERE 1=1 ${filterWhere}`);
            estadisticas.proformas = p[0].t;
        } catch (err) { console.error('Error al contar proformas:', err); }

        try {
            const [pr] = await pool.query(`SELECT COUNT(*) as t FROM PRODUCTO WHERE Estado = 'ACTIVO'`);
            estadisticas.productos = pr[0].t;
        } catch (err) { console.error('Error al contar productos:', err); }

        // Actividad de proformas por dia de la semana (ultimos 7 dias)
        let actividadSemanal = [0, 0, 0, 0, 0, 0, 0]; // Lun, Mar, Mie, Jue, Vie, Sab, Dom
        try {
            const [rows] = await pool.query(`
                SELECT DAYOFWEEK(FechaRegistro) as dia, COUNT(*) as total
                FROM PROFORMA
                WHERE FechaRegistro >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                GROUP BY DAYOFWEEK(FechaRegistro)
            `);
            // DAYOFWEEK: 1=Domingo, 2=Lunes, ... 7=Sabado
            // Convertir a nuestro array: 0=Lun, 1=Mar, ... 6=Dom
            const mapDia = { 2: 0, 3: 1, 4: 2, 5: 3, 6: 4, 7: 5, 1: 6 };
            rows.forEach(r => {
                if (mapDia[r.dia] !== undefined) {
                    actividadSemanal[mapDia[r.dia]] = r.total;
                }
            });
        } catch (err) {
            console.error('Error al obtener actividad semanal:', err);
        }

        // Actividad de proformas por mes (ultimos 6 meses)
        let actividadMensual = { labels: [], datos: [] };
        try {
            const [rows] = await pool.query(`
                SELECT 
                    DATE_FORMAT(FechaRegistro, '%Y-%m') as mes,
                    DATE_FORMAT(FechaRegistro, '%b') as mesNombre,
                    COUNT(*) as total
                FROM PROFORMA
                WHERE FechaRegistro >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                GROUP BY DATE_FORMAT(FechaRegistro, '%Y-%m'), DATE_FORMAT(FechaRegistro, '%b')
                ORDER BY mes ASC
            `);
            actividadMensual.labels = rows.map(r => r.mesNombre);
            actividadMensual.datos = rows.map(r => r.total);
        } catch (err) {
            console.error('Error al obtener actividad mensual:', err);
        }

        // Proformas recientes (ultimas 10) para la tabla
        let proformasRecientes = [];
        try {
            const [rows] = await pool.query(`
                SELECT p.IdProforma, p.Codigo, p.FechaEmision, p.Total, p.Estado,
                       COALESCE(c.RazonSocial, 'Sin cliente') as ClienteNombre
                FROM PROFORMA p
                LEFT JOIN CLIENTE c ON p.IdCliente = c.IdCliente
                WHERE 1=1 ${filterWhere.replace('FechaRegistro', 'p.FechaEmision')}
                ORDER BY p.FechaRegistro DESC
                LIMIT 10
            `);
            proformasRecientes = rows;
        } catch (err) {
            console.error('Error al obtener proformas recientes:', err);
        }

        // Contadores por estado de proformas
        let estadosProformas = { pendientes: 0, aprobadas: 0, vendidas: 0, vencidas: 0 };
        try {
            const [rows] = await pool.query(`
                SELECT Estado, COUNT(*) as total
                FROM PROFORMA
                WHERE 1=1 ${filterWhere}
                GROUP BY Estado
            `);
            rows.forEach(r => {
                const estado = r.Estado.toLowerCase();
                if (estado === 'pendiente') estadosProformas.pendientes = r.total;
                else if (estado === 'aprobada') estadosProformas.aprobadas = r.total;
                else if (estado === 'vendida') estadosProformas.vendidas = r.total;
                else if (estado === 'vencida') estadosProformas.vencidas = r.total;
            });
        } catch (err) {
            console.error('Error al obtener estados de proformas:', err);
        }

        // Conteo de facturas
        let totalFacturas = 0;
        try {
            const [rows] = await pool.query(`SELECT COUNT(*) as total FROM FACTURA WHERE 1=1 ${filterWhere.replace('FechaRegistro', 'FechaEmision')}`);
            totalFacturas = rows[0].total;
        } catch (err) {
            console.error('Error al contar facturas:', err);
        }

        // Auditoria reciente para dashboard
        let auditoriaReciente = [];
        try {
            const auditoria = await Auditoria.listarRecientes(8);
            auditoriaReciente = auditoria && Array.isArray(auditoria) ? auditoria : [];
            console.log(`✓ Auditoria cargada: ${auditoriaReciente.length} registros`);
        } catch (err) {
            console.error('✗ Error al obtener auditoria reciente:', err.message);
            auditoriaReciente = [];
        }

        // Productos con stock bajo (stock <= stockMinimo)
        let productosStockBajo = [];
        try {
            productosStockBajo = await Producto.listarStockBajo();
        } catch (err) {
            console.error('Error al obtener stock bajo:', err.message);
        }

        // Pasar datos a la vista
        res.render('menu/principal', {
            estadisticas,
            actividadSemanal: JSON.stringify(actividadSemanal),
            actividadMensual: JSON.stringify(actividadMensual),
            proformasRecientes,
            estadosProformas: JSON.stringify(estadosProformas),
            totalFacturas,
            auditoriaReciente,
            productosStockBajo,
            periodo
        });
    } catch (error) {
        console.error('Error general al obtener estadisticas:', error);
        res.render('menu/principal', {
            estadisticas: { clientes: 0, empleados: 0, proformas: 0, productos: 0 },
            actividadSemanal: JSON.stringify([0, 0, 0, 0, 0, 0, 0]),
            actividadMensual: JSON.stringify({ labels: [], datos: [] }),
            proformasRecientes: [],
            estadosProformas: JSON.stringify({ pendientes: 0, aprobadas: 0, vendidas: 0, vencidas: 0 }),
            totalFacturas: 0,
            auditoriaReciente: [],
            productosStockBajo: [],
            periodo: 'todo'
        });
    }
};