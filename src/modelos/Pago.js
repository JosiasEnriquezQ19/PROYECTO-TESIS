const db = require('../bd/conexion');

class Pago {
    static async create(data) {
        const sql = `INSERT INTO PAGO (IdEmpleado, Semana, Anio, FechaInicio, FechaFin, HorasTrabajadas, SueldoSemanal, Bonificaciones, Descuentos, TotalPago, Estado, FechaPago, MetodoPago, Comentarios) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [
            data.IdEmpleado,
            data.Semana,
            data.Anio,
            data.FechaInicio,
            data.FechaFin,
            data.HorasTrabajadas,
            data.SueldoSemanal,
            data.Bonificaciones || 0,
            data.Descuentos || 0,
            data.TotalPago,
            data.Estado || 'PENDIENTE',
            data.FechaPago || null,
            data.MetodoPago || 'TRANSFERENCIA',
            data.Comentarios || null
        ];
        const [result] = await db.execute(sql, values);
        return result.insertId;
    }

    static async getAll() {
        const sql = `
            SELECT p.*, 
                   CONCAT(u.Nombres, ' ', u.Apellidos) as NombreEmpleado
            FROM PAGO p
            LEFT JOIN EMPLEADO e ON p.IdEmpleado = e.IdEmpleado
            LEFT JOIN USUARIO u ON e.IdUsuario = u.IdUsuario
            ORDER BY p.Anio DESC, p.Semana DESC, p.FechaInicio DESC
        `;
        const [rows] = await db.query(sql);
        return rows;
    }

    static async getById(id) {
        const sql = `
            SELECT p.*, 
                   CONCAT(u.Nombres, ' ', u.Apellidos) as NombreEmpleado
            FROM PAGO p
            LEFT JOIN EMPLEADO e ON p.IdEmpleado = e.IdEmpleado
            LEFT JOIN USUARIO u ON e.IdUsuario = u.IdUsuario
            WHERE p.IdPago = ?
        `;
        const [rows] = await db.query(sql, [id]);
        return rows[0];
    }

    static async update(id, data) {
        const campos = [];
        const values = [];
        for (const key in data) {
            campos.push(`${key} = ?`);
            values.push(data[key]);
        }
        values.push(id);
        const sql = `UPDATE PAGO SET ${campos.join(', ')} WHERE IdPago = ?`;
        const [result] = await db.query(sql, values);
        return result.affectedRows;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM PAGO WHERE IdPago = ?', [id]);
        return result.affectedRows;
    }

    static async calcularPagoSemanal(IdEmpleado, Semana, Anio, FechaInicio, FechaFin) {
        // Llama al procedimiento almacenado
        const [result] = await db.query('CALL CalcularPagoSemanal(?, ?, ?, ?, ?)', [IdEmpleado, Semana, Anio, FechaInicio, FechaFin]);
        return result;
    }
}

module.exports = Pago;
