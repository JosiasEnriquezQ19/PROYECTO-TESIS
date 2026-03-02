const express = require('express');
const router = express.Router();
const FacturaController = require('../controladores/facturaController');
const auth = require('../middleware/auth');

// Crear instancia del controlador
const facturaController = new FacturaController();

// Middleware de autenticación para todas las rutas
router.use(auth.verificarAutenticacion);

// === RUTAS PRINCIPALES ===

// GET /facturas - Listar todas las facturas
router.get('/', (req, res) => {
    facturaController.listar(req, res);
});

// GET /facturas/nueva - Mostrar formulario de nueva factura
router.get('/nueva', (req, res) => {
    facturaController.mostrarCrear(req, res);
});

// POST /facturas - Crear nueva factura
router.post('/', (req, res) => {
    facturaController.crear(req, res);
});

// GET /facturas/:id/editar - Mostrar formulario de edición (DEBE IR ANTES QUE /:id)
router.get('/:id/editar', (req, res) => {
    facturaController.mostrarEditar(req, res);
});

// GET /facturas/:id/detalle - Ver detalle completo de factura (DEBE IR ANTES QUE /:id)
router.get('/:id/detalle', (req, res) => {
    facturaController.ver(req, res);
});

// GET /facturas/:id - Ver detalle de factura específica (RUTA GENÉRICA AL FINAL)
router.get('/:id', (req, res) => {
    facturaController.ver(req, res);
});

// PUT /facturas/:id - Actualizar factura específica
router.put('/:id', (req, res) => {
    facturaController.actualizar(req, res);
});

// POST /facturas/:id/actualizar - Actualizar factura (método POST para formularios)
router.post('/:id/actualizar', (req, res) => {
    facturaController.actualizar(req, res);
});

// DELETE /facturas/:id - Eliminar factura específica
router.delete('/:id', (req, res) => {
    facturaController.eliminar(req, res);
});

// POST /facturas/:id/eliminar - Eliminar factura (método POST para formularios)
router.post('/:id/eliminar', (req, res) => {
    facturaController.eliminar(req, res);
});

// === RUTAS ESPECIALES ===

// GET /facturas/buscar-proforma/:codigo - Buscar proforma por código para AJAX
router.get('/buscar-proforma/:codigo', (req, res) => {
    facturaController.buscarProformaPorCodigo(req, res);
});

// POST /facturas/desde-proforma - Crear factura desde proforma (usando datos del formulario)
router.post('/desde-proforma', (req, res) => {
    facturaController.crearDesdeProformaFormulario(req, res);
});

// POST /facturas/desde-proforma/:idProforma - Crear factura desde proforma
router.post('/desde-proforma/:idProforma', (req, res) => {
    facturaController.crearDesdeProforma(req, res);
});

// PUT /facturas/:id/estado - Cambiar estado de factura
router.put('/:id/estado', (req, res) => {
    facturaController.cambiarEstado(req, res);
});

// POST /facturas/:id/estado - Cambiar estado de factura (método POST)
router.post('/:id/estado', (req, res) => {
    facturaController.cambiarEstado(req, res);
});

// === RUTAS API ===

// GET /facturas/api/buscar - Buscar facturas (API)
router.get('/api/buscar', (req, res) => {
    facturaController.buscar(req, res);
});

// GET /facturas/api/estadisticas - Obtener estadísticas de facturas
router.get('/api/estadisticas', (req, res) => {
    facturaController.obtenerDatosAPI(req, res);
});

// === RUTAS DE IMPRESIÓN Y EXPORTACIÓN ===

// GET /facturas/:id/imprimir - Vista de impresión de factura
router.get('/:id/imprimir', (req, res) => {
    // Redirigir a la vista de detalle con parámetro de impresión
    req.query.print = true;
    facturaController.ver(req, res);
});

// GET /facturas/:id/pdf - Generar PDF de factura
router.get('/:id/pdf', (req, res) => {
    // Esta ruta podría ser implementada más adelante para generar PDF desde el servidor
    res.redirect(`/facturas/${req.params.id}?pdf=true`);
});

// === NUEVAS RUTAS PARA PRODUCTOS ADICIONALES ===

// POST /facturas/:id/productos - Agregar producto adicional a factura
router.post('/:id/productos', (req, res) => {
    facturaController.agregarProducto(req, res);
});

// DELETE /facturas/:id/productos/:idDetalle - Eliminar producto adicional
router.delete('/:id/productos/:idDetalle', (req, res) => {
    facturaController.eliminarProducto(req, res);
});

// POST /facturas/:id/productos/:idDetalle/eliminar - Eliminar producto (método POST)
router.post('/:id/productos/:idDetalle/eliminar', (req, res) => {
    facturaController.eliminarProducto(req, res);
});

module.exports = router;
