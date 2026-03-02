const Proveedor = require('../modelos/Proveedor');

// Listar todos los proveedores
exports.list = async (req, res) => {
    try {
        const proveedores = await Proveedor.getAll();
        
        res.render('proveedores/lista', { 
            title: 'Lista de Proveedores',
            proveedores,
            user: req.user,
            messages: req.flash()
        });
    } catch (error) {
        console.error('Error en proveedorController.list:', error);
        
        if (error.code === 'ER_NO_SUCH_TABLE') {
            req.flash('error', 'La tabla de proveedores no existe en la base de datos');
        } else {
            req.flash('error', 'Error al obtener la lista de proveedores');
        }
        
        res.redirect('/menu');
    }
};

// Mostrar formulario para crear nuevo proveedor
exports.createForm = (req, res) => {
    res.render('proveedores/crear', { 
        title: 'Registrar Proveedor',
        user: req.user,
        messages: req.flash()
    });
};

// Procesar creación de nuevo proveedor
exports.create = async (req, res) => {
    const { RUC, RazonSocial, Direccion, Telefono, Celular, Email, Contacto, Estado } = req.body;
    
    try {
        // Verificar si ya existe un proveedor con el mismo RUC
        const existeDuplicado = await Proveedor.checkDuplicateRuc(RUC);
        if (existeDuplicado) {
            req.flash('error', 'Ya existe un proveedor con este RUC');
            return res.redirect('/proveedores/crear');
        }
        
        const proveedorData = {
            RUC,
            RazonSocial,
            Direccion,
            Telefono,
            Celular,
            Email,
            Contacto,
            Estado: Estado ? 1 : 0
        };
        
        await Proveedor.create(proveedorData);
        req.flash('success', 'Proveedor registrado correctamente');
        res.redirect('/proveedores');
    } catch (error) {
        console.error('Error al crear proveedor:', error);
        req.flash('error', 'Error al registrar el proveedor');
        res.redirect('/proveedores/crear');
    }
};

// Mostrar formulario para editar proveedor
exports.editForm = async (req, res) => {
    try {
        const proveedor = await Proveedor.getById(req.params.id);
        if (!proveedor) {
            req.flash('error', 'Proveedor no encontrado');
            return res.redirect('/proveedores');
        }
        
        res.render('proveedores/editar', { 
            title: 'Editar Proveedor',
            proveedor,
            user: req.user,
            messages: req.flash()
        });
    } catch (error) {
        console.error('Error al cargar formulario de edición:', error);
        req.flash('error', 'Error al cargar el formulario de edición');
        res.redirect('/proveedores');
    }
};

// Procesar actualización de proveedor
exports.update = async (req, res) => {
    const { RUC, RazonSocial, Direccion, Telefono, Celular, Email, Contacto, Estado } = req.body;
    const id = req.params.id;
    
    try {
        // Verificar si ya existe otro proveedor con el mismo RUC
        const existeDuplicado = await Proveedor.checkDuplicateRuc(RUC, id);
        if (existeDuplicado) {
            req.flash('error', 'Ya existe otro proveedor con este RUC');
            return res.redirect(`/proveedores/editar/${id}`);
        }
        
        const proveedorData = {
            RUC,
            RazonSocial,
            Direccion,
            Telefono,
            Celular,
            Email,
            Contacto,
            Estado: Estado ? 1 : 0
        };
        
        const affectedRows = await Proveedor.update(id, proveedorData);
        if (affectedRows === 0) {
            req.flash('error', 'No se pudo actualizar el proveedor');
        } else {
            req.flash('success', 'Proveedor actualizado correctamente');
        }
        res.redirect('/proveedores');
    } catch (error) {
        console.error('Error al actualizar proveedor:', error);
        req.flash('error', 'Error al actualizar el proveedor');
        res.redirect(`/proveedores/editar/${id}`);
    }
};

// Eliminar proveedor
exports.delete = async (req, res) => {
    try {
        const affectedRows = await Proveedor.delete(req.params.id);
        if (affectedRows === 0) {
            req.flash('error', 'No se pudo eliminar el proveedor');
        } else {
            req.flash('success', 'Proveedor eliminado correctamente');
        }
        res.redirect('/proveedores');
    } catch (error) {
        console.error('Error al eliminar proveedor:', error);
        
        // Manejar el error si hay restricciones de clave foránea
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            req.flash('error', 'No se puede eliminar el proveedor porque está siendo utilizado en otros registros');
        } else {
            req.flash('error', 'Error al eliminar el proveedor');
        }
        
        res.redirect('/proveedores');
    }
};

// Cambiar estado del proveedor (activar/desactivar)
exports.cambiarEstado = async (req, res) => {
    const { id, estado } = req.params;
    
    try {
        const affectedRows = await Proveedor.cambiarEstado(id, estado === '1' ? 1 : 0);
        if (affectedRows === 0) {
            req.flash('error', 'No se pudo cambiar el estado del proveedor');
        } else {
            req.flash('success', `Proveedor ${estado === '1' ? 'activado' : 'desactivado'} correctamente`);
        }
        res.redirect('/proveedores');
    } catch (error) {
        console.error('Error al cambiar estado del proveedor:', error);
        req.flash('error', 'Error al cambiar el estado del proveedor');
        res.redirect('/proveedores');
    }
};
