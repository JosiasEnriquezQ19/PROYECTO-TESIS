const express = require('express');
const router = express.Router();
const ContratoController = require('../controladores/contratoController');
const { verificarAutenticacion } = require('../middleware/auth');

// Crear instancia del controlador
const contratoController = new ContratoController();

// Middleware de autenticación para todas las rutas
router.use(verificarAutenticacion);

// Rutas principales
router.get('/', contratoController.listar.bind(contratoController));
router.get('/crear', contratoController.mostrarCrear.bind(contratoController));
router.post('/crear', contratoController.crear.bind(contratoController));
router.get('/:id', contratoController.ver.bind(contratoController));
router.get('/:id/editar', contratoController.mostrarEditar.bind(contratoController));
router.post('/:id/editar', contratoController.actualizar.bind(contratoController));
router.delete('/:id', contratoController.eliminar.bind(contratoController));

// Rutas de API
router.post('/:id/estado', contratoController.cambiarEstado.bind(contratoController));
router.get('/api/activos', contratoController.obtenerActivos.bind(contratoController));
router.get('/api/facturas-cliente/:idCliente', contratoController.obtenerFacturasPorCliente.bind(contratoController));

module.exports = router;
