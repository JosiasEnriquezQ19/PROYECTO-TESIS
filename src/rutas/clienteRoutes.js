const express = require('express');
const router = express.Router();
const clienteController = require('../controladores/clienteController');
const { verificarAutenticacion } = require('../middleware/auth'); // Importar middleware de autenticación

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarAutenticacion);

// Rutas para clientes
router.get('/', clienteController.listarClientes);
router.get('/crear', clienteController.mostrarFormularioCrear);
router.post('/crear', clienteController.crearCliente);
router.get('/editar/:id', clienteController.mostrarFormularioEditar);
router.post('/editar/:id', clienteController.actualizarCliente);
router.get('/eliminar/:id', clienteController.eliminarCliente);

module.exports = router;