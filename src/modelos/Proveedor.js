const db = require('../bd/conexion');

class Proveedor {
    // Obtener todos los proveedores
    static async getAll() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    IdProveedor,
                    RUC,
                    RazonSocial,
                    Direccion,
                    Telefono,
                    Celular,
                    Email,
                    Contacto,
                    Estado,
                    FechaRegistro
                FROM PROVEEDOR 
                ORDER BY RazonSocial ASC
            `;
            
            db.query(query, (err, results) => {
                if (err) {
                    console.error('Error en Proveedor.getAll():', err);
                    reject(err);
                    return;
                }
                resolve(results);
            });
        });
    }

    // Obtener un proveedor por ID
    static async getById(id) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM PROVEEDOR WHERE IdProveedor = ?';
            
            db.query(query, [id], (err, results) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (results.length === 0) {
                    resolve(null);
                    return;
                }
                resolve(results[0]);
            });
        });
    }

    // Verificar si existe un RUC duplicado
    static async checkDuplicateRuc(ruc, idExcluir = null) {
        return new Promise((resolve, reject) => {
            let query = 'SELECT COUNT(*) as count FROM PROVEEDOR WHERE RUC = ?';
            let params = [ruc];
            
            if (idExcluir) {
                query += ' AND IdProveedor != ?';
                params.push(idExcluir);
            }
            
            db.query(query, params, (err, results) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(results[0].count > 0);
            });
        });
    }

    // Crear un nuevo proveedor
    static async create(proveedor) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO PROVEEDOR 
                (RUC, RazonSocial, Direccion, Telefono, Celular, Email, Contacto, Estado) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const values = [
                proveedor.RUC,
                proveedor.RazonSocial,
                proveedor.Direccion || null,
                proveedor.Telefono || null,
                proveedor.Celular || null,
                proveedor.Email || null,
                proveedor.Contacto || null,
                proveedor.Estado !== undefined ? proveedor.Estado : 1
            ];
            
            db.query(query, values, (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(result.insertId);
            });
        });
    }

    // Actualizar un proveedor
    static async update(id, proveedor) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE PROVEEDOR 
                SET RUC = ?, 
                    RazonSocial = ?, 
                    Direccion = ?, 
                    Telefono = ?, 
                    Celular = ?, 
                    Email = ?, 
                    Contacto = ?, 
                    Estado = ?
                WHERE IdProveedor = ?
            `;
            
            const values = [
                proveedor.RUC,
                proveedor.RazonSocial,
                proveedor.Direccion || null,
                proveedor.Telefono || null,
                proveedor.Celular || null,
                proveedor.Email || null,
                proveedor.Contacto || null,
                proveedor.Estado !== undefined ? proveedor.Estado : 1,
                id
            ];
            
            db.query(query, values, (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(result.affectedRows);
            });
        });
    }

    // Eliminar un proveedor
    static async delete(id) {
        return new Promise((resolve, reject) => {
            const query = 'DELETE FROM PROVEEDOR WHERE IdProveedor = ?';
            
            db.query(query, [id], (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(result.affectedRows);
            });
        });
    }

    // Cambiar estado de un proveedor (activar/desactivar)
    static async cambiarEstado(id, estado) {
        return new Promise((resolve, reject) => {
            const query = 'UPDATE PROVEEDOR SET Estado = ? WHERE IdProveedor = ?';
            
            db.query(query, [estado, id], (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(result.affectedRows);
            });
        });
    }
}

module.exports = Proveedor;
