const Notificacion = require('../modelos/Notificacion');

// Iconos por modulo
const moduloIconos = {
    clientes: 'bi-people',
    proformas: 'bi-file-earmark-text',
    facturas: 'bi-receipt',
    productos: 'bi-box-seam',
    empleados: 'bi-person-badge',
    pagos: 'bi-wallet2',
    asistencias: 'bi-calendar-check',
    usuarios: 'bi-shield-check',
    roles: 'bi-key',
    empresa: 'bi-gear'
};

// Nombres legibles por modulo
const moduloNombres = {
    clientes: 'Cliente',
    proformas: 'Proforma',
    facturas: 'Factura',
    productos: 'Producto',
    empleados: 'Empleado',
    pagos: 'Pago',
    asistencias: 'Asistencia',
    usuarios: 'Usuario',
    roles: 'Rol',
    empresa: 'Empresa'
};

/**
 * Registra una notificacion de forma asincrona (no bloquea la respuesta)
 */
function registrarNotificacion(tipo, modulo, detalle, usuario) {
    const nombreModulo = moduloNombres[modulo] || modulo;
    let mensaje = '';

    switch (tipo) {
        case 'CREAR':
            mensaje = `Se registro un nuevo ${nombreModulo}`;
            break;
        case 'ACTUALIZAR':
            mensaje = `Se actualizo un ${nombreModulo}`;
            break;
        case 'ELIMINAR':
            mensaje = `Se elimino un ${nombreModulo}`;
            break;
        default:
            mensaje = `Operacion en ${nombreModulo}`;
    }

    // Fire and forget - no bloquea la respuesta
    Notificacion.crear({
        Tipo: tipo,
        Modulo: modulo,
        Mensaje: mensaje,
        Detalle: detalle || null,
        Usuario: usuario || null
    }).catch(err => {
        console.error('Error al crear notificacion:', err.message);
    });
}

/**
 * Middleware que intercepta las respuestas de redirect despues de un CRUD
 */
function notificacionMiddleware(modulo) {
    return function (req, res, next) {
        // Guardar el redirect original
        const originalRedirect = res.redirect.bind(res);
        const usuario = req.session && req.session.usuario ? req.session.usuario.Nombres : 'Sistema';

        res.redirect = function (url) {
            // Detectar tipo de operacion por el metodo HTTP y la URL
            let tipo = null;
            let detalle = null;

            if (req.method === 'POST' && !req.params.id) {
                tipo = 'CREAR';
                detalle = req.body.RazonSocial || req.body.Nombres || req.body.Nombre || req.body.Descripcion || null;
            } else if (req.method === 'POST' && req.params.id) {
                tipo = 'ACTUALIZAR';
                detalle = `ID: ${req.params.id}`;
            } else if (req.method === 'PUT' || req.method === 'PATCH') {
                tipo = 'ACTUALIZAR';
                detalle = `ID: ${req.params.id}`;
            } else if (req.method === 'DELETE') {
                tipo = 'ELIMINAR';
                detalle = `ID: ${req.params.id}`;
            }

            // Solo registrar si es una operacion CRUD válida y no un simple listado
            if (tipo && typeof url === 'string' && !url.includes('error=')) {
                registrarNotificacion(tipo, modulo, detalle, usuario);
            }

            // Llamar al redirect original
            return originalRedirect(url);
        };

        next();
    };
}

module.exports = { notificacionMiddleware, registrarNotificacion, moduloIconos };
