const express = require('express');
const router = express.Router();
const proformaController = require('../controladores/proformaController');
const { verificarAutenticacion } = require('../middleware/auth'); // Importar middleware de autenticación

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarAutenticacion);

router.get('/', proformaController.list);
router.get('/nueva', proformaController.createForm);
router.post('/nueva', proformaController.create);
router.get('/:id/detalle', proformaController.detail);
router.get('/:id/editar', proformaController.editForm);
router.post('/:id/editar', proformaController.update);
router.post('/:id/eliminar', proformaController.delete);
router.post('/:id/aprobar', proformaController.aprobar);

module.exports = router;
