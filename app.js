const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const flash = require('connect-flash');

const methodOverride = require('./src/middleware/methodOverride');
const { notificacionMiddleware } = require('./src/middleware/notificacion');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/vistas'));

app.use(express.static(path.join(__dirname, 'src')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Habilita parseo de JSON en requests
app.use(methodOverride('_method'));

app.use(session({
    store: new FileStore({ path: './sessions' }),
    secret: 'carsil-secret', // Cambia esto por una clave segura
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 20 * 60 * 1000 // 20 minutos de inactividad
    }
}));
app.use(flash());

// Middleware para pasar mensajes flash a todas las vistas
app.use((req, res, next) => {
    res.locals.messages = req.flash();
    next();
});

// Importar modelo Notificacion para uso en middleware
const Notificacion = require('./src/modelos/Notificacion');
const { tienePermiso } = require('./src/middleware/auth');

// Middleware para cargar datos globales en res.locals
app.use(async (req, res, next) => {
    // Garantizar que LoginTime siempre exista en la sesión
    if (req.session && req.session.usuario && !req.session.usuario.LoginTime) {
        req.session.usuario.LoginTime = Date.now();
        // Guardar explícitamente para que express-session lo registre en disco
        req.session.save();
    }
    res.locals.user = req.session && req.session.usuario ? req.session.usuario : null;
    res.locals.tienePermiso = tienePermiso;

    if (res.locals.user) {
        try {
            res.locals.unreadNotificationsCount = await Notificacion.contarNoLeidas();
        } catch (error) {
            console.error('Error fetching unread notifications:', error);
            res.locals.unreadNotificationsCount = 0;
        }
    } else {
        res.locals.unreadNotificationsCount = 0;
    }
    next();
});

// === MIDDLEWARE DE SEGURIDAD GLOBAL ===
// Proteger TODAS las rutas por defecto, excepto las explícitamente públicas
app.use((req, res, next) => {
    const publicPathsStrict = ['/login', '/login/procesar', '/recuperar', '/recuperar/procesar', '/recuperar/restablecer'];
    const publicPrefixes = ['/css/', '/js/', '/img/', '/publico/', '/api/'];

    // Comprobar rutas exactas
    if (publicPathsStrict.includes(req.path)) {
        return next();
    }

    // Comprobar prefijos
    const isPublicPrefix = publicPrefixes.some(prefix => req.path.startsWith(prefix));
    if (isPublicPrefix) {
        return next();
    }

    // Si no es pública, requerir sesión
    if (!req.session || !req.session.usuario) {
        req.flash('error', 'Por seguridad, debes iniciar sesión para acceder al sistema');
        return res.redirect('/login');
    }

    // Evitar caché de páginas protegidas
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});
// =====================================

// === MIDDLEWARE DE CONTROL DE ROLES ===
// Verificar permisos de rol según la ruta solicitada
app.use((req, res, next) => {
    if (!req.session || !req.session.usuario) return next();

    const usuario = req.session.usuario;

    // Permitir siempre el marcado de asistencia para todos los roles
    if (req.path === '/asistencia/marcar' || req.path.startsWith('/asistencia/marcar/')) {
        return next();
    }

    // Empleados (rol 2) solo pueden acceder a /asistencia/marcar
    if (usuario.IdRol === 2) {
        req.flash('error', 'No tiene permisos para acceder a esta sección');
        return res.redirect('/asistencia/marcar');
    }

    // Mapa de rutas a módulos de permisos
    const pathModuleMap = {
        '/proformas': 'proformas',
        '/facturas': 'facturas',
        '/clientes': 'clientes',
        '/productos': 'productos',
        '/empleados': 'empleados',
        '/pagos': 'pagos',
        '/reportes': 'reportes',
        '/usuarios': 'usuarios',
        '/asistencia': 'asistencias',
        '/empresa': 'empresa',
        '/auditoria': 'auditoria',
        '/roles': 'usuarios'
    };

    // Buscar el módulo correspondiente a la ruta actual
    const moduloPath = Object.keys(pathModuleMap).find(p => req.path.startsWith(p));

    if (moduloPath) {
        const modulo = pathModuleMap[moduloPath];
        if (!tienePermiso(usuario, modulo)) {
            req.flash('error', 'No tiene permisos para acceder a esta sección');
            return res.redirect('/menu/principal');
        }
    }

    next();
});
// =====================================

// Rutas
const loginRoutes = require('./src/rutas/loginRoutes');
app.use('/', loginRoutes);

const menuRutas = require('./src/rutas/menuRutas');
app.use('/', menuRutas);

const recuperarRutas = require('./src/rutas/recuperarRutas');
app.use('/', recuperarRutas);

// API de notificaciones
const notificacionRoutes = require('./src/rutas/notificacionRoutes');
app.use('/', notificacionRoutes);

// Rutas con middleware de notificaciones
const asistenciaRoutes = require('./src/rutas/asistenciaRoutes');
app.use('/', notificacionMiddleware('asistencias'), asistenciaRoutes);

const empleadoRutas = require('./src/rutas/empleadoRoutes');
app.use('/', notificacionMiddleware('empleados'), empleadoRutas);

const clienteRoutes = require('./src/rutas/clienteRoutes');
app.use('/clientes', notificacionMiddleware('clientes'), clienteRoutes);

const usuarioRoutes = require('./src/rutas/usuarioRoutes');
app.use('/', notificacionMiddleware('usuarios'), usuarioRoutes);

const empresaRoutes = require('./src/rutas/empresaRoutes');
const proformaRoutes = require('./src/rutas/proformaRoutes');
const facturaRoutes = require('./src/rutas/facturaRoutes');
const productoRoutes = require('./src/rutas/productoRoutes');
const rolRoutes = require('./src/rutas/rolRoutes');
const reporteRoutes = require('./src/rutas/reporteRoutes');

app.use('/empresa', notificacionMiddleware('empresa'), empresaRoutes);
app.use('/proformas', notificacionMiddleware('proformas'), proformaRoutes);
app.use('/facturas', notificacionMiddleware('facturas'), facturaRoutes);
app.use('/productos', notificacionMiddleware('productos'), productoRoutes);
app.use('/roles', notificacionMiddleware('roles'), rolRoutes);
app.use('/reportes', reporteRoutes);
app.use('/pagos', notificacionMiddleware('pagos'), require('./src/rutas/pagoRoutes'));

// Bitacora de auditoria (solo admin)
const auditoriaRoutes = require('./src/rutas/auditoriaRoutes');
app.use('/', auditoriaRoutes);

const PORT = process.env.PORT || 3000;
console.log('Starting server on port:', PORT);
app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
});

