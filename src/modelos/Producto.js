const conexion = require('../bd/conexion');

class Producto {
    static async contarActivos() {
        const sql = 'SELECT COUNT(*) as total FROM PRODUCTO WHERE Estado = 1';
        const [resultados] = await conexion.query(sql);
        return resultados[0].total;
    }
    
    static async listarPorFiltro(campo, valor) {
        const sql = `SELECT * FROM PRODUCTO WHERE Estado = 1 AND ${campo} LIKE ?`;
        const [resultados] = await conexion.query(sql, [`%${valor}%`]);
        return resultados;
    }
    
    static async listar(terminoBusqueda = '') {
        const sql = terminoBusqueda 
            ? 'SELECT * FROM PRODUCTO WHERE Estado = 1 AND (Codigo LIKE ? OR Nombre LIKE ?)' 
            : 'SELECT * FROM PRODUCTO WHERE Estado = 1';
        const valores = terminoBusqueda ? [`%${terminoBusqueda}%`, `%${terminoBusqueda}%`] : [];
        const [resultados] = await conexion.query(sql, valores);
        return resultados;
    }

    static async crear(productoData) {
        const sql = `INSERT INTO PRODUCTO 
            (Codigo, Nombre, Descripcion, Marca, Modelo, Tipo, UnidadMedida, PrecioUnitario, Estado) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`;
        const valores = [
            productoData.Codigo,
            productoData.Nombre,
            productoData.Descripcion,
            productoData.Marca,
            productoData.Modelo,
            productoData.Tipo,
            productoData.UnidadMedida,
            productoData.PrecioUnitario
        ];
        await conexion.query(sql, valores);
    }

    static async obtenerPorId(id) {
        const sql = 'SELECT * FROM PRODUCTO WHERE IdProducto = ?';
        const [resultados] = await conexion.query(sql, [id]);
        return resultados[0];
    }

    static async actualizar(id, productoData) {
        const sql = `
            UPDATE PRODUCTO SET 
                Codigo = ?, 
                Nombre = ?, 
                Descripcion = ?, 
                Marca = ?, 
                Modelo = ?, 
                Tipo = ?, 
                UnidadMedida = ?, 
                PrecioUnitario = ?
            WHERE IdProducto = ?
        `;
        const valores = [
            productoData.Codigo,
            productoData.Nombre,
            productoData.Descripcion,
            productoData.Marca,
            productoData.Modelo,
            productoData.Tipo,
            productoData.UnidadMedida,
            productoData.PrecioUnitario,
            id
        ];
        await conexion.query(sql, valores);
    }

    static async eliminar(id) {
        const sql = 'UPDATE PRODUCTO SET Estado = 0 WHERE IdProducto = ?';
        await conexion.query(sql, [id]);
    }

    static async obtenerTiposCodigo() {
        const sql = 'SELECT DISTINCT Codigo FROM PRODUCTO WHERE Estado = 1 ORDER BY Codigo';
        const [resultados] = await conexion.query(sql);
        return resultados;
    }
    
    static async listarPorCodigo(codigoTipo = '') {
        const sql = codigoTipo 
            ? 'SELECT * FROM PRODUCTO WHERE Estado = 1 AND Codigo = ?' 
            : 'SELECT * FROM PRODUCTO WHERE Estado = 1';
        const valores = codigoTipo ? [codigoTipo] : [];
        const [resultados] = await conexion.query(sql, valores);
        return resultados;
    }
}

module.exports = Producto;
