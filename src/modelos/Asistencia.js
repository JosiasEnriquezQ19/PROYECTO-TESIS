const db = require('../bd/conexion');

class Asistencia {
    // Crear un nuevo registro de asistencia
    static async create(asistenciaData) {
        try {
            // Manejar valores undefined
            Object.keys(asistenciaData).forEach(key => {
                if (asistenciaData[key] === undefined) {
                    asistenciaData[key] = null;
                }
            });

            const [result] = await db.execute(
                `INSERT INTO ASISTENCIA 
                (IdEmpleado, Fecha, HoraEntrada, HoraSalida, Estado, TipoAsistencia, JornadaLaboral, Observaciones) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    asistenciaData.IdEmpleado,
                    asistenciaData.Fecha,
                    asistenciaData.HoraEntrada,
                    asistenciaData.HoraSalida,
                    asistenciaData.Estado || 'PRESENTE',
                    asistenciaData.TipoAsistencia || 'REGULAR',
                    asistenciaData.JornadaLaboral || 'COMPLETA',
                    asistenciaData.Observaciones
                ]
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Obtener todas las asistencias con información del empleado
    static async getAll() {
        try {
            console.log('Ejecutando consulta de asistencias...');
            
            // Intenta primero con la consulta completa con JOINs
            try {
                const [rows] = await db.query(`
                    SELECT 
                        a.IdAsistencia,
                        a.IdEmpleado,
                        a.Fecha,
                        a.HoraEntrada,
                        a.HoraSalida,
                        a.HorasTrabajadas,
                        a.Estado,
                        a.TipoAsistencia,
                        a.JornadaLaboral,
                        a.Observaciones,
                        a.FechaRegistro,
                        COALESCE(CONCAT(u.Nombres, ' ', u.Apellidos), 'Empleado sin usuario') AS NombreCompleto,
                        COALESCE(u.Nombres, 'Sin nombre') AS Nombres,
                        COALESCE(u.Apellidos, 'Sin apellido') AS Apellidos,
                        COALESCE(e.Cargo, 'Sin cargo') AS Cargo,
                        COALESCE(e.Area, 'Sin área') AS Area,
                        e.SueldoBase
                    FROM ASISTENCIA a
                    LEFT JOIN EMPLEADO e ON a.IdEmpleado = e.IdEmpleado
                    LEFT JOIN USUARIO u ON e.IdUsuario = u.IdUsuario
                    ORDER BY a.Fecha DESC, a.FechaRegistro DESC
                `);
                console.log(`Encontradas ${rows.length} asistencias con consulta completa`);
                if (rows.length > 0) {
                    console.log('Primera fila:', JSON.stringify(rows[0], null, 2));
                }
                return rows;
            } catch (joinError) {
                console.warn('Error con consulta de JOINs, intentando consulta simple:', joinError.message);
                
                // Consulta de respaldo si falla la principal
                const [simpleRows] = await db.query(`
                    SELECT 
                        IdAsistencia,
                        IdEmpleado,
                        Fecha,
                        HoraEntrada,
                        HoraSalida,
                        HorasTrabajadas,
                        Estado,
                        TipoAsistencia,
                        JornadaLaboral,
                        Observaciones,
                        FechaRegistro,
                        CONCAT('Empleado ID: ', IdEmpleado) AS NombreCompleto,
                        'Sin datos' AS Nombres,
                        'Sin datos' AS Apellidos,
                        'Sin datos' AS Cargo,
                        'Sin datos' AS Area,
                        0 AS SueldoBase
                    FROM ASISTENCIA 
                    ORDER BY Fecha DESC, FechaRegistro DESC
                `);
                console.log(`Encontradas ${simpleRows.length} asistencias con consulta simple`);
                return simpleRows;
            }
        } catch (error) {
            console.error('Error en Asistencia.getAll():', error);
            throw error;
        }
    }

    // Obtener asistencia por ID
    static async getById(id) {
        try {
            const [rows] = await db.execute(
                `SELECT 
                    a.IdAsistencia,
                    a.IdEmpleado,
                    a.Fecha,
                    a.HoraEntrada,
                    a.HoraSalida,
                    a.HorasTrabajadas,
                    a.Estado,
                    a.TipoAsistencia,
                    a.JornadaLaboral,
                    a.Observaciones,
                    a.FechaRegistro,
                    CONCAT(u.Nombres, ' ', u.Apellidos) AS NombreCompleto,
                    u.Nombres,
                    u.Apellidos,
                    e.Cargo,
                    e.Area
                FROM ASISTENCIA a
                INNER JOIN EMPLEADO e ON a.IdEmpleado = e.IdEmpleado
                INNER JOIN USUARIO u ON e.IdUsuario = u.IdUsuario
                WHERE a.IdAsistencia = ?`,
                [id]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Actualizar asistencia
    static async update(id, asistenciaData) {
        try {
            // Construir la consulta dinámicamente solo con los campos proporcionados
            const fields = [];
            const values = [];
            
            // Solo agregar campos que existen en asistenciaData
            if (asistenciaData.HoraEntrada !== undefined) {
                fields.push('HoraEntrada = ?');
                values.push(asistenciaData.HoraEntrada);
            }
            if (asistenciaData.HoraSalida !== undefined) {
                fields.push('HoraSalida = ?');
                values.push(asistenciaData.HoraSalida);
            }
            if (asistenciaData.Estado !== undefined) {
                fields.push('Estado = ?');
                values.push(asistenciaData.Estado);
            }
            if (asistenciaData.TipoAsistencia !== undefined) {
                fields.push('TipoAsistencia = ?');
                values.push(asistenciaData.TipoAsistencia);
            }
            if (asistenciaData.JornadaLaboral !== undefined) {
                fields.push('JornadaLaboral = ?');
                values.push(asistenciaData.JornadaLaboral);
            }
            if (asistenciaData.Observaciones !== undefined) {
                fields.push('Observaciones = ?');
                values.push(asistenciaData.Observaciones);
            }
            
            // Agregar el ID al final
            values.push(id);
            
            const query = `UPDATE ASISTENCIA SET ${fields.join(', ')} WHERE IdAsistencia = ?`;
            
            const [result] = await db.execute(query, values);
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }

    // Eliminar asistencia
    static async delete(id) {
        try {
            const [result] = await db.execute(
                `DELETE FROM ASISTENCIA WHERE IdAsistencia = ?`,
                [id]
            );
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }

    // Verificar si ya existe un registro para el mismo empleado y fecha
    static async checkDuplicate(IdEmpleado, Fecha, excludeId = null) {
        try {
            // Asegurar que los parámetros no sean undefined
            if (IdEmpleado === undefined) IdEmpleado = null;
            if (Fecha === undefined) Fecha = null;
            if (excludeId === undefined) excludeId = null;

            let query = `SELECT COUNT(*) AS count FROM ASISTENCIA 
                        WHERE IdEmpleado = ? AND Fecha = ?`;
            const params = [IdEmpleado, Fecha];
            if (excludeId) {
                query += ` AND IdAsistencia != ?`;
                params.push(excludeId);
            }
            const [rows] = await db.execute(query, params);
            return rows[0].count > 0;
        } catch (error) {
            throw error;
        }
    }

    // Obtener empleados activos para el select
    static async getEmpleados() {
        try {
            const [rows] = await db.execute(
                `SELECT 
                    e.IdEmpleado,
                    e.IdUsuario,
                    CONCAT(u.Nombres, ' ', u.Apellidos) AS NombreCompleto,
                    u.Nombres,
                    u.Apellidos,
                    e.Cargo,
                    e.Area,
                    e.SueldoBase
                FROM EMPLEADO e
                INNER JOIN USUARIO u ON e.IdUsuario = u.IdUsuario
                WHERE e.Estado = 'ACTIVO' AND u.Estado = 1
                ORDER BY u.Apellidos, u.Nombres`
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Obtener asistencias por empleado y rango de fechas
    static async getByEmpleadoAndDateRange(IdEmpleado, fechaInicio, fechaFin) {
        try {
            const [rows] = await db.execute(
                `SELECT 
                    a.*,
                    CONCAT(u.Nombres, ' ', u.Apellidos) AS NombreCompleto
                FROM ASISTENCIA a
                INNER JOIN EMPLEADO e ON a.IdEmpleado = e.IdEmpleado
                INNER JOIN USUARIO u ON e.IdUsuario = u.IdUsuario
                WHERE a.IdEmpleado = ? 
                AND a.Fecha BETWEEN ? AND ?
                ORDER BY a.Fecha ASC`,
                [IdEmpleado, fechaInicio, fechaFin]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Obtener total de horas trabajadas por empleado en un rango de fechas
    static async getTotalHorasTrabajadasRango(IdEmpleado, fechaInicio, fechaFin) {
        try {
            const [rows] = await db.execute(
                `SELECT 
                    COALESCE(SUM(HorasTrabajadas), 0) AS TotalHoras,
                    COUNT(*) AS TotalDias,
                    COUNT(CASE WHEN Estado = 'PRESENTE' THEN 1 END) AS DiasPresente,
                    COUNT(CASE WHEN Estado = 'TARDANZA' THEN 1 END) AS DiasTardanza,
                    COUNT(CASE WHEN Estado = 'AUSENTE' THEN 1 END) AS DiasAusente
                FROM ASISTENCIA
                WHERE IdEmpleado = ? 
                AND Fecha BETWEEN ? AND ?
                AND Estado IN ('PRESENTE', 'TARDANZA')`,
                [IdEmpleado, fechaInicio, fechaFin]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Registrar asistencia usando el procedimiento almacenado
    static async registrarAsistencia(asistenciaData) {
        try {
            await db.execute(
                `CALL RegistrarAsistencia(?, ?, ?, ?, ?, ?)`,
                [
                    asistenciaData.IdEmpleado,
                    asistenciaData.Fecha,
                    asistenciaData.HoraEntrada,
                    asistenciaData.HoraSalida,
                    asistenciaData.TipoAsistencia || 'REGULAR',
                    asistenciaData.Observaciones
                ]
            );
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Obtener resumen semanal de asistencias por empleado
    static async getResumenSemanal(anio = null, semana = null) {
        try {
            let whereClause = '';
            const params = [];
            
            if (anio && semana) {
                whereClause = 'WHERE Anio = ? AND Semana = ?';
                params.push(anio, semana);
            } else if (anio) {
                whereClause = 'WHERE Anio = ?';
                params.push(anio);
            }

            const [rows] = await db.execute(
                `SELECT * FROM VistaAsistenciaSemanal ${whereClause}
                ORDER BY Anio DESC, Semana DESC, NombreEmpleado ASC`,
                params
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Asistencia;