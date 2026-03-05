const Usuario = require('../modelos/Usuario');
const { log } = require('../middleware/auditoria');

exports.mostrarLogin = (req, res) => {
    res.render('login/login', { error: null });
};

exports.procesarLogin = async (req, res) => {
    const { correo, clave } = req.body;
    try {
        const usuario = await Usuario.autenticar(correo, clave);
        if (usuario) {
            await log(req, 'AUTH', 'LOGIN', `Inicio de sesion exitoso: ${correo}`);
            req.session.regenerate((err) => {
                if (err) {
                    console.error('Error al regenerar sesion:', err);
                    return res.render('login/login', { error: 'Error interno del servidor.' });
                }
                req.session.usuario = usuario;
                req.session.save((err) => {
                    if (err) {
                        console.error('Error al guardar sesion:', err);
                        return res.render('login/login', { error: 'Error interno del servidor.' });
                    }
                    if (usuario.IdRol === 2) {
                        return res.redirect('/asistencia/marcar');
                    } else {
                        return res.redirect('/menu');
                    }
                });
            });
        } else {
            await log(req, 'AUTH', 'LOGIN_FALLIDO', `Intento de acceso fallido: ${correo}`);
            res.render('login/login', { error: 'Correo o contrasena incorrectos.' });
        }
    } catch (error) {
        console.error('Error en el login:', error);
        res.render('login/login', { error: 'Error interno del servidor.' });
    }
};

exports.cerrarSesion = async (req, res) => {
    await log(req, 'AUTH', 'LOGOUT', `Cierre de sesion: ${req.session.usuario ? req.session.usuario.Correo : 'desconocido'}`);
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesion:', err);
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
};