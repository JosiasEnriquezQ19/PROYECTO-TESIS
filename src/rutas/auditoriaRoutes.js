const express = require('express');
const router = express.Router();
const auditoriaController = require('../controladores/auditoriaController');
const { verificarAutenticacion, verificarRol } = require('../middleware/auth');

// Solo Admin (1) puede ver la bitacora
router.get('/auditoria', verificarAutenticacion, verificarRol(1), auditoriaController.mostrarAuditoria);

module.exports = router;
