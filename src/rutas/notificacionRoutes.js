const express = require('express');
const router = express.Router();
const Notificacion = require('../modelos/Notificacion');

// Verificar que el usuario esta autenticado
function verificarAuth(req, res, next) {
    if (req.session && req.session.usuario) {
        next();
    } else {
        res.status(401).json({ error: 'No autorizado' });
    }
}

// GET /notificaciones - Vista de página de notificaciones
router.get('/notificaciones', verificarAuth, async (req, res) => {
    try {
        const notificaciones = await Notificacion.obtenerRecientes(50);
        res.render('notificaciones/lista', {
            title: 'Notificaciones',
            notificaciones,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        console.error('Error al cargar la página de notificaciones:', error);
        req.flash('error', 'Error al cargar notificaciones');
        res.redirect('/menu/principal');
    }
});

// GET /api/notificaciones - Obtener notificaciones recientes
router.get('/api/notificaciones', verificarAuth, async (req, res) => {
    try {
        const notificaciones = await Notificacion.obtenerRecientes(20);
        const noLeidas = await Notificacion.contarNoLeidas();
        res.json({ notificaciones, noLeidas });
    } catch (error) {
        console.error('Error al obtener notificaciones:', error);
        res.json({ notificaciones: [], noLeidas: 0 });
    }
});

// GET /api/notificaciones/count - Contar no leidas
router.get('/api/notificaciones/count', verificarAuth, async (req, res) => {
    try {
        const total = await Notificacion.contarNoLeidas();
        res.json({ noLeidas: total });
    } catch (error) {
        console.error('Error al contar notificaciones:', error);
        res.json({ noLeidas: 0 });
    }
});

// POST /api/notificaciones/leer/:id - Marcar una como leida
router.post('/api/notificaciones/leer/:id', verificarAuth, async (req, res) => {
    try {
        await Notificacion.marcarLeida(req.params.id);
        res.json({ ok: true });
    } catch (error) {
        console.error('Error al marcar notificacion:', error);
        res.json({ ok: false });
    }
});

// POST /api/notificaciones/leer-todas - Marcar todas como leidas
router.post('/api/notificaciones/leer-todas', verificarAuth, async (req, res) => {
    try {
        await Notificacion.marcarTodasLeidas();
        res.json({ ok: true });
    } catch (error) {
        console.error('Error al marcar notificaciones:', error);
        res.json({ ok: false });
    }
});

module.exports = router;
