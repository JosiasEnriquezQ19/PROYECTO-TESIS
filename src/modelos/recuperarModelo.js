const db = require('../bd/conexion');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

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
        const claveHasheada = await bcrypt.hash(nuevaClave, SALT_ROUNDS);
        const [result] = await db.query(
            'UPDATE USUARIO SET Clave = ? WHERE IdUsuario = ?',
            [claveHasheada, usuarioId]
        );
        return result.affectedRows;
    } catch (error) {
        throw error;
    }
};