const Usuario = require('../modelos/Usuario');

exports.listarUsuarios = async (req, res) => {
    try {
        //console.log('Entrando a listarUsuarios');
        const usuarios = await Usuario.listar();
        res.render('usuarios/listar', { 
            title: 'Lista de Usuarios',
            usuarios,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        console.error('Error en listarUsuarios:', error);
        res.status(500).send('Error al obtener usuarios');
    }
};

exports.mostrarFormularioCrear = async (req, res) => {
    try {
        const roles = await Usuario.obtenerRoles(); // Obtener los roles desde el modelo
        res.render('usuarios/crear', { roles, success: req.flash('success'), error: req.flash('error') });
    } catch (error) {
        console.error('Error en mostrarFormularioCrear:', error);
        req.flash('error', 'Error al cargar el formulario de creación');
        res.redirect('/usuarios');
    }
};

exports.crearUsuario = async (req, res) => {
    try {
        const usuarioId = await Usuario.crear(req.body);
        req.flash('success', 'Usuario creado exitosamente');
        res.redirect('/usuarios');
    } catch (error) {
        req.flash('error', error.message);
        const roles = await Usuario.obtenerRoles();
        res.render('usuarios/crear', { 
            title: 'Crear Nuevo Usuario',
            usuario: req.body,
            roles,
            error: error.message
        });
    }
};

exports.mostrarFormularioEditar = async (req, res) => {
    try {
        const usuario = await Usuario.obtenerPorId(req.params.id);
        const roles = await Usuario.obtenerRoles();
        res.render('usuarios/editar', {
            usuario,
            roles,
            error: req.flash('error'), // Asegúrate de enviar esto
            success: req.flash('success') // Si usas mensajes de éxito
        });
    } catch (error) {
        req.flash('error', 'Error al cargar el usuario');
        res.redirect('/usuarios');
    }
};

exports.actualizarUsuario = async (req, res) => {
    try {
        const datosActualizacion = { ...req.body };
        
        // Limpiar y validar campos de contraseña
        const clave = datosActualizacion.Clave ? datosActualizacion.Clave.trim() : '';
        const confirmarClave = datosActualizacion.ConfirmarClave ? datosActualizacion.ConfirmarClave.trim() : '';
        
        // Siempre eliminar los campos de confirmación
        delete datosActualizacion.ConfirmarClave;
        
        // Manejo de la contraseña
        if (clave === '' && confirmarClave === '') {
            // Ambos campos vacíos = no cambiar contraseña
            delete datosActualizacion.Clave;
            console.log('Contraseña no se cambiará - campos vacíos');
        } else if (clave !== '' && confirmarClave !== '') {
            // Ambos campos llenos = cambiar contraseña
            if (clave !== confirmarClave) {
                throw new Error('Las contraseñas no coinciden');
            }
            if (clave.length < 6) {
                throw new Error('La contraseña debe tener al menos 6 caracteres');
            }
            // Mantener la nueva contraseña en datosActualizacion
            datosActualizacion.Clave = clave;
            console.log('Contraseña se cambiará');
        } else {
            // Un campo lleno y otro vacío = error
            throw new Error('Si desea cambiar la contraseña, debe completar ambos campos');
        }
        
        await Usuario.actualizar(req.params.id, datosActualizacion);
        req.flash('success', 'Usuario actualizado exitosamente');
        res.redirect('/usuarios');
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        try {
            const usuario = await Usuario.obtenerPorId(req.params.id);
            const roles = await Usuario.obtenerRoles();
            res.render('usuarios/editar', { 
                title: 'Editar Usuario',
                usuario: usuario,
                roles,
                error: error.message,
                success: null
            });
        } catch (dbError) {
            console.error('Error al obtener datos para re-render:', dbError);
            req.flash('error', error.message);
            res.redirect('/usuarios');
        }
    }
};

exports.eliminarUsuario = async (req, res) => {
    try {
        await Usuario.eliminar(req.params.id);
        req.flash('success', 'Usuario eliminado exitosamente');
        res.redirect('/usuarios');
    } catch (error) {
        req.flash('error', 'Error al eliminar usuario');
        res.redirect('/usuarios');
    }
};