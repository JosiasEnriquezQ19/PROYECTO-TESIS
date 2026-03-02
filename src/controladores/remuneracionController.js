const Remuneracion = require('../modelos/Remuneracion');
const Usuario = require('../modelos/Usuario');

// Controlador de remuneración con estructura y manejo de mensajes uniforme
const remuneracionController = {
    listar: async (req, res) => {
        try {
            const remuneraciones = await Remuneracion.getAll();
            res.render('pagos/listar', {
                title: 'Remuneraciones',
                remuneraciones,
                success: req.query.success || null,
                error: req.query.error || null,
                user: req.user
            });
        } catch (error) {
            console.error('Error en remuneracionController.listar:', error);
            res.render('pagos/listar', {
                title: 'Remuneraciones',
                remuneraciones: [],
                success: null,
                error: 'Error al obtener las remuneraciones: ' + error.message,
                user: req.user
            });
        }
    },

    crearForm: async (req, res) => {
        try {
            const usuarios = await Usuario.listar();
            res.render('pagos/crear', {
                title: 'Registrar Remuneración',
                usuarios,
                success: req.query.success || null,
                error: req.query.error || null,
                user: req.user
            });
        } catch (error) {
            console.error('Error en remuneracionController.crearForm:', error);
            res.redirect('/pagos/remuneracion?error=Error al cargar el formulario');
        }
    },

    crear: async (req, res) => {
        try {
            // Validar datos requeridos
            const { IdUsuario, Periodo, FechaInicio, FechaFin, SueldoBase, Total } = req.body;
            
            if (!IdUsuario || !Periodo || !FechaInicio || !FechaFin || !SueldoBase || !Total) {
                return res.redirect('/pagos/remuneracion/crear?error=Todos los campos obligatorios deben ser completados');
            }

            await Remuneracion.create(req.body);
            res.redirect('/pagos/remuneracion?success=Remuneración registrada correctamente');
        } catch (error) {
            console.error('Error en remuneracionController.crear:', error);
            
            // Verificar si es error de clave duplicada u otro error específico
            let errorMessage = 'Error al registrar la remuneración';
            if (error.code === 'ER_DUP_ENTRY') {
                errorMessage = 'Ya existe una remuneración para este empleado en el período especificado';
            } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                errorMessage = 'El empleado seleccionado no existe';
            } else if (error.sqlMessage) {
                errorMessage = 'Error de base de datos: ' + error.sqlMessage;
            }
            
            res.redirect('/pagos/remuneracion/crear?error=' + encodeURIComponent(errorMessage));
        }
    },

    editarForm: async (req, res) => {
        try {
            const remuneracion = await Remuneracion.getById(req.params.id);
            if (!remuneracion) {
                return res.redirect('/pagos/remuneracion?error=Remuneración no encontrada');
            }
            
            const usuarios = await Usuario.listar();
            res.render('pagos/edit', {
                title: 'Editar Remuneración',
                remuneracion,
                usuarios,
                success: req.query.success || null,
                error: req.query.error || null,
                user: req.user
            });
        } catch (error) {
            console.error('Error en remuneracionController.editarForm:', error);
            res.redirect('/pagos/remuneracion?error=Error al cargar el formulario de edición');
        }
    },

    editar: async (req, res) => {
        try {
            // Validar datos requeridos
            const { IdUsuario, Periodo, FechaInicio, FechaFin, SueldoBase, Total } = req.body;
            
            if (!IdUsuario || !Periodo || !FechaInicio || !FechaFin || !SueldoBase || !Total) {
                return res.redirect(`/pagos/remuneracion/editar/${req.params.id}?error=Todos los campos obligatorios deben ser completados`);
            }

            await Remuneracion.update(req.params.id, req.body);
            res.redirect('/pagos/remuneracion?success=Remuneración actualizada correctamente');
        } catch (error) {
            console.error('Error en remuneracionController.editar:', error);
            
            let errorMessage = 'Error al actualizar la remuneración';
            if (error.code === 'ER_DUP_ENTRY') {
                errorMessage = 'Ya existe una remuneración para este empleado en el período especificado';
            } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                errorMessage = 'El empleado seleccionado no existe';
            } else if (error.sqlMessage) {
                errorMessage = 'Error de base de datos: ' + error.sqlMessage;
            }
            
            res.redirect(`/pagos/remuneracion/editar/${req.params.id}?error=` + encodeURIComponent(errorMessage));
        }
    },

    eliminar: async (req, res) => {
        try {
            await Remuneracion.delete(req.params.id);
            res.redirect('/pagos/remuneracion?success=Remuneración eliminada correctamente');
        } catch (error) {
            console.error('Error en remuneracionController.eliminar:', error);
            res.redirect('/pagos/remuneracion?error=Error al eliminar la remuneración');
        }
    }
};

module.exports = remuneracionController;
