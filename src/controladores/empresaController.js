const Empresa = require('../modelos/Empresa');
const multer = require('multer');
const path = require('path');

// Configuración de multer para el manejo de archivos
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Verificar que sea una imagen
        if (file.fieldname === 'Logo') {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (allowedTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('Solo se permiten archivos de imagen (JPG, PNG, GIF)'), false);
            }
        } else {
            cb(null, true);
        }
    },
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB máximo
    }
});

// Controlador de empresa con estructura y manejo de mensajes similar a asistenciaController
const empresaController = {
    listar: async (req, res) => {
        try {
            const empresas = await Empresa.getAll();
            const user = req.session && req.session.usuario ? req.session.usuario : null;
            res.render('empresa/lista', {
                title: 'Empresas',
                empresas,
                user: user,
                messages: req.flash()
            });
        } catch (error) {
            console.error('Error en empresaController.list:', error);
            req.flash('error', 'Error al obtener las empresas');
            res.redirect('/empresa');
        }
    },
    crearForm: (req, res) => {
        const user = req.session && req.session.usuario ? req.session.usuario : null;
        res.render('empresa/crear', {
            title: 'Registrar Empresa',
            user: user,
            messages: req.flash()
        });
    },
    crear: async (req, res) => {
        try {
            // Sanitize and validate input
            const data = {
                Nombre: req.body.Nombre || null,
                RUC: req.body.RUC,
                Direccion: req.body.Direccion,
                Telefono: req.body.Telefono || null,
                Celular: req.body.Celular || null,
                Email: req.body.Email || null,
                Logo: req.file && req.file.fieldname === 'Logo' ? req.file.buffer : null,
                TextoPresentacion: req.body.TextoPresentacion || null,
                CuentaBancaria: req.body.CuentaBancaria || null,
                NombreCuentaBancaria: req.body.NombreCuentaBancaria || null,
                Estado: req.body.Estado !== undefined ? req.body.Estado : 1
            };

            // Call the model to create the Empresa
            await Empresa.create(data);
            req.flash('success', 'Empresa registrada correctamente');
            res.redirect('/empresa');
        } catch (error) {
            console.error(error);
            req.flash('error', 'Error al registrar la empresa');
            res.redirect('/empresa/crear');
        }
    },
    editarForm: async (req, res) => {
        try {
            const empresa = await Empresa.getById(req.params.id);
            const user = req.session && req.session.usuario ? req.session.usuario : null;
            if (!empresa) {
                req.flash('error', 'Empresa no encontrada');
                return res.redirect('/empresa');
            }
            res.render('empresa/edit', {
                title: 'Editar Empresa',
                empresa,
                user: user,
                messages: req.flash()
            });
        } catch (error) {
            console.error(error);
            req.flash('error', 'Error al cargar el formulario de edición');
            res.redirect('/empresa');
        }
    },
    editar: async (req, res) => {
        try {
            // Preparar datos para actualizar - solo incluir campos que vienen del formulario
            const data = {};
            
            // Solo incluir campos que están presentes en el request
            if (req.body.Nombre !== undefined) data.Nombre = req.body.Nombre;
            if (req.body.RUC !== undefined) data.RUC = req.body.RUC;
            if (req.body.Direccion !== undefined) data.Direccion = req.body.Direccion;
            if (req.body.Telefono !== undefined) data.Telefono = req.body.Telefono;
            if (req.body.Celular !== undefined) data.Celular = req.body.Celular;
            if (req.body.Email !== undefined) data.Email = req.body.Email;
            if (req.body.TextoPresentacion !== undefined) data.TextoPresentacion = req.body.TextoPresentacion;
            if (req.body.CuentaBancaria !== undefined) data.CuentaBancaria = req.body.CuentaBancaria;
            if (req.body.NombreCuentaBancaria !== undefined) data.NombreCuentaBancaria = req.body.NombreCuentaBancaria;
            if (req.body.Estado !== undefined) data.Estado = req.body.Estado;

            // Solo incluir el logo si se subió un archivo nuevo
            if (req.file && req.file.fieldname === 'Logo') {
                data.Logo = req.file.buffer;
            }

            await Empresa.update(req.params.id, data);
            req.flash('success', 'Empresa actualizada correctamente');
            res.redirect('/empresa');
        } catch (error) {
            console.error(error);
            req.flash('error', 'Error al actualizar la empresa');
            res.redirect(`/empresa/editar/${req.params.id}`);
        }
    },
    eliminar: async (req, res) => {
        try {
            await Empresa.delete(req.params.id);
            req.flash('success', 'Empresa eliminada correctamente');
        } catch (error) {
            console.error(error);
            req.flash('error', 'Error al eliminar la empresa');
        }
        res.redirect('/empresa');
    },
    mostrarLogo: async (req, res) => {
        try {
            const empresa = await Empresa.getById(req.params.id);
            if (!empresa || !empresa.Logo) {
                // Puedes servir una imagen por defecto si no hay logo
                return res.status(404).send('No logo');
            }
            // Detectar tipo mime (por defecto jpeg)
            let mimeType = 'image/jpeg';
            // Si tienes el tipo guardado, puedes usarlo aquí
            res.set('Content-Type', mimeType);
            res.send(empresa.Logo);
        } catch (error) {
            res.status(500).send('Error al cargar el logo');
        }
    }
};

// Exportar el controlador y el middleware de multer
module.exports = {
    ...empresaController,
    uploadMiddleware: upload.single('Logo')
};
