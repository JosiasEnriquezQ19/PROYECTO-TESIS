const Usuario = require('../modelos/Usuario');
const { log } = require('../middleware/auditoria');

exports.listarUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.listar();
        const roles = await Usuario.obtenerRoles();
        res.render('usuarios/listar', {
            title: 'Lista de Usuarios',
            usuarios,
            roles,
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
        const roles = await Usuario.obtenerRoles();
        res.render('usuarios/crear', { roles, success: req.flash('success'), error: req.flash('error') });
    } catch (error) {
        console.error('Error en mostrarFormularioCrear:', error);
        req.flash('error', 'Error al cargar el formulario de creacion');
        res.redirect('/usuarios');
    }
};

exports.crearUsuario = async (req, res) => {
    try {
        const usuarioId = await Usuario.crear(req.body);
        await log(req, 'USUARIOS', 'CREAR', `Creo el usuario: ${req.body.Nombres} ${req.body.Apellidos} (${req.body.Correo})`);
        req.flash('success', 'Usuario creado exitosamente');
        res.redirect('/usuarios');
    } catch (error) {
        req.flash('error', error.message);
        res.redirect('/usuarios');
    }
};

exports.mostrarFormularioEditar = async (req, res) => {
    try {
        const usuario = await Usuario.obtenerPorId(req.params.id);
        const roles = await Usuario.obtenerRoles();
        res.render('usuarios/editar', {
            usuario,
            roles,
            error: req.flash('error'),
            success: req.flash('success')
        });
    } catch (error) {
        req.flash('error', 'Error al cargar el usuario');
        res.redirect('/usuarios');
    }
};

exports.actualizarUsuario = async (req, res) => {
    try {
        const datosActualizacion = { ...req.body };
        if (datosActualizacion._method) delete datosActualizacion._method;

        const clave = datosActualizacion.Clave ? datosActualizacion.Clave.trim() : '';
        const confirmarClave = datosActualizacion.ConfirmarClave ? datosActualizacion.ConfirmarClave.trim() : '';

        delete datosActualizacion.ConfirmarClave;

        if (clave === '' && confirmarClave === '') {
            delete datosActualizacion.Clave;
        } else if (clave !== '' && confirmarClave !== '') {
            if (clave !== confirmarClave) throw new Error('Las contrasenas no coinciden');
            if (clave.length < 6) throw new Error('La contrasena debe tener al menos 6 caracteres');
            datosActualizacion.Clave = clave;
        } else {
            throw new Error('Si desea cambiar la contrasena, debe completar ambos campos');
        }

        await Usuario.actualizar(req.params.id, datosActualizacion);
        await log(req, 'USUARIOS', 'ACTUALIZAR', `Actualizo el usuario ID ${req.params.id}: ${datosActualizacion.Nombres || ''} ${datosActualizacion.Apellidos || ''}`);
        req.flash('success', 'Usuario actualizado exitosamente');
        res.redirect('/usuarios');
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        req.flash('error', error.message);
        res.redirect('/usuarios');
    }
};

exports.eliminarUsuario = async (req, res) => {
    try {
        const usuario = await Usuario.obtenerPorId(req.params.id);
        await Usuario.eliminar(req.params.id);
        await log(req, 'USUARIOS', 'ELIMINAR', `Inactivo el usuario ID ${req.params.id}: ${usuario ? usuario.Nombres + ' ' + usuario.Apellidos : ''}`);
        req.flash('success', 'Usuario inactivado exitosamente');
        res.redirect('/usuarios');
    } catch (error) {
        req.flash('error', 'Error al inactivar usuario');
        res.redirect('/usuarios');
    }
};