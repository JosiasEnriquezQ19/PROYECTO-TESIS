const Factura = require('../modelos/Factura');
const Cliente = require('../modelos/Cliente');
const Producto = require('../modelos/Producto');
const Empresa = require('../modelos/Empresa');
const Proforma = require('../modelos/Proforma');
const Usuario = require('../modelos/Usuario');

class FacturaController {
    constructor() {
        this.facturaModel = new Factura();
    }

    // Listar facturas
    async listar(req, res) {
        try {
            const facturas = await this.facturaModel.listar();
            res.render('facturas/lista', {
                title: 'Gestión de Facturas',
                facturas: facturas,
                user: req.session.usuario,
                error: null,
                success: null
            });
        } catch (error) {
            console.error('Error al listar facturas:', error);
            res.render('facturas/lista', {
                title: 'Gestión de Facturas',
                facturas: [],
                user: req.session.usuario,
                error: 'Error al cargar las facturas: ' + error.message,
                success: null
            });
        }
    }

    // Mostrar formulario de creación
    async mostrarCrear(req, res) {
        try {
            const [clientes, productos, empresas, proformas] = await Promise.all([
                Cliente.listar(),
                Producto.listar(),
                Empresa.getAll(),
                Proforma.listar()
            ]);

            res.render('facturas/crear', {
                title: 'Nueva Factura',
                clientes: clientes,
                productos: productos,
                empresas: empresas,
                proformas: proformas,
                user: req.session.usuario,
                error: null,
                success: null
            });
        } catch (error) {
            console.error('Error al mostrar formulario de creación:', error);
            res.render('facturas/crear', {
                title: 'Nueva Factura',
                clientes: [],
                productos: [],
                empresas: [],
                proformas: [],
                user: req.session.usuario,
                error: 'Error al cargar el formulario: ' + error.message,
                success: null
            });
        }
    }

    // Crear nueva factura
    async crear(req, res) {
        try {
            // Validar que existe la sesión del usuario
            if (!req.session || !req.session.usuario || !req.session.usuario.IdUsuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Sesión expirada. Por favor, inicie sesión nuevamente.'
                });
            }

            const { 
                IdProforma, IdCliente, IdEmpresa, FechaEmision, FechaVencimiento,
                FormaPago, Observaciones, productos 
            } = req.body;

