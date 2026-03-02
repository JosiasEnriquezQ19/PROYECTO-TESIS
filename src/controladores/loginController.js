const Usuario = require('../modelos/Usuario');

exports.mostrarLogin = (req, res) => {
    res.render('login/login', { error: null });
};

exports.procesarLogin = async (req, res) => {
    const { correo, clave } = req.body;
    try {
        const usuario = await Usuario.autenticar(correo, clave);
        if (usuario) {
            // Regenerar la sesión para evitar datos antiguos
            req.session.regenerate((err) => {
                if (err) {
                    console.error('Error al regenerar sesión:', err);
                    return res.render('login/login', { error: 'Error interno del servidor.' });
                }
                req.session.usuario = usuario; // Guardar usuario en la nueva sesión
                req.session.save((err) => {
                    if (err) {
                        console.error('Error al guardar sesión:', err);
                        return res.render('login/login', { error: 'Error interno del servidor.' });
                    }
                    
                    // Redirigir según el rol del usuario
                    // IdRol 2 = Empleado -> va a marcado de asistencia
                    // IdRol 1 (Admin) y 3 (Supervisor) -> van al dashboard
                    if (usuario.IdRol === 2) {
                        return res.redirect('/asistencia/marcar');
                    } else {
                        return res.redirect('/menu');
                    }
                });
            });
        } else {
            res.render('login/login', { error: 'Correo o contraseña incorrectos.' });
        }
    } catch (error) {
        console.error('Error en el login:', error);
        res.render('login/login', { error: 'Error interno del servidor.' });
    }
};

exports.cerrarSesion = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
        }
        res.clearCookie('connect.sid'); // Limpiar cookie de sesión
        res.redirect('/login'); // Redirigir al login
    });
};