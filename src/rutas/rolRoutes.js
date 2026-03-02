const express = require('express');
const router = express.Router();
const rolController = require('../controladores/rolController');
const { verificarAutenticacion } = require('../middleware/auth'); // Importar middleware de autenticación

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarAutenticacion);

router.get('/', rolController.listar);
router.get('/crear', rolController.crearForm);
router.post('/crear', rolController.crear);
router.get('/editar/:id', rolController.editarForm);
router.post('/editar/:id', rolController.editar);
router.get('/eliminar/:id', rolController.eliminar);

module.exports = router;