            // Validaciones básicas
            if (!IdCliente || !IdEmpresa || !FechaEmision || !productos || productos.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos requeridos faltantes'
                });
            }

            // Procesar productos y calcular totales
            let subTotal = 0;
            const detallesFactura = [];

            for (const prod of productos) {
                const cantidad = parseFloat(prod.cantidad);
                const precio = parseFloat(prod.precio);
                const total = cantidad * precio;
                
                subTotal += total;
                
                detallesFactura.push({
                    IdProducto: prod.idProducto,
                    Cantidad: cantidad,
                    UnidadMedida: prod.unidadMedida || 'UNID',
                    PrecioUnitario: precio,
                    Total: total,
                    DescripcionAdicional: prod.descripcionAdicional || null
                });
            }

            const igv = subTotal * 0.18;
            const totalFinal = subTotal + igv;

            const datosFactura = {
                IdProforma: IdProforma || null,
                IdUsuario: req.session.usuario.IdUsuario,
                IdCliente: parseInt(IdCliente),
                IdEmpresa: parseInt(IdEmpresa),
                FechaEmision: FechaEmision,
                FechaVencimiento: FechaVencimiento || null,
                SubTotal: subTotal,
                TotalIGV: igv,
                Total: totalFinal,
                Estado: 'PENDIENTE',
                FormaPago: FormaPago || null,
                Observaciones: Observaciones || null
            };

            const idFactura = await this.facturaModel.crear(datosFactura, detallesFactura);

            if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
                res.json({
                    success: true,
                    message: 'Factura creada exitosamente',
                    idFactura: idFactura
                });
            } else {
                res.redirect(`/facturas/${idFactura}`);
            }

        } catch (error) {
            console.error('Error al crear factura:', error);
            
            if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
                res.status(500).json({
                    success: false,
                    message: 'Error al crear la factura',
                    error: error.message
                });
            } else {
                res.redirect('/facturas');
            }
        }
    }

    // Ver detalle de factura
    async ver(req, res) {
        try {
            const idFactura = req.params.id;
            const resultado = await this.facturaModel.obtenerPorId(idFactura);

            if (!resultado) {
                return res.redirect('/facturas');
            }

            const { factura, detalles } = resultado;

            // Obtener datos adicionales
            const [cliente, usuario, empresa] = await Promise.all([
                Cliente.obtenerPorId(factura.IdCliente),
                factura.IdUsuario ? { Nombres: factura.UsuarioNombre, Apellidos: factura.UsuarioApellido } : null,
                Empresa.getById(factura.IdEmpresa)
            ]);

            // Asegurar que siempre se pasa un objeto para evitar errores en EJS
            const safeCliente = cliente || { RazonSocial: '', Contacto: '', Direccion: '', Email: '', Documento: '' };
            const safeUsuario = usuario || { Nombres: '', Apellidos: '' };
            const safeEmpresa = empresa || { RUC: '', Direccion: '', Telefono: '', CuentaBancaria: '', NombreCuentaBancaria: '' };

            // Asegúrate de que los detalles siempre sean un array y tengan la estructura correcta
            const safeDetalles = Array.isArray(detalles) ? detalles : [];

            res.render('facturas/detalle', {
                title: `Factura ${factura.Codigo}`,
                factura: factura,
                productos: safeDetalles,
                cliente: safeCliente,
                usuario: safeUsuario,
                empresa: safeEmpresa,
                user: req.session.usuario
            });
            return;

        } catch (error) {
            console.error('Error al ver factura:', error);
            res.redirect('/facturas');
        }
    }

    // Mostrar formulario de edición
    async mostrarEditar(req, res) {
        try {
            const idFactura = req.params.id;
            const resultado = await this.facturaModel.obtenerPorId(idFactura);

            if (!resultado) {
                return res.redirect('/facturas');
            }

            const { factura, detalles } = resultado;

            const [clientes, productos, empresas, proformas, usuarios] = await Promise.all([
                Cliente.listar(),
                Producto.listar(),
                Empresa.getAll(),
                Proforma.listar(),
                Usuario.listar()
            ]);

            res.render('facturas/editar', {
                title: `Editar Factura ${factura.Codigo}`,
                factura: factura,
                detalles: detalles,
                clientes: clientes,
                productos: productos,
                empresas: empresas,
                proformas: proformas,
                usuarios: usuarios,
                user: req.session.usuario
            });

        } catch (error) {
            console.error('Error al mostrar formulario de edición:', error);
            res.redirect('/facturas');
        }
    }

    // Actualizar factura
    async actualizar(req, res) {
        let idFactura = null;
        try {
            idFactura = req.params.id;
            const { 
                IdProforma, IdCliente, FechaEmision, FechaVencimiento,
                FormaPago, Observaciones, Estado,
                productosModificados, productosEliminados, nuevosProductos
            } = req.body;

            // Debug: Verificar que se está recibiendo IdProforma
            console.log('===== DEBUG ACTUALIZAR FACTURA =====');
            console.log('IdFactura:', idFactura);
            console.log('IdProforma recibido:', IdProforma);
            console.log('Tipo de IdProforma:', typeof IdProforma);
            console.log('===================================');

            // Validaciones básicas
            if (!IdCliente || !FechaEmision) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos requeridos faltantes'
                });
            }

            // Obtener factura existente para verificar
            const facturaExistente = await this.facturaModel.obtenerPorId(idFactura);
            if (!facturaExistente) {
                throw new Error('Factura no encontrada');
            }

            // Procesar productos modificados
            if (productosModificados && Array.isArray(productosModificados)) {
                for (const prodMod of productosModificados) {
                    await this.facturaModel.actualizarDetalleFactura(
                        prodMod.IdDetalleFactura,
                        {
                            Cantidad: parseFloat(prodMod.Cantidad),
                            PrecioUnitario: parseFloat(prodMod.PrecioUnitario),
                            Total: parseFloat(prodMod.Cantidad) * parseFloat(prodMod.PrecioUnitario)
                        }
                    );
                }
            }

            // Procesar productos eliminados
            if (productosEliminados && Array.isArray(productosEliminados)) {
                for (const detalleId of productosEliminados) {
                    await this.facturaModel.eliminarDetalleFactura(detalleId);
                }
            }

            // Procesar nuevos productos adicionales
            if (nuevosProductos && Array.isArray(nuevosProductos)) {
                for (const nuevoProd of nuevosProductos) {
                    const cantidad = parseFloat(nuevoProd.Cantidad);
                    const precio = parseFloat(nuevoProd.PrecioUnitario);
                    const total = cantidad * precio;

                    await this.facturaModel.agregarDetalleFactura(idFactura, {
                        IdProducto: parseInt(nuevoProd.IdProducto),
                        Cantidad: cantidad,
                        UnidadMedida: 'UNID', // Por defecto, se puede obtener del producto
                        PrecioUnitario: precio,
                        Total: total,
                        DescripcionAdicional: nuevoProd.DescripcionAdicional || null,
                        TipoDetalle: 'ADICIONAL',
                        IdDetalleProforma: null
                    });
                }
            }

            // Recalcular totales de la factura
            const detallesActualizados = await this.facturaModel.obtenerDetallesPorFactura(idFactura);
            let subTotal = 0;
            
            for (const detalle of detallesActualizados) {
                subTotal += parseFloat(detalle.Total);
            }

            const igv = subTotal * 0.18;
            const totalFinal = subTotal + igv;

            // Actualizar datos principales de la factura
            const datosFactura = {
                IdProforma: IdProforma || null,
                IdCliente: parseInt(IdCliente),
                FechaEmision: FechaEmision,
                FechaVencimiento: FechaVencimiento || null,
                SubTotal: subTotal,
                TotalIGV: igv,
                Total: totalFinal,
                Estado: Estado || 'PENDIENTE',
                FormaPago: FormaPago || null,
                Observaciones: Observaciones || null
            };

            // Debug: Verificar datos que se van a actualizar
            console.log('===== DATOS A ACTUALIZAR =====');
            console.log('datosFactura.IdProforma:', datosFactura.IdProforma);
            console.log('datosFactura completo:', datosFactura);
            console.log('===============================');

            await this.facturaModel.actualizarSoloFactura(idFactura, datosFactura);

            if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
                res.json({
                    success: true,
                    message: 'Factura actualizada exitosamente'
                });
            } else {
                req.session.success = 'Factura actualizada exitosamente';
                res.redirect('/facturas/' + idFactura);
            }

        } catch (error) {
            console.error('Error al actualizar factura:', error);
            
            if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
                res.status(500).json({
                    success: false,
                    message: 'Error al actualizar la factura',
                    error: error.message
                });
            } else {
                req.session.error = 'Error al actualizar la factura: ' + error.message;
                res.redirect('/facturas/' + idFactura + '/editar');
            }
        }
    }

    // Eliminar factura
    async eliminar(req, res) {
        try {
            const idFactura = req.params.id;
            
            // Verificar si la factura puede ser eliminada
            const verificacion = await this.facturaModel.puedeEliminar(idFactura);
            
            if (!verificacion.facturaExiste) {
                if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
                    return res.status(404).json({
                        success: false,
                        message: 'Factura no encontrada'
                    });
                } else {
                    return res.redirect('/facturas?error=' + encodeURIComponent('Factura no encontrada'));
                }
            }
            
            if (!verificacion.puedeEliminar) {
                if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
                    return res.status(400).json({
                        success: false,
                        message: `No se puede eliminar la factura: ${verificacion.razon}`
                    });
                } else {
                    return res.redirect('/facturas?error=' + encodeURIComponent(verificacion.razon));
                }
            }
            
            // Log para información
            console.log(`Eliminando factura ${idFactura}:`, verificacion);
            
            await this.facturaModel.eliminar(idFactura);

            const mensaje = verificacion.tieneVentas || verificacion.tieneContratos ? 
                `Factura eliminada exitosamente. ${verificacion.razon}` : 
                'Factura eliminada exitosamente';

            if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
                res.json({
                    success: true,
                    message: mensaje,
                    detalles: verificacion
                });
            } else {
                res.redirect('/facturas?success=' + encodeURIComponent(mensaje));
            }

        } catch (error) {
            console.error('Error al eliminar factura:', error);
            
            let errorMessage = 'Error al eliminar la factura';
            
            // Manejar errores específicos de MySQL/base de datos
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                errorMessage = 'No se puede eliminar la factura porque tiene registros relacionados';
            } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                errorMessage = 'Error de integridad referencial en la base de datos';
            } else if (error.message) {
                errorMessage = `Error al eliminar la factura: ${error.message}`;
            }
            
            if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
                res.status(500).json({
                    success: false,
                    message: errorMessage,
                    error: error.message,
                    code: error.code
                });
            } else {
                res.redirect('/facturas?error=' + encodeURIComponent(errorMessage));
            }
        }
    }

    // Crear factura desde proforma
    async crearDesdeProforma(req, res) {
        try {
            // Validar que existe la sesión del usuario
            if (!req.session || !req.session.usuario || !req.session.usuario.IdUsuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Sesión expirada. Por favor, inicie sesión nuevamente.'
                });
            }

            const idProforma = req.params.idProforma;
            const idUsuario = req.session.usuario.IdUsuario;

            // Primero verificar que la proforma existe y está aprobada
            const proformaData = await Proforma.obtenerPorId(idProforma);
            
            if (!proformaData) {
                return res.status(404).json({
                    success: false,
                    message: 'Proforma no encontrada'
                });
            }

            const { proforma } = proformaData;
            
            // Verificar que la proforma esté aprobada
            if (proforma.Estado !== 'APROBADA') {
                return res.status(400).json({
                    success: false,
                    message: `No se puede generar factura. La proforma debe estar en estado APROBADA. Estado actual: ${proforma.Estado}`
                });
            }

            // Verificar que no exista ya una factura para esta proforma
            const facturaExistente = await this.facturaModel.obtenerPorProforma(idProforma);
            if (facturaExistente) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe una factura generada para esta proforma',
                    facturaExistente: facturaExistente
                });
            }

            const idFactura = await this.facturaModel.crearDesdeProforma(idProforma, idUsuario);

            if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
                res.json({
                    success: true,
                    message: 'Factura creada desde proforma exitosamente',
                    idFactura: idFactura
                });
            } else {
                res.redirect(`/facturas/${idFactura}`);
            }

        } catch (error) {
            console.error('Error al crear factura desde proforma:', error);
            
            if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
                res.status(500).json({
                    success: false,
                    message: 'Error al crear factura desde proforma',
                    error: error.message
                });
            } else {
                res.redirect('/facturas');
            }
        }
    }

    // Crear factura desde proforma usando datos del formulario
    async crearDesdeProformaFormulario(req, res) {
        try {
            // Validar que existe la sesión del usuario
            if (!req.session || !req.session.usuario || !req.session.usuario.IdUsuario) {
                return res.render('facturas/crear', {
                    title: 'Nueva Factura',
                    clientes: [],
                    productos: [],
                    empresas: [],
                    proformas: [],
                    user: null,
                    error: 'Sesión expirada. Por favor, inicie sesión nuevamente.',
                    success: null
                });
            }

            const idProforma = req.body.IdProforma;
            const idUsuario = req.session.usuario.IdUsuario;
            const { FechaVencimiento, FormaPago, Observaciones, productosAdicionales } = req.body;

            if (!idProforma) {
                const [clientes, productos, empresas, proformas] = await Promise.all([
                    Cliente.listar(),
                    Producto.listar(),
                    Empresa.getAll(),
                    Proforma.listar()
                ]);

                return res.render('facturas/crear', {
                    title: 'Nueva Factura',
                    clientes: clientes,
                    productos: productos,
                    empresas: empresas,
                    proformas: proformas,
                    user: req.session.usuario,
                    error: 'Debe seleccionar una proforma válida',
                    success: null
                });
            }

            // Verificar que la proforma existe y está aprobada
            const proformaData = await Proforma.obtenerPorId(idProforma);
            
            if (!proformaData) {
                const [clientes, productos, empresas, proformas] = await Promise.all([
                    Cliente.listar(),
                    Producto.listar(),
                    Empresa.getAll(),
                    Proforma.listar()
                ]);

                return res.render('facturas/crear', {
                    title: 'Nueva Factura',
                    clientes: clientes,
                    productos: productos,
                    empresas: empresas,
                    proformas: proformas,
                    user: req.session.usuario,
                    error: 'Proforma no encontrada',
                    success: null
                });
            }

            // Verificar que la proforma esté aprobada
            if (proformaData.Estado !== 'APROBADA') {
                const [clientes, productos, empresas, proformas] = await Promise.all([
                    Cliente.listar(),
                    Producto.listar(),
                    Empresa.getAll(),
                    Proforma.listar()
                ]);

                return res.render('facturas/crear', {
                    title: 'Nueva Factura',
                    clientes: clientes,
                    productos: productos,
                    empresas: empresas,
                    proformas: proformas,
                    user: req.session.usuario,
                    error: `No se puede generar factura. La proforma debe estar en estado APROBADA. Estado actual: ${proformaData.Estado}`,
                    success: null
                });
            }
            
            // Verificar que no exista ya una factura para esta proforma
            const facturaExistente = await this.facturaModel.obtenerPorProforma(idProforma);
            if (facturaExistente) {
                const [clientes, productos, empresas, proformas] = await Promise.all([
                    Cliente.listar(),
                    Producto.listar(),
                    Empresa.getAll(),
                    Proforma.listar()
                ]);

                return res.render('facturas/crear', {
                    title: 'Nueva Factura',
                    clientes: clientes,
                    productos: productos,
                    empresas: empresas,
                    proformas: proformas,
                    user: req.session.usuario,
                    error: 'Ya existe una factura generada para esta proforma',
                    success: null
                });
            }

            // Procesar productos de la proforma original
            let detallesFactura = [];
            let subtotalOriginal = 0;
            
            if (proformaData.detalle && Array.isArray(proformaData.detalle)) {
                detallesFactura = proformaData.detalle.map(detalle => {
                    const detalleFactura = {
                        IdProducto: detalle.IdProducto,
                        Cantidad: detalle.Cantidad,
                        UnidadMedida: detalle.UnidadMedida || 'UNID',
                        PrecioUnitario: detalle.PrecioUnitario,
                        Total: detalle.Total || (detalle.Cantidad * detalle.PrecioUnitario),
                        DescripcionAdicional: detalle.DescripcionAdicional || null,
                        IdDetalleProforma: detalle.IdDetalleProforma,
                        TipoDetalle: 'ORIGINAL'
                    };
                    
                    subtotalOriginal += parseFloat(detalleFactura.Total);
                    return detalleFactura;
                });
            }

            // Procesar productos adicionales
            let subtotalAdicionales = 0;
            if (productosAdicionales && Array.isArray(productosAdicionales)) {
                for (const productoAdicional of productosAdicionales) {
                    if (productoAdicional.IdProducto && productoAdicional.Cantidad > 0) {
                        const totalProducto = parseFloat(productoAdicional.Cantidad) * parseFloat(productoAdicional.PrecioUnitario);
                        
                        detallesFactura.push({
                            IdProducto: parseInt(productoAdicional.IdProducto),
                            Cantidad: parseFloat(productoAdicional.Cantidad),
                            UnidadMedida: 'UNID', // Se obtiene del producto en el modelo
                            PrecioUnitario: parseFloat(productoAdicional.PrecioUnitario),
                            Total: totalProducto,
                            DescripcionAdicional: productoAdicional.DescripcionAdicional || null,
                            IdDetalleProforma: null,
                            TipoDetalle: 'ADICIONAL'
                        });
                        
                        subtotalAdicionales += totalProducto;
                    }
                }
            }

            // Calcular totales finales
            const subtotalFinal = subtotalOriginal + subtotalAdicionales;
            const igvFinal = subtotalFinal * 0.18;
            const totalFinal = subtotalFinal + igvFinal;

            // Crear la factura con totales actualizados
            const facturaData = {
                IdProforma: idProforma,
                IdCliente: proformaData.IdCliente,
                IdEmpresa: proformaData.IdEmpresa,
                IdUsuario: idUsuario,
                FechaEmision: new Date().toISOString().split('T')[0],
                FechaVencimiento: FechaVencimiento || null,
                SubTotal: subtotalFinal,
                TotalIGV: igvFinal,
                Total: totalFinal,
                Estado: 'PENDIENTE',
                FormaPago: FormaPago || proformaData.FormaPago || null,
                Observaciones: Observaciones || null
            };

            const nuevaFacturaId = await this.facturaModel.crear(facturaData, detallesFactura);

            res.redirect(`/facturas/${nuevaFacturaId}?success=${encodeURIComponent('Factura creada exitosamente con productos adicionales')}`);

        } catch (error) {
            console.error('Error al crear factura desde proforma:', error);
            
            // Obtener datos para el formulario en caso de error
            try {
                const [clientes, productos, empresas, proformas] = await Promise.all([
                    Cliente.listar(),
                    Producto.listar(),
                    Empresa.getAll(),
                    Proforma.listar()
                ]);

                res.render('facturas/crear', {
                    title: 'Nueva Factura',
                    clientes: clientes,
                    productos: productos,
                    empresas: empresas,
                    proformas: proformas,
                    user: req.session && req.session.usuario ? req.session.usuario : null,
                    error: 'Error al crear la factura: ' + error.message,
                    success: null
                });
            } catch (errorSecundario) {
                console.error('Error al obtener datos para el formulario:', errorSecundario);
                res.render('facturas/crear', {
                    title: 'Nueva Factura',
                    clientes: [],
                    productos: [],
                    empresas: [],
                    proformas: [],
                    user: req.session && req.session.usuario ? req.session.usuario : null,
                    error: 'Error al crear la factura: ' + error.message,
                    success: null
                });
            }
        }
    }

    // Buscar facturas (API)
    async buscar(req, res) {
        try {
            const termino = req.query.q || '';
            const facturas = await this.facturaModel.buscar(termino);
            
            res.json({
                success: true,
                data: facturas
            });

        } catch (error) {
            console.error('Error al buscar facturas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al buscar facturas',
                error: error.message
            });
        }
    }

    // Obtener datos para API (para gráficos, etc.)
    async obtenerDatosAPI(req, res) {
        try {
            const estadisticas = await this.facturaModel.obtenerEstadisticas();
            
            res.json({
                success: true,
                data: estadisticas
            });

        } catch (error) {
            console.error('Error al obtener datos de API:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener datos',
                error: error.message
            });
        }
    }

    // Cambiar estado de factura
    async cambiarEstado(req, res) {
        try {
            const idFactura = req.params.id;
            const { estado } = req.body;

            // Validar estado
            const estadosPermitidos = ['PENDIENTE', 'PAGADA', 'VENCIDA', 'ANULADA'];
            if (!estadosPermitidos.includes(estado)) {
                return res.status(400).json({
                    success: false,
                    message: 'Estado no válido'
                });
            }

            // Obtener factura actual
            const resultado = await this.facturaModel.obtenerPorId(idFactura);
            if (!resultado) {
                return res.status(404).json({
                    success: false,
                    message: 'Factura no encontrada'
                });
            }

            const { factura } = resultado;

            // Actualizar solo el estado
            const datosActualizacion = {
                IdProforma: factura.IdProforma,
                IdCliente: factura.IdCliente,
                FechaEmision: factura.FechaEmision,
                FechaVencimiento: factura.FechaVencimiento,
                SubTotal: factura.SubTotal,
                TotalIGV: factura.TotalIGV,
                Total: factura.Total,
                Estado: estado,
                FormaPago: factura.FormaPago,
                Observaciones: factura.Observaciones
            };

            await this.facturaModel.actualizarSoloFactura(idFactura, datosActualizacion);

            res.json({
                success: true,
                message: 'Estado actualizado exitosamente'
            });

        } catch (error) {
            console.error('Error al cambiar estado:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cambiar estado',
                error: error.message
            });
        }
    }

    // Buscar proforma por código para el AJAX
    async buscarProformaPorCodigo(req, res) {
        try {
            const codigo = req.params.codigo;

            const resultado = await Proforma.obtenerPorCodigo(codigo);
            
            if (!resultado) {
                return res.json({
                    success: false,
                    message: 'Proforma no encontrada o no está aprobada'
                });
            }

            const { proforma, detalles } = resultado;

            // Verificar que no exista ya una factura para esta proforma
            const facturaExistente = await this.facturaModel.obtenerPorProforma(proforma.IdProforma);
            if (facturaExistente) {
                return res.json({
                    success: false,
                    message: 'Ya existe una factura generada para esta proforma'
                });
            }

            // Calcular totales
            let subtotal = 0;
            detalles.forEach(item => {
                // Usar el Total que ya viene calculado de la base de datos
                subtotal += parseFloat(item.Total || 0);
            });

            const igv = subtotal * 0.18;
            const total = subtotal + igv;

            res.json({
                success: true,
                data: {
                    proforma: {
                        IdProforma: proforma.IdProforma,
                        Codigo: proforma.Codigo,
                        IdCliente: proforma.IdCliente,
                        ClienteNombre: proforma.ClienteNombre,
                        IdEmpresa: proforma.IdEmpresa,
                        EmpresaNombre: proforma.EmpresaNombre,
                        FechaVencimiento: proforma.FechaVencimiento,
                        Observaciones: proforma.Observaciones
                    },
                    detalles: detalles.map(item => ({
                        IdProducto: item.IdProducto,
                        CodigoProducto: item.CodigoProducto,
                        ProductoNombre: item.ProductoNombre,
                        Cantidad: item.Cantidad,
                        UnidadMedida: item.UnidadMedida,
                        PrecioUnitario: item.PrecioUnitario,
                        Subtotal: item.Total, // Ya viene calculado de la base de datos
                        DescripcionAdicional: item.DescripcionAdicional
                    })),
                    totales: {
                        subtotal: subtotal,
                        igv: igv,
                        total: total
                    }
                }
            });

        } catch (error) {
            console.error('Error al buscar proforma por código:', error);
            res.json({
                success: false,
                message: 'Error interno del servidor: ' + error.message
            });
        }
    }

    // NUEVO MÉTODO: Agregar producto adicional
    async agregarProducto(req, res) {
        try {
            const idFactura = req.params.id;
            const { IdProducto, Cantidad, PrecioUnitario, DescripcionAdicional } = req.body;

            // Validaciones
            if (!IdProducto || !Cantidad || !PrecioUnitario) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos requeridos faltantes'
                });
            }

            await this.facturaModel.agregarProductoAdicional(idFactura, {
                IdProducto,
                Cantidad: parseFloat(Cantidad),
                PrecioUnitario: parseFloat(PrecioUnitario),
                DescripcionAdicional
            });

            res.json({
                success: true,
                message: 'Producto agregado exitosamente'
            });

        } catch (error) {
            console.error('Error al agregar producto:', error);
            res.status(500).json({
                success: false,
                message: 'Error al agregar producto',
                error: error.message
            });
        }
    }

    // NUEVO MÉTODO: Eliminar producto adicional
    async eliminarProducto(req, res) {
        try {
            const { id: idFactura, idDetalle } = req.params;

            await this.facturaModel.eliminarProductoAdicional(idDetalle, idFactura);

            res.json({
                success: true,
                message: 'Producto eliminado exitosamente'
            });

        } catch (error) {
            console.error('Error al eliminar producto:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar producto',
                error: error.message
            });
        }
    }
}

module.exports = FacturaController;
