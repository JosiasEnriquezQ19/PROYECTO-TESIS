const db = require('../bd/conexion');

class Empresa {
    // Crear una nueva empresa
    static async create(data) {
        try {
            // Ensure all optional fields are set to null if undefined
            const campos = {
                Nombre: data.Nombre,
                RUC: data.RUC,
                Direccion: data.Direccion,
                Telefono: data.Telefono || null,
                Celular: data.Celular || null,
                Email: data.Email || null,
                Logo: data.Logo || null,
                TextoPresentacion: data.TextoPresentacion || null,
                CuentaBancaria: data.CuentaBancaria || null,
                NombreCuentaBancaria: data.NombreCuentaBancaria || null,
                Estado: data.Estado !== undefined ? data.Estado : 1
            };

            const [result] = await db.execute(
                `INSERT INTO EMPRESA (Nombre, RUC, Direccion, Telefono, Celular, Email, Logo, TextoPresentacion, CuentaBancaria, NombreCuentaBancaria, Estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    campos.Nombre,
                    campos.RUC,
                    campos.Direccion,
                    campos.Telefono,
                    campos.Celular,
                    campos.Email,
                    campos.Logo,
                    campos.TextoPresentacion,
                    campos.CuentaBancaria,
                    campos.NombreCuentaBancaria,
                    campos.Estado
                ]
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Obtener todas las empresas
    static async getAll() {
        try {
            const [rows] = await db.query('SELECT * FROM EMPRESA');
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Obtener empresa por ID
    static async getById(id) {
        try {
            const [rows] = await db.query('SELECT * FROM EMPRESA WHERE IdEmpresa = ?', [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Actualizar empresa
    static async update(id, data) {
        try {
            // Filtrar campos válidos - permitir campos vacíos para limpiar datos
            const campos = {};
            
            // Incluir todos los campos que vienen en data, validando solo los requeridos
            if (data.Nombre !== undefined) {
                if (data.Nombre === '') {
                    throw new Error('El nombre de la empresa es requerido');
                }
                campos.Nombre = data.Nombre;
            }
            
            if (data.RUC !== undefined) {
                if (data.RUC === '') {
                    throw new Error('El RUC es requerido');
                }
                campos.RUC = data.RUC;
            }
            
            if (data.Direccion !== undefined) {
                if (data.Direccion === '') {
                    throw new Error('La dirección es requerida');
                }
                campos.Direccion = data.Direccion;
            }
            
            // Campos opcionales - permitir null o valores vacíos
            if (data.Telefono !== undefined) campos.Telefono = data.Telefono || null;
            if (data.Celular !== undefined) campos.Celular = data.Celular || null;
            if (data.Email !== undefined) campos.Email = data.Email || null;
            if (data.TextoPresentacion !== undefined) campos.TextoPresentacion = data.TextoPresentacion || null;
            if (data.CuentaBancaria !== undefined) campos.CuentaBancaria = data.CuentaBancaria || null;
            if (data.NombreCuentaBancaria !== undefined) campos.NombreCuentaBancaria = data.NombreCuentaBancaria || null;
            if (data.Estado !== undefined) campos.Estado = data.Estado;
            
            // Solo incluir Logo si realmente hay un archivo nuevo
            if (data.Logo && data.Logo.length > 0) {
                campos.Logo = data.Logo;
            }

            // Verificar que hay campos para actualizar
            if (Object.keys(campos).length === 0) {
                throw new Error('No hay campos válidos para actualizar');
            }

            // Construir la consulta SQL manualmente para mayor control
            const setClauses = Object.keys(campos).map(key => `${key} = ?`).join(', ');
            const values = Object.values(campos);
            values.push(id);

            const sql = `UPDATE EMPRESA SET ${setClauses} WHERE IdEmpresa = ?`;
            const [result] = await db.query(sql, values);
            
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }

    // Eliminar empresa
    static async delete(id) {
        try {
            const [result] = await db.query('DELETE FROM EMPRESA WHERE IdEmpresa = ?', [id]);
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Empresa;
