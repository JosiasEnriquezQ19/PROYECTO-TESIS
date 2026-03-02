const db = require('../bd/conexion');

// Busca usuario por correo y que esté activo
exports.buscarPorCorreo = async (correo) => {
    try {
        const [rows] = await db.query('SELECT * FROM USUARIO WHERE Correo = ?', [correo]);
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        throw error;
    }
};

// Actualiza la clave del usuario
exports.actualizarClave = async (usuarioId, nuevaClave) => {
    try {
        const [result] = await db.query(
            'UPDATE USUARIO SET Clave = ? WHERE IdUsuario = ?',
            [nuevaClave, usuarioId]
        );
        return result.affectedRows;
    } catch (error) {
        throw error;
    }
};