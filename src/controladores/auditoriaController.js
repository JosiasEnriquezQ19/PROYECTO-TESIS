const Auditoria = require('../modelos/Auditoria');

exports.mostrarAuditoria = async (req, res) => {
    try {
        const pagina   = parseInt(req.query.pagina)   || 1;
        const modulo   = req.query.modulo  || '';
        const accion   = req.query.accion  || '';
        const busqueda = req.query.busqueda || '';

        const { rows, total, paginas } = await Auditoria.listar({ pagina, modulo, accion, busqueda });
        const filtros = await Auditoria.obtenerFiltros();

        res.render('auditoria/lista', {
            registros: rows,
            total,
            pagina,
            paginas,
            filtros,
            modulo,
            accion,
            busqueda,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        console.error('Error en auditoria:', error);
        res.render('auditoria/lista', {
            registros: [], total: 0, pagina: 1, paginas: 1,
            filtros: { modulos: [], acciones: [] },
            modulo: '', accion: '', busqueda: '',
            error: 'Error al cargar la bitacora.'
        });
    }
};
