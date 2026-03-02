const express = require('express');
const router = express.Router();
const empleadoController = require('../controladores/empleadoController'); // Asegúrate de que el archivo existe y está correctamente importado
const { verificarAutenticacion } = require('../middleware/auth'); // Importar middleware de autenticación

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarAutenticacion);

// Listar empleados
router.get('/empleados', empleadoController.list);

// Mostrar formulario para crear empleado
router.get('/empleados/create', empleadoController.createForm);

// Crear empleado
router.post('/empleados', empleadoController.create);

// Mostrar formulario para editar empleado
router.get('/empleados/:id/edit', empleadoController.editForm);

// Actualizar empleado
router.put('/empleados/:id', empleadoController.update);

// Eliminar empleado
router.post('/empleados/:id/delete', empleadoController.delete);

module.exports = router;