const Contrato = require('../modelos/Contrato');
const Cliente = require('../modelos/Cliente');
const Factura = require('../modelos/Factura');

class ContratoController {
    constructor() {
        this.contratoModel = new Contrato();
        this.facturaModel = new Factura();
    }

    // Listar contratos
    async listar(req, res) {
        try {
            const contratos = await this.contratoModel.listar();
            const estadisticas = await this.contratoModel.obtenerEstadisticas();
            
            res.render('contratos/lista', {
                title: 'Gestión de Contratos',
                contratos: contratos,
                estadisticas: estadisticas,
                user: req.session.usuario,
                error: req.session.error || null,
                success: req.session.success || null
            });
            
            // Limpiar mensajes de sesión
            delete req.session.error;
            delete req.session.success;
        } catch (error) {
            console.error('Error al listar contratos:', error);
            res.render('contratos/lista', {
                title: 'Gestión de Contratos',
                contratos: [],
                estadisticas: null,
                user: req.session.usuario,
                error: 'Error al cargar los contratos: ' + error.message,
                success: null
            });
        }
    }

    // Mostrar formulario de creación
    async mostrarCrear(req, res) {
        try {
            const [clientes, facturas] = await Promise.all([
                Cliente.listar(),
                this.facturaModel.listar()
            ]);

            // Filtrar solo facturas que no tengan contrato asociado o están en estados apropiados
            const facturasDisponibles = facturas.filter(f => 
                f.Estado === 'PAGADA' || f.Estado === 'PENDIENTE'
            );

            const codigoGenerado = await this.contratoModel.generarCodigo();

            res.render('contratos/crear', {
                title: 'Nuevo Contrato',
                clientes: clientes.filter(c => c.Estado === 1),
                facturas: facturasDisponibles,
                codigoGenerado: codigoGenerado,
                user: req.session.usuario,
                error: req.session.error || null,
                success: null
            });
            
            delete req.session.error;
        } catch (error) {
            console.error('Error al mostrar formulario de creación:', error);
            req.session.error = 'Error al cargar el formulario: ' + error.message;
            res.redirect('/contratos');
        }
    }

    // Crear contrato
    async crear(req, res) {
        try {
            const {
                Codigo, IdCliente, IdFactura, NumeroCuentaBanco,
                FechaInicio, FechaFin, PagoSemanal, Estado, Terminos
            } = req.body;

            // Validaciones básicas
            if (!Codigo || !IdCliente || !FechaInicio) {
                req.session.error = 'Todos los campos obligatorios deben ser completados.';
                return res.redirect('/contratos/crear');
            }

            // Verificar que no exista el código
            const existeCodigo = await this.contratoModel.existeCodigo(Codigo);
            if (existeCodigo) {
                req.session.error = 'El código de contrato ya existe. Por favor, use otro código.';
                return res.redirect('/contratos/crear');
            }

            // Validar fechas
            const fechaInicio = new Date(FechaInicio);
            if (FechaFin) {
                const fechaFin = new Date(FechaFin);
                if (fechaFin <= fechaInicio) {
                    req.session.error = 'La fecha de fin debe ser posterior a la fecha de inicio.';
                    return res.redirect('/contratos/crear');
                }
            }

            // Validar pago semanal si se proporciona
            if (PagoSemanal && (isNaN(PagoSemanal) || parseFloat(PagoSemanal) <= 0)) {
                req.session.error = 'El pago semanal debe ser un número positivo.';
                return res.redirect('/contratos/crear');
            }

            const datosContrato = {
                Codigo: Codigo.trim(),
                IdCliente: parseInt(IdCliente),
                IdFactura: IdFactura ? parseInt(IdFactura) : null,
                NumeroCuentaBanco: NumeroCuentaBanco ? NumeroCuentaBanco.trim() : null,
                FechaInicio: FechaInicio,
                FechaFin: FechaFin || null,
                PagoSemanal: PagoSemanal ? parseFloat(PagoSemanal) : null,
                Estado: Estado || 'ACTIVO',
                Terminos: Terminos ? Terminos.trim() : null
            };

            const idContrato = await this.contratoModel.crear(datosContrato);
            
            req.session.success = 'Contrato creado exitosamente.';
            res.redirect('/contratos/' + idContrato);
        } catch (error) {
            console.error('Error al crear contrato:', error);
            req.session.error = 'Error al crear el contrato: ' + error.message;
            res.redirect('/contratos/crear');
        }
    }

    // Ver detalle del contrato
    async ver(req, res) {
        try {
            const idContrato = req.params.id;
            const contrato = await this.contratoModel.obtenerPorId(idContrato);
            
            if (!contrato) {
                req.session.error = 'Contrato no encontrado.';
                return res.redirect('/contratos');
            }

            res.render('contratos/detalle', {
                title: `Contrato ${contrato.Codigo}`,
                contrato: contrato,
                user: req.session.usuario,
                error: req.session.error || null,
                success: req.session.success || null
            });
            
            delete req.session.error;
            delete req.session.success;
        } catch (error) {
            console.error('Error al ver contrato:', error);
            req.session.error = 'Error al cargar el contrato: ' + error.message;
            res.redirect('/contratos');
        }
    }

    // Mostrar formulario de edición
    async mostrarEditar(req, res) {
        try {
            const idContrato = req.params.id;
            const [contrato, clientes, facturas] = await Promise.all([
                this.contratoModel.obtenerPorId(idContrato),
                Cliente.listar(),
                this.facturaModel.listar()
            ]);
            
            if (!contrato) {
                req.session.error = 'Contrato no encontrado.';
                return res.redirect('/contratos');
            }

            // Incluir la factura actual del contrato si existe
            const facturasDisponibles = facturas.filter(f => 
                f.Estado === 'PAGADA' || f.Estado === 'PENDIENTE' || 
                (contrato.IdFactura && f.IdFactura == contrato.IdFactura)
            );

            res.render('contratos/editar', {
                title: `Editar Contrato ${contrato.Codigo}`,
                contrato: contrato,
                clientes: clientes.filter(c => c.Estado === 1),
                facturas: facturasDisponibles,
                user: req.session.usuario,
                error: req.session.error || null,
                success: null
            });
            
            delete req.session.error;
        } catch (error) {
            console.error('Error al mostrar formulario de edición:', error);
            req.session.error = 'Error al cargar el formulario: ' + error.message;
            res.redirect('/contratos');
        }
    }

    // Actualizar contrato
    async actualizar(req, res) {
        try {
            const idContrato = req.params.id;
            const {
                Codigo, IdCliente, IdFactura, NumeroCuentaBanco,
                FechaInicio, FechaFin, PagoSemanal, Estado, Terminos
            } = req.body;

            // Validaciones básicas
            if (!Codigo || !IdCliente || !FechaInicio) {
                req.session.error = 'Todos los campos obligatorios deben ser completados.';
                return res.redirect(`/contratos/${idContrato}/editar`);
            }

            // Verificar que no exista el código (excluyendo el actual)
            const existeCodigo = await this.contratoModel.existeCodigo(Codigo, idContrato);
            if (existeCodigo) {
                req.session.error = 'El código de contrato ya existe. Por favor, use otro código.';
                return res.redirect(`/contratos/${idContrato}/editar`);
            }

            // Validar fechas
            const fechaInicio = new Date(FechaInicio);
            if (FechaFin) {
                const fechaFin = new Date(FechaFin);
                if (fechaFin <= fechaInicio) {
                    req.session.error = 'La fecha de fin debe ser posterior a la fecha de inicio.';
                    return res.redirect(`/contratos/${idContrato}/editar`);
                }
            }

            // Validar pago semanal si se proporciona
            if (PagoSemanal && (isNaN(PagoSemanal) || parseFloat(PagoSemanal) <= 0)) {
                req.session.error = 'El pago semanal debe ser un número positivo.';
                return res.redirect(`/contratos/${idContrato}/editar`);
            }

            const datosContrato = {
                Codigo: Codigo.trim(),
                IdCliente: parseInt(IdCliente),
                IdFactura: IdFactura ? parseInt(IdFactura) : null,
                NumeroCuentaBanco: NumeroCuentaBanco ? NumeroCuentaBanco.trim() : null,
                FechaInicio: FechaInicio,
                FechaFin: FechaFin || null,
                PagoSemanal: PagoSemanal ? parseFloat(PagoSemanal) : null,
                Estado: Estado || 'ACTIVO',
                Terminos: Terminos ? Terminos.trim() : null
            };

            const actualizado = await this.contratoModel.actualizar(idContrato, datosContrato);
            
            if (actualizado) {
                req.session.success = 'Contrato actualizado exitosamente.';
            } else {
                req.session.error = 'No se pudo actualizar el contrato.';
            }
            
            res.redirect('/contratos/' + idContrato);
        } catch (error) {
            console.error('Error al actualizar contrato:', error);
            req.session.error = 'Error al actualizar el contrato: ' + error.message;
            res.redirect(`/contratos/${req.params.id}/editar`);
        }
    }

    // Eliminar contrato
    async eliminar(req, res) {
        try {
            const idContrato = req.params.id;
            
            // Verificar que el contrato existe
            const contrato = await this.contratoModel.obtenerPorId(idContrato);
            if (!contrato) {
                return res.status(404).json({
                    success: false,
                    message: 'Contrato no encontrado.'
                });
            }

            const eliminado = await this.contratoModel.eliminar(idContrato);
            
            if (eliminado) {
                res.json({
                    success: true,
                    message: 'Contrato eliminado exitosamente.'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'No se pudo eliminar el contrato.'
                });
            }
        } catch (error) {
            console.error('Error al eliminar contrato:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar el contrato: ' + error.message
            });
        }
    }

    // Cambiar estado del contrato
    async cambiarEstado(req, res) {
        try {
            const idContrato = req.params.id;
            const { estado } = req.body;

            const estadosValidos = ['ACTIVO', 'FINALIZADO', 'SUSPENDIDO', 'CANCELADO'];
            if (!estadosValidos.includes(estado)) {
                return res.status(400).json({
                    success: false,
                    message: 'Estado no válido.'
                });
            }

            const actualizado = await this.contratoModel.cambiarEstado(idContrato, estado);
            
            if (actualizado) {
                res.json({
                    success: true,
                    message: `Estado del contrato cambiado a ${estado}.`
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'No se pudo cambiar el estado del contrato.'
                });
            }
        } catch (error) {
            console.error('Error al cambiar estado del contrato:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cambiar el estado: ' + error.message
            });
        }
    }

    // API para obtener facturas por cliente
    async obtenerFacturasPorCliente(req, res) {
        try {
            const idCliente = req.params.idCliente;
            
            // Obtener facturas del cliente que no tengan contrato asociado
            const query = `
                SELECT 
                    f.IdFactura,
                    f.Codigo,
                    f.Total,
                    f.FechaEmision,
                    f.Estado
                FROM FACTURA f
                LEFT JOIN CONTRATO c ON f.IdFactura = c.IdFactura
                WHERE f.IdCliente = ? 
                AND c.IdFactura IS NULL
                AND f.Estado IN ('PAGADA', 'PENDIENTE')
                ORDER BY f.FechaEmision DESC
            `;
            
            const [facturas] = await this.contratoModel.conexion.execute(query, [idCliente]);
            
            res.json({
                success: true,
                facturas: facturas
            });
        } catch (error) {
            console.error('Error al obtener facturas por cliente:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener facturas.',
                facturas: []
            });
        }
    }

    // Obtener contratos activos (API)
    async obtenerActivos(req, res) {
        try {
            const contratosActivos = await this.contratoModel.obtenerActivos();
            
            res.json({
                success: true,
                contratos: contratosActivos
            });
        } catch (error) {
            console.error('Error al obtener contratos activos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener contratos activos.',
                contratos: []
            });
        }
    }
}

module.exports = ContratoController;
