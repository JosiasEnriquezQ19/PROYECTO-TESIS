const db = require('../bd/conexion');

class Auditoria {
    /**
     * Registrar una entrada en la bitacora de auditoria.
     * @param {object} data - { IdUsuario, NombreUsuario, Modulo, Accion, Descripcion, IP }
     */
    static async registrar(data) {
        try {
            await db.query('INSERT INTO AUDITORIA SET ?', {
                IdUsuario: data.IdUsuario || null,
                NombreUsuario: data.NombreUsuario || 'Sistema',
                Modulo: data.Modulo || 'SISTEMA',
                Accion: data.Accion || 'INFO',
                Descripcion: data.Descripcion || '',
                IP: data.IP || null,
                FechaHora: new Date()
            });
        } catch (err) {
            // No lanzar error para que nunca interrumpa el flujo de la app
            console.error('[Auditoria] Error al registrar:', err.message);
        }
    }

    /** Obtener los N registros mas recientes para el dashboard */
    static async listarRecientes(limit = 15) {
        const [rows] = await db.query(`
            SELECT IdAuditoria, NombreUsuario, Modulo, Accion, Descripcion, IP, FechaHora
            FROM AUDITORIA
            ORDER BY FechaHora DESC
            LIMIT ?
        `, [limit]);
        return rows;
    }

    /** Listado paginado con filtros para la vista de administracion */
    static async listar({ pagina = 1, limite = 50, modulo = '', accion = '', busqueda = '' } = {}) {
        const offset = (pagina - 1) * limite;
        const condiciones = [];
        const params = [];

        if (modulo) { condiciones.push('Modulo = ?'); params.push(modulo); }
        if (accion) { condiciones.push('Accion = ?'); params.push(accion); }
        if (busqueda) { condiciones.push('(NombreUsuario LIKE ? OR Descripcion LIKE ?)'); params.push(`%${busqueda}%`, `%${busqueda}%`); }

        const where = condiciones.length ? 'WHERE ' + condiciones.join(' AND ') : '';

        const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM AUDITORIA ${where}`, params);
        const [rows] = await db.query(
            `SELECT * FROM AUDITORIA ${where} ORDER BY FechaHora DESC LIMIT ${Number(limite)} OFFSET ${Number(offset)}`,
            params
        );

        return { rows, total, paginas: Math.ceil(total / limite) };
    }

    /** Modulos y acciones distintos para los filtros del UI */
    static async obtenerFiltros() {
        const [modulos] = await db.query('SELECT DISTINCT Modulo FROM AUDITORIA ORDER BY Modulo');
        const [acciones] = await db.query('SELECT DISTINCT Accion FROM AUDITORIA ORDER BY Accion');
        return {
            modulos: modulos.map(r => r.Modulo),
            acciones: acciones.map(r => r.Accion)
        };
    }
}

module.exports = Auditoria;
