const db = require('../bd/conexion');

class Empleado {
    static async contarActivos() {
        try {
            const [rows] = await db.query(`
                SELECT COUNT(*) as total
                FROM EMPLEADO
                WHERE Estado = 'ACTIVO'
            `);
            return rows[0].total;
        } catch (error) {
            throw error;
        }
    }

    static async getAll() {
        try {
            const [rows] = await db.query(`
                SELECT e.*, u.Nombres, u.Apellidos, u.Correo, u.Telefono
                FROM EMPLEADO e
                JOIN USUARIO u ON e.IdUsuario = u.IdUsuario
                ORDER BY u.Apellidos, u.Nombres
            `);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async getById(id) {
        try {
            const [rows] = await db.query(`
                SELECT e.*, u.Nombres, u.Apellidos, u.Correo, u.Telefono
                FROM EMPLEADO e
                JOIN USUARIO u ON e.IdUsuario = u.IdUsuario
                WHERE e.IdEmpleado = ?
            `, [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async create(data) {
        try {
            const [result] = await db.query(`
                INSERT INTO EMPLEADO (IdUsuario, Cargo, Area, FechaContratacion, TipoContrato, SueldoBase, Banco, NumeroCuenta, TipoCuenta, Estado)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                data.IdUsuario,
                data.Cargo,
                data.Area,
                data.FechaContratacion,
                data.TipoContrato,
                data.SueldoBase,
                data.Banco,
                data.NumeroCuenta,
                data.TipoCuenta,
                data.Estado
            ]);
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    static async update(id, data) {
        try {
            const [result] = await db.query(`
                UPDATE EMPLEADO SET Cargo = ?, Area = ?, FechaContratacion = ?, TipoContrato = ?, SueldoBase = ?, Banco = ?, NumeroCuenta = ?, TipoCuenta = ?, Estado = ?
                WHERE IdEmpleado = ?
            `, [
                data.Cargo,
                data.Area,
                data.FechaContratacion,
                data.TipoContrato,
                data.SueldoBase,
                data.Banco,
                data.NumeroCuenta,
                data.TipoCuenta,
                data.Estado,
                id
            ]);
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }

    static async delete(id) {
        try {
            const [result] = await db.query(`DELETE FROM EMPLEADO WHERE IdEmpleado = ?`, [id]);
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Empleado;