const express = require('express');
const router = express.Router();
const ReporteController = require('../controladores/reporteController');
const { verificarAutenticacion } = require('../middleware/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarAutenticacion);

// Ruta principal de reportes
router.get('/', ReporteController.mostrarReportes);

// APIs para datos de gráficos de proformas
router.get('/api/proformas-por-mes', ReporteController.proformasPorMes);
router.get('/api/proformas-por-estado', ReporteController.proformasPorEstado);
router.get('/api/top-clientes', ReporteController.topClientesProformas);
router.get('/api/kpis', ReporteController.obtenerKPIs);
router.get('/api/proformas-por-cliente', ReporteController.proformasPorCliente);

// APIs para datos de ventas (nuevos endpoints)
router.get('/api/ventas-por-mes', ReporteController.ventasPorMes);
router.get('/api/top-clientes-ventas', ReporteController.topClientesVentas);

// Endpoint de diagnóstico
router.get('/api/diagnostico-venta', ReporteController.diagnosticoVenta);

module.exports = router;
