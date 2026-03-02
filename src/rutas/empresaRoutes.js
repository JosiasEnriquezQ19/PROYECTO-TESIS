const express = require('express');
const router = express.Router();
const empresaController = require('../controladores/empresaController');
const { verificarAutenticacion, verificarRol } = require('../middleware/auth'); // Importar middleware de autenticación

// Aplicar middleware de autenticación y verificación de rol (Solo Administrador)
router.use(verificarAutenticacion, verificarRol(1)); // IdRol 1 = Administrador

router.get('/', empresaController.listar);
router.get('/crear', empresaController.crearForm);
router.post('/crear', empresaController.uploadMiddleware, empresaController.crear);
router.get('/editar/:id', empresaController.editarForm);
router.post('/editar/:id', empresaController.uploadMiddleware, empresaController.editar);
router.get('/eliminar/:id', empresaController.eliminar);
router.get('/logo/:id', empresaController.mostrarLogo);

module.exports = router;
