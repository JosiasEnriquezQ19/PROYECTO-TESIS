const express = require('express');
const router = express.Router();
const recuperarControlador = require('../controladores/recuperarControlador');

// Mostrar formulario de correo
router.get('/recuperar', recuperarControlador.mostrarFormulario);

// Procesar correo y mostrar formulario de nueva clave
router.post('/recuperar', recuperarControlador.procesarFormulario);

// Guardar nueva clave
router.post('/nueva-clave', recuperarControlador.guardarNuevaClave);

module.exports = router;