const express = require('express');
const router = express.Router();
const remuneracionController = require('../controladores/remuneracionController');
const { verificarAutenticacion } = require('../middleware/auth'); // Importar middleware de autenticación

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarAutenticacion);

router.get('/', remuneracionController.listar);
router.get('/crear', remuneracionController.crearForm);
router.post('/crear', remuneracionController.crear);
router.get('/editar/:id', remuneracionController.editarForm);
router.post('/editar/:id', remuneracionController.editar);
router.get('/eliminar/:id', remuneracionController.eliminar);

module.exports = router;
