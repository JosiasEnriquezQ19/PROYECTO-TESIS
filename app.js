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
    saveUninitialized: false
}));
app.use(flash());

// Middleware para pasar mensajes flash a todas las vistas
app.use((req, res, next) => {
    res.locals.messages = req.flash();
    next();
});

// Middleware global para pasar información del usuario a todas las vistas
const { tienePermiso } = require('./src/middleware/auth');

app.use((req, res, next) => {
    res.locals.user = req.session && req.session.usuario ? req.session.usuario : null;
    // Hacer disponible la función tienePermiso en todas las vistas
    res.locals.tienePermiso = tienePermiso;
    next();
});

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

