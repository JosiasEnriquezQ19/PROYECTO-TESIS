const Auditoria = require('../modelos/Auditoria');

/**
 * Helper para registrar eventos en la bitacora de auditoria.
 * Uso: await log(req, 'PRODUCTO', 'CREAR', `Creo el producto "${nombre}"`);
 */
async function log(req, modulo, accion, descripcion) {
    try {
        const usuario = req.session && req.session.usuario ? req.session.usuario : null;
        const ip = req.headers['x-forwarded-for']
            ? req.headers['x-forwarded-for'].split(',')[0].trim()
            : (req.socket && req.socket.remoteAddress) || null;

        await Auditoria.registrar({
            IdUsuario: usuario ? usuario.IdUsuario : null,
            NombreUsuario: usuario ? `${usuario.Nombres} ${usuario.Apellidos}` : 'Anonimo',
            Modulo: modulo,
            Accion: accion,
            Descripcion: descripcion,
            IP: ip
        });
    } catch (err) {
        console.error('[Auditoria] Error en helper log:', err.message);
    }
}

module.exports = { log };
