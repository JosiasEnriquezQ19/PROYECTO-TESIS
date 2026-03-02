const express = require('express');
const router = express.Router();
const productoController = require('../controladores/productoController');
const { verificarAutenticacion } = require('../middleware/auth'); // Importar middleware de autenticación

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarAutenticacion);

// Rutas para productos
router.get('/', productoController.listarProductos);
router.get('/crear', productoController.mostrarFormularioCrear);
router.post('/crear', productoController.crearProducto);
router.get('/editar/:id', productoController.mostrarFormularioEditar);
router.post('/editar/:id', productoController.actualizarProducto);
router.get('/eliminar/:id', productoController.eliminarProducto);

// Ruta API para obtener productos (para AJAX)
router.get('/api/listar', productoController.listarProductosAPI);

module.exports = router;
