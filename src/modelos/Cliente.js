const conexion = require('../bd/conexion');

class Cliente {
    static async contarActivos() {
        const sql = 'SELECT COUNT(*) as total FROM CLIENTE WHERE Estado = 1';
        const [resultados] = await conexion.query(sql);
        return resultados[0].total;
    }

    static async listar(terminoBusqueda = '') {
        const sql = terminoBusqueda 
            ? 'SELECT * FROM CLIENTE WHERE Estado = 1 AND (Documento LIKE ? OR RazonSocial LIKE ?)'
            : 'SELECT * FROM CLIENTE WHERE Estado = 1';
        const valores = terminoBusqueda ? [`%${terminoBusqueda}%`, `%${terminoBusqueda}%`] : [];
        const [resultados] = await conexion.query(sql, valores);
        return resultados;
    }

    static async crear(clienteData) {
        // Si no se ingresó celular, usar el teléfono como celular
        const celularFinal = clienteData.Celular && clienteData.Celular.trim() !== '' ? clienteData.Celular : clienteData.Telefono;
        const sql = `INSERT INTO CLIENTE 
            (Documento, RazonSocial, Direccion, Telefono, Celular, Email, Contacto) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const valores = [
            clienteData.Documento,
            clienteData.RazonSocial,
            clienteData.Direccion,
            clienteData.Telefono,
            celularFinal,
            clienteData.Email,
            clienteData.Contacto
        ];
        await conexion.query(sql, valores);
    }

    static async obtenerPorId(id) {
        const sql = 'SELECT * FROM CLIENTE WHERE IdCliente = ?';
        const [resultados] = await conexion.query(sql, [id]);
        return resultados[0];
    }

    static async actualizar(id, clienteData) {
        // Si no se ingresó celular, usar el teléfono como celular
        const celularFinal = clienteData.Celular && clienteData.Celular.trim() !== '' ? clienteData.Celular : clienteData.Telefono;
        const sql = `
            UPDATE CLIENTE SET 
                Documento = ?, 
                RazonSocial = ?, 
                Direccion = ?, 
                Telefono = ?, 
                Celular = ?, 
                Email = ?, 
                Contacto = ?
            WHERE IdCliente = ?
        `;
        const valores = [
            clienteData.Documento,
            clienteData.RazonSocial,
            clienteData.Direccion,
            clienteData.Telefono,
            celularFinal,
            clienteData.Email,
            clienteData.Contacto,
            id
        ];
        await conexion.query(sql, valores);
    }

    static async eliminar(id) {
        const sql = 'UPDATE CLIENTE SET Estado = 0 WHERE IdCliente = ?';
        await conexion.query(sql, [id]);
    }

    static async getAll() {
        const sql = 'SELECT * FROM CLIENTE WHERE Estado = 1 ORDER BY RazonSocial';
        const [resultados] = await conexion.query(sql);
        return resultados;
    }
}

module.exports = Cliente;