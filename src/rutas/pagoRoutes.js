const express = require('express');
const router = express.Router();
const pagoController = require('../controladores/pagoController');
const { verificarAutenticacion } = require('../middleware/auth');

router.use(verificarAutenticacion);

// Rutas principales
router.get('/', pagoController.listar); // Para /pagos
router.get('/listar', pagoController.listar); // Para /pagos/listar
router.get('/crear', pagoController.crearForm);
router.post('/crear', pagoController.crear);
router.get('/editar/:id', pagoController.editarForm);
router.post('/editar/:id', pagoController.editar);
router.get('/eliminar/:id', pagoController.eliminar);
router.post('/calcular', pagoController.calcularPagoSemanal);

// Rutas API para integración con formularios y asistencias
router.get('/calcular-horas', pagoController.calcularHorasTrabajadas); // Cambiado para usar el controlador

router.get('/api/obtener-horas-trabajadas', pagoController.obtenerHorasTrabajadas);
router.get('/api/resumen-asistencias', pagoController.obtenerResumenAsistencias);
router.post('/api/registrar-asistencia', pagoController.registrarAsistenciaDiaria);

module.exports = router;
