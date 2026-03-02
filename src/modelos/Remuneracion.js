const db = require('../bd/conexion');

const Remuneracion = {
    getAll: async () => {
        const sql = `SELECT r.*, CONCAT(u.Nombres, ' ', u.Apellidos) AS Empleado 
                     FROM REMUNERACION r 
                     JOIN USUARIO u ON r.IdUsuario = u.IdUsuario 
                     ORDER BY r.FechaRegistro DESC`;
        const [results] = await db.query(sql);
        return results;
    },
    
    getById: async (id) => {
        const sql = `SELECT r.*, CONCAT(u.Nombres, ' ', u.Apellidos) AS Empleado 
                     FROM REMUNERACION r 
                     JOIN USUARIO u ON r.IdUsuario = u.IdUsuario 
                     WHERE r.IdRemuneracion = ?`;
        const [results] = await db.query(sql, [id]);
        return results[0];
    },
    
    create: async (data) => {
        const sql = `INSERT INTO REMUNERACION 
                     (IdUsuario, Periodo, FechaInicio, FechaFin, HorasTrabajadas, 
                      SueldoBase, Bonificaciones, Descuentos, Total, Estado, FechaPago) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const valores = [
            data.IdUsuario,
            data.Periodo,
            data.FechaInicio,
            data.FechaFin,
            data.HorasTrabajadas || null,
            data.SueldoBase,
            data.Bonificaciones || 0,
            data.Descuentos || 0,
            data.Total,
            data.Estado || 'PENDIENTE',
            data.FechaPago || null
        ];
        
        const [result] = await db.query(sql, valores);
        return result;
    },
    
    update: async (id, data) => {
        const sql = `UPDATE REMUNERACION SET 
                     IdUsuario = ?, Periodo = ?, FechaInicio = ?, FechaFin = ?, 
                     HorasTrabajadas = ?, SueldoBase = ?, Bonificaciones = ?, 
                     Descuentos = ?, Total = ?, Estado = ?, FechaPago = ?
                     WHERE IdRemuneracion = ?`;
        
        const valores = [
            data.IdUsuario,
            data.Periodo,
            data.FechaInicio,
            data.FechaFin,
            data.HorasTrabajadas || null,
            data.SueldoBase,
            data.Bonificaciones || 0,
            data.Descuentos || 0,
            data.Total,
            data.Estado || 'PENDIENTE',
            data.FechaPago || null,
            id
        ];
        
        const [result] = await db.query(sql, valores);
        return result;
    },
    
    delete: async (id) => {
        const sql = 'DELETE FROM REMUNERACION WHERE IdRemuneracion = ?';
        const [result] = await db.query(sql, [id]);
        return result;
    }
};

module.exports = Remuneracion;
