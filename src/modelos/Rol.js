const db = require('../bd/conexion');

class Rol {
    static async getAll() {
        const [rows] = await db.query('SELECT * FROM ROL');
        return rows;
    }

    static async getById(id) {
        const [rows] = await db.query('SELECT * FROM ROL WHERE IdRol = ?', [id]);
        return rows[0];
    }

    static async create(data) {
    // Aceptar tanto 'Descripcion' como 'descripcion' desde el formulario
    const Descripcion = data.Descripcion || data.descripcion || null;
    const [result] = await db.query('INSERT INTO ROL (Descripcion) VALUES (?)', [Descripcion]);
        return result.insertId;
    }

    static async update(id, data) {
    const Descripcion = data.Descripcion || data.descripcion || null;
    const [result] = await db.query('UPDATE ROL SET Descripcion = ? WHERE IdRol = ?', [Descripcion, id]);
        return result.affectedRows;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM ROL WHERE IdRol = ?', [id]);
        return result.affectedRows;
    }
}

module.exports = Rol;