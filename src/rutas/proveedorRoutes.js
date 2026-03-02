const express = require('express');
const router = express.Router();
const proveedorController = require('../controladores/proveedorController');
const { verificarAutenticacion } = require('../middleware/auth'); // Asegúrate de que este middleware exista

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarAutenticacion);

// Rutas para proveedores
router.get('/', proveedorController.list);
router.get('/crear', proveedorController.createForm);
router.post('/crear', proveedorController.create);
router.get('/editar/:id', proveedorController.editForm);
router.post('/editar/:id', proveedorController.update);
router.post('/eliminar/:id', proveedorController.delete);
router.post('/cambiarEstado/:id/:estado', proveedorController.cambiarEstado);

module.exports = router;
