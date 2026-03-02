const Empleado = require('../modelos/Empleado');
const Usuario = require('../modelos/Usuario');

exports.list = async (req, res) => {
    try {
        const empleados = await Empleado.getAll();
        const user = req.session && req.session.usuario ? req.session.usuario : null;
        
        res.render('empleados/lista', { 
            empleados,
            user: user,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        console.error('Error al listar empleados:', error);
        req.flash('error', 'Error al cargar empleados');
        res.redirect('/menu/principal');
    }
};

exports.createForm = async (req, res) => {
    try {
        const usuarios = await Usuario.getAll();
        const user = req.session && req.session.usuario ? req.session.usuario : null;
        
        res.render('empleados/create', { 
            usuarios,
            user: user,
            messages: {
                success: req.flash('success'),
                error: req.flash('error')
            }
        });
    } catch (error) {
        console.error('Error al cargar formulario:', error);
        req.flash('error', 'Error al cargar formulario');
        res.redirect('/empleados');
    }
};

exports.create = async (req, res) => {
    try {
        await Empleado.create(req.body);
        req.flash('success', 'Empleado creado exitosamente');
        res.redirect('/empleados');
    } catch (error) {
        console.error('Error al crear empleado:', error);
        req.flash('error', 'Error al crear empleado');
        res.redirect('/empleados/nuevo');
    }
};

exports.editForm = async (req, res) => {
    try {
        const empleado = await Empleado.getById(req.params.id);
        const usuarios = await Usuario.getAll();
        const user = req.session && req.session.usuario ? req.session.usuario : null;
        
        if (!empleado) {
            req.flash('error', 'Empleado no encontrado');
            return res.redirect('/empleados');
        }
        
        res.render('empleados/edit', { 
            empleado,
            usuarios,
            user: user,
            messages: {
                success: req.flash('success'),
                error: req.flash('error')
            }
        });
    } catch (error) {
        console.error('Error al cargar empleado:', error);
        req.flash('error', 'Error al cargar empleado');
        res.redirect('/empleados');
    }
};

exports.update = async (req, res) => {
    try {
        await Empleado.update(req.params.id, req.body);
        req.flash('success', 'Empleado actualizado exitosamente');
        res.redirect('/empleados');
    } catch (error) {
        console.error('Error al actualizar empleado:', error);
        req.flash('error', 'Error al actualizar empleado');
        res.redirect(`/empleados/editar/${req.params.id}`);
    }
};

exports.delete = async (req, res) => {
    try {
        await Empleado.delete(req.params.id);
        req.flash('success', 'Empleado eliminado exitosamente');
        res.redirect('/empleados');
    } catch (error) {
        console.error('Error al eliminar empleado:', error);
        req.flash('error', 'Error al eliminar empleado');
        res.redirect('/empleados');
    }
};