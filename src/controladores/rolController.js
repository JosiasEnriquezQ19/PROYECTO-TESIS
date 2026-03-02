const Rol = require('../modelos/Rol');

const rolController = {
    listar: async (req, res) => {
        try {
            const roles = await Rol.getAll();
            res.render('roles/listar', { roles, messages: req.flash() });
        } catch (error) {
            req.flash('error', 'Error al obtener los roles');
            res.redirect('/');
        }
    },
    crearForm: (req, res) => {
        res.render('roles/crear', { messages: req.flash() });
    },
    crear: async (req, res) => {
        try {
            await Rol.create(req.body);
            req.flash('success', 'Rol creado correctamente');
            res.redirect('/roles');
        } catch (error) {
            req.flash('error', 'Error al crear el rol');
            res.redirect('/roles/crear');
        }
    },
    editarForm: async (req, res) => {
        try {
            const rol = await Rol.getById(req.params.id);
            res.render('roles/editar', { rol, messages: req.flash() });
        } catch (error) {
            req.flash('error', 'Error al cargar el rol');
            res.redirect('/roles');
        }
    },
    editar: async (req, res) => {
        try {
            await Rol.update(req.params.id, req.body);
            req.flash('success', 'Rol actualizado correctamente');
            res.redirect('/roles');
        } catch (error) {
            req.flash('error', 'Error al actualizar el rol');
            res.redirect(`/roles/editar/${req.params.id}`);
        }
    },
    eliminar: async (req, res) => {
        try {
            await Rol.delete(req.params.id);
            req.flash('success', 'Rol eliminado correctamente');
        } catch (error) {
            req.flash('error', 'Error al eliminar el rol');
        }
        res.redirect('/roles');
    }
};

module.exports = rolController;
