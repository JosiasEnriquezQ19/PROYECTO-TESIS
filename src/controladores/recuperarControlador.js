const Recuperar = require('../modelos/recuperarModelo');

// Mostrar formulario de correo
exports.mostrarFormulario = (req, res) => {
    res.render('login/recuperar', { mensaje: null, correo: null });
};

// Procesar correo y mostrar formulario de nueva clave si existe
exports.procesarFormulario = async (req, res) => {
    const { correo } = req.body;
    const usuario = await Recuperar.buscarPorCorreo(correo);
    if (!usuario) {
        return res.render('login/recuperar', { mensaje: 'Correo no encontrado o usuario inactivo.', correo: null });
    }
    // Muestra el formulario para ingresar nueva clave, pasando usuarioId y correo
    res.render('login/nuevaClave', { correo: usuario.Correo, usuarioId: usuario.IdUsuario });
};

// Guardar la nueva contraseña
exports.guardarNuevaClave = async (req, res) => {
    const { usuarioId, nuevaClave } = req.body;

    try {
        const filasAfectadas = await Recuperar.actualizarClave(usuarioId, nuevaClave);

        if (filasAfectadas > 0) {
            // Redirige al login
            return res.redirect('/login');
        } else {
            res.render('login/nuevaClave', { 
                usuarioId, 
                correo: '', 
                mensaje: 'No se encontró el usuario o la contraseña no se actualizó.' 
            });
        }
    } catch (error) {
        res.render('login/nuevaClave', { 
            usuarioId, 
            correo: '', 
            mensaje: 'Error al actualizar la contraseña.' 
        });
    }
};