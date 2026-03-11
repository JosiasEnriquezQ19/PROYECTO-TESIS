const Proforma = require('../modelos/Proforma');
const Cliente = require('../modelos/Cliente');
const Usuario = require('../modelos/Usuario');
const Empresa = require('../modelos/Empresa');
const Producto = require('../modelos/Producto');
const emailService = require('../servicios/emailService');

exports.list = async (req, res) => {
    try {
        // Antes de listar, actualizar automáticamente el estado de proformas vencidas
        await Proforma.verificarProformasVencidas();
        console.log('Obteniendo lista de proformas...');
        const proformas = await Proforma.listar();
        console.log(`Proformas obtenidas en controlador: ${proformas.length}`);
        if (proformas.length > 0) {
            console.log('Primera proforma en controlador:', {
                Codigo: proformas[0].Codigo,
                ClienteNombre: proformas[0].ClienteNombre,
                UsuarioNombre: proformas[0].UsuarioNombre,
                EmpresaNombre: proformas[0].EmpresaNombre
            });
        }
        res.render('proformas/lista', {
            title: 'Lista de Proformas',
            proformas,
            user: req.user,
            messages: req.flash()
        });
    } catch (error) {
        console.error('Error en proformaController.list:', error);
        req.flash('error', 'Error al obtener las proformas: ' + error.message);
        res.render('proformas/lista', {
            title: 'Lista de Proformas',
            proformas: [],
            user: req.user,
            messages: req.flash()
        });
    }
};

exports.createForm = async (req, res) => {
    try {
        // Obtener datos para los comboboxes
        console.log('Obteniendo datos para el formulario...');

        let clientes = [];
        let usuarios = [];
        let empresas = [];
        let productos = [];

        try {
            clientes = await Cliente.getAll();
            console.log('Clientes obtenidos:', clientes.length);
        } catch (error) {
            console.error('Error al obtener clientes:', error);
            clientes = [];
        }

        try {
            usuarios = await Usuario.getAll();
            console.log('Usuarios obtenidos:', usuarios.length);
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            usuarios = [];
        }

        try {
            empresas = await Empresa.getAll();
            console.log('Empresas obtenidas:', empresas.length);
        } catch (error) {
            console.error('Error al obtener empresas:', error);
            empresas = [];
        }

        try {
            productos = await Producto.listar(); // Usar el método existente
            console.log('Productos obtenidos:', productos.length);
        } catch (error) {
            console.error('Error al obtener productos:', error);
            productos = [];
        }

        // Generar código consecutivo auto-sugerido
        let codigoSugerido = 'PROF-001';
        try {
            codigoSugerido = await Proforma.generarCodigo();
        } catch (e) {
            console.error('Error al generar código:', e);
        }

        res.render('proformas/crear', {
            title: 'Nueva Proforma',
            user: req.user,
            messages: req.flash(),
            clientes,
            usuarios,
            empresas,
            productos,
            codigoSugerido
        });
    } catch (error) {
        console.error('Error al cargar datos para nueva proforma:', error);
        req.flash('error', 'Error al cargar los datos del formulario');
        res.redirect('/proformas');
    }
};

exports.create = async (req, res) => {
    try {
        await Proforma.crear(req.body);
        req.flash('success', 'Proforma creada correctamente');
        res.redirect('/proformas');
    } catch (error) {
        console.error('Error en controlador create:', error);
        req.flash('error', 'Error al crear la proforma: ' + error.message);
        res.redirect('/proformas/nueva');
    }
};

exports.editForm = async (req, res) => {
    try {
        const proforma = await Proforma.obtenerPorId(req.params.id);
        if (!proforma) {
            req.flash('error', 'Proforma no encontrada');
            return res.redirect('/proformas');
        }

        // Obtener datos para los comboboxes
        console.log('Obteniendo datos para el formulario de edición...');

        let clientes = [];
        let usuarios = [];
        let empresas = [];
        let productos = [];

        try {
            clientes = await Cliente.getAll();
            console.log('Clientes obtenidos:', clientes.length);
        } catch (error) {
            console.error('Error al obtener clientes:', error);
            clientes = [];
        }

        try {
            usuarios = await Usuario.getAll();
            console.log('Usuarios obtenidos:', usuarios.length);
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            usuarios = [];
        }

        try {
            empresas = await Empresa.getAll();
            console.log('Empresas obtenidas:', empresas.length);
        } catch (error) {
            console.error('Error al obtener empresas:', error);
            empresas = [];
        }

        try {
            productos = await Producto.listar(); // Usar el método existente
            console.log('Productos obtenidos:', productos.length);
        } catch (error) {
            console.error('Error al obtener productos:', error);
            productos = [];
        }

        res.render('proformas/editar', {
            title: 'Editar Proforma',
            proforma,
            user: req.user,
            messages: req.flash(),
            clientes,
            usuarios,
            empresas,
            productos
        });
    } catch (error) {
        console.error('Error en controlador editForm:', error);
        req.flash('error', 'Error al cargar la proforma: ' + error.message);
        res.redirect('/proformas');
    }
};

exports.update = async (req, res) => {
    try {
        await Proforma.actualizar(req.params.id, req.body);
        req.flash('success', 'Proforma actualizada correctamente');
        res.redirect('/proformas');
    } catch (error) {
        console.error('Error en controlador update:', error);
        req.flash('error', 'Error al actualizar la proforma: ' + error.message);
        res.redirect(`/proformas/${req.params.id}/editar`);
    }
};

exports.delete = async (req, res) => {
    try {
        await Proforma.eliminar(req.params.id);
        req.flash('success', 'Proforma inactivada correctamente');
        res.redirect('/proformas');
    } catch (error) {
        console.error('Error en controlador delete:', error);
        req.flash('error', 'Error al inactivar la proforma: ' + error.message);
        res.redirect('/proformas');
    }
};

exports.detail = async (req, res) => {
    try {
        const id = req.params.id;
        console.log('Obteniendo detalle de proforma ID:', id);

        // Obtener la proforma con sus detalles
        const proforma = await Proforma.obtenerPorId(id);

        if (!proforma) {
            req.flash('error', 'Proforma no encontrada');
            return res.redirect('/proformas');
        }

        // Obtener información completa del cliente, usuario y empresa
        let cliente = null;
        let usuario = null;
        let empresa = null;

        try {
            if (proforma.IdCliente) {
                const clientes = await Cliente.listar();
                cliente = clientes.find(c => c.IdCliente === proforma.IdCliente);
            }
        } catch (error) {
            console.error('Error al obtener cliente:', error);
        }

        try {
            if (proforma.IdUsuario) {
                const usuarios = await Usuario.listar();
                usuario = usuarios.find(u => u.IdUsuario === proforma.IdUsuario);
            }
        } catch (error) {
            console.error('Error al obtener usuario:', error);
        }

        try {
            if (proforma.IdEmpresa) {
                const empresas = await Empresa.getAll();
                empresa = empresas.find(e => e.IdEmpresa === proforma.IdEmpresa);
            }
        } catch (error) {
            console.error('Error al obtener empresa:', error);
        }

        console.log('Datos obtenidos para detalle:', {
            proforma: proforma.Codigo,
            cliente: cliente ? cliente.RazonSocial : 'No encontrado',
            usuario: usuario ? `${usuario.Nombres} ${usuario.Apellidos}` : 'No encontrado',
            empresa: empresa ? empresa.Nombre : 'No encontrada',
            productos: proforma.detalle ? proforma.detalle.length : 0
        });

        res.render('proformas/detalle', {
            title: `Detalle Proforma ${proforma.Codigo}`,
            proforma,
            factura: proforma, // Para compatibilidad con la vista
            cliente,
            usuario,
            empresa,
            productos: proforma.detalle || [],
            user: req.user,
            messages: req.flash()
        });

    } catch (error) {
        console.error('Error en proformaController.detail:', error);
        req.flash('error', 'Error al obtener el detalle de la proforma: ' + error.message);
        res.redirect('/proformas');
    }
};

// Aprobar proforma
exports.aprobar = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        // Validar estado
        const estadosPermitidos = ['APROBADA', 'RECHAZADA', 'PENDIENTE'];
        if (!estadosPermitidos.includes(estado)) {
            return res.status(400).json({
                success: false,
                message: 'Estado no válido'
            });
        }

        // Obtener proforma actual
        const proformaActual = await Proforma.obtenerPorId(id);
        if (!proformaActual) {
            return res.status(404).json({
                success: false,
                message: 'Proforma no encontrada'
            });
        }

        // Preparar datos para actualizar solo el estado
        const datosActualizacion = {
            ...proformaActual.proforma,
            Estado: estado
        };

        // Actualizar proforma
        await Proforma.actualizar(id, datosActualizacion, proformaActual.productos || []);

        res.json({
            success: true,
            message: `Proforma ${estado.toLowerCase()} exitosamente`
        });

    } catch (error) {
        console.error('Error al aprobar proforma:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar estado de proforma',
            error: error.message
        });
    }
};

// Enviar proforma por correo
exports.enviarEmail = async (req, res) => {
    try {
        const idProforma = req.params.id;
        console.log(`Iniciando envío de correo para proforma ${idProforma}`);

        // 1. Obtener datos de la proforma
        const proformaData = await Proforma.obtenerPorId(idProforma);

        if (!proformaData || !proformaData.proforma) {
            return res.status(404).json({
                success: false,
                message: 'Proforma no encontrada'
            });
        }

        // El id es `IdProforma` o de forma similar devuelto en la propiedad proforma
        const proformaObj = { IdProforma: proformaData.proforma.IdProforma || idProforma, ...proformaData.proforma };
        const detalles = proformaData.detalles || [];

        // 2. Obtener datos del cliente
        let clienteObj = { Nombre: proformaObj.ClienteNombre || 'Cliente' };
        if (proformaObj.IdCliente) {
            const clientes = await Cliente.listar();
            const clienteFila = clientes.find(c => c.IdCliente === proformaObj.IdCliente);
            if (clienteFila) {
                clienteObj = clienteFila;
            }
        }

        // Validación crítica: El cliente DEBE tener correo electrónico
        if (!clienteObj.Email && !proformaObj.ClienteEmail) {
            return res.status(400).json({
                success: false,
                message: 'El cliente no tiene un correo electrónico registrado.'
            });
        }

        // 3. Obtener datos de la empresa
        let empresaObj = {
            Nombre: 'Nuestra Empresa',
            Email: 'contacto@nuestraempresa.com',
            Telefono: '---'
        };

        if (proformaObj.IdEmpresa) {
            try {
                const empresas = await Empresa.getAll();
                const empresaFila = empresas.find(e => e.IdEmpresa == proformaObj.IdEmpresa);
                if (empresaFila) {
                    empresaObj = empresaFila;
                }
            } catch (err) {
                console.warn('No se pudo obtener datos detallados de la empresa, usando formato básico', err);
                if (proformaObj.EmpresaNombre) {
                    empresaObj.Nombre = proformaObj.EmpresaNombre;
                }
            }
        }

        // 4. Enviar el correo usando el servicio
        console.log(`Enviando proforma ${proformaObj.Codigo} al correo ${clienteObj.Email || proformaObj.ClienteEmail}`);

        const resultadoEnvio = await emailService.enviarProforma(
            proformaObj,
            detalles,
            clienteObj,
            empresaObj
        );

        if (resultadoEnvio.exito) {
            res.json({
                success: true,
                message: 'Proforma enviada exitosamente por correo electrónico'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'No se pudo enviar el correo',
                error: resultadoEnvio.error || 'Error desconocido'
            });
        }

    } catch (error) {
        console.error('Error crítico al enviar proforma por correo:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al procesar el envío de correo',
            error: error.message
        });
    }
};
