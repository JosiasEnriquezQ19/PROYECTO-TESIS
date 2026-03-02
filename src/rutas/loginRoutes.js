const express = require('express');
const router = express.Router();
const loginController = require('../controladores/loginController');

router.get('/login', loginController.mostrarLogin);
router.post('/login', loginController.procesarLogin);
router.get('/logout', loginController.cerrarSesion);

module.exports = router;