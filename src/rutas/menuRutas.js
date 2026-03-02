const express = require('express');
const router = express.Router();
const menuControlador = require('../controladores/menuControlador');
const { verificarAutenticacion, verificarRol } = require('../middleware/auth');

// Ruta para /menu - Solo Administrador (1) y Supervisor (3)
router.get('/menu', verificarAutenticacion, verificarRol(1, 3), menuControlador.mostrarMenu);

// Ruta para /menu/principal - Solo Administrador (1) y Supervisor (3)
router.get('/menu/principal', verificarAutenticacion, verificarRol(1, 3), menuControlador.mostrarMenu);

module.exports = router;