const db = require('../bd/conexion');
const conexion = require('../bd/conexion');

class Usuario {
    static async crear(usuarioData) {
        try {
            // Validar campos obligatorios
            if (!usuarioData.Nombres || !usuarioData.Apellidos || !usuarioData.NumeroDocumento || 
                !usuarioData.Correo || !usuarioData.Clave || !usuarioData.IdRol) {
                throw new Error('Todos los campos obligatorios deben ser completados');
            }

            // Verificar documento único
            const [docExistente] = await db.query('SELECT IdUsuario FROM USUARIO WHERE NumeroDocumento = ?', [usuarioData.NumeroDocumento]);
            if (docExistente.length > 0) {
                throw new Error('El número de documento ya está registrado');
            }

            // Verificar correo único
            const [emailExistente] = await db.query('SELECT IdUsuario FROM USUARIO WHERE Correo = ?', [usuarioData.Correo]);
            if (emailExistente.length > 0) {
                throw new Error('El correo electrónico ya está registrado');
            }

            // Validar formato de correo
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(usuarioData.Correo)) {
                throw new Error('El formato del correo electrónico no es válido');
            }

            // Verificar rol existente
            const [rolExistente] = await db.query('SELECT IdRol FROM ROL WHERE IdRol = ?', [usuarioData.IdRol]);
            if (rolExistente.length === 0) {
                throw new Error('El rol seleccionado no existe');
            }

            // Eliminar ConfirmarClave si existe
            if ('ConfirmarClave' in usuarioData) {
                delete usuarioData.ConfirmarClave;
            }

            // Guardar la contraseña tal cual, sin hashear
            const [result] = await db.query(
                'INSERT INTO USUARIO SET ?', 
                {
                    ...usuarioData,
                    FechaRegistro: new Date()
                }
            );

            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    static async listar() {
        const [usuarios] = await db.query(`
            SELECT u.*, r.Descripcion as Rol 
            FROM USUARIO u
            JOIN ROL r ON u.IdRol = r.IdRol
            ORDER BY u.FechaRegistro DESC
        `);
        return usuarios;
    }

    static async obtenerPorId(id) {
        const [usuario] = await db.query('SELECT * FROM USUARIO WHERE IdUsuario = ?', [id]);
        return usuario[0];
    }

    static async actualizar(id, usuarioData) {
        try {
            // Eliminar ConfirmarClave si existe
            if ('ConfirmarClave' in usuarioData) {
                delete usuarioData.ConfirmarClave;
            }
            
            // Validar que no se esté intentando actualizar con una contraseña vacía
            if (usuarioData.hasOwnProperty('Clave') && 
                (!usuarioData.Clave || usuarioData.Clave.trim() === '')) {
                delete usuarioData.Clave;
                console.log('Contraseña vacía detectada en modelo - eliminada del update');
            }
            
            console.log('Datos que se actualizarán:', Object.keys(usuarioData));
            
            await db.query('UPDATE USUARIO SET ? WHERE IdUsuario = ?', [usuarioData, id]);
            return true;
        } catch (error) {
            throw error;
        }
    }

    static async eliminar(id) {
        await db.query('DELETE FROM USUARIO WHERE IdUsuario = ?', [id]);
        return true;
    }

    static async obtenerRoles() {
        try {
            const [roles] = await db.query('SELECT IdRol, Descripcion FROM ROL');
            return roles;
        } catch (error) {
            throw error;
        }
    }

    // Obtener todos los usuarios activos
    static async getAllActive() {
        try {
            const [rows] = await db.query(`
                SELECT IdUsuario, Nombres, Apellidos, Correo 
                FROM USUARIO 
                WHERE Estado = 1
                ORDER BY Apellidos, Nombres
            `);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Obtener todos los usuarios
    static async getAll() {
        try {
            const [rows] = await db.query(`
                SELECT * FROM USUARIO
                ORDER BY Apellidos, Nombres
            `);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async autenticar(correo, clave) {
        try {
            const sql = 'SELECT * FROM USUARIO WHERE Correo = ? AND Estado = 1';
            const [resultados] = await conexion.query(sql, [correo]);
            if (resultados.length > 0) {
                const usuario = resultados[0];
                // Comparar directamente la contraseña ingresada con la almacenada
                if (usuario.Clave === clave) {
                    return usuario; // Usuario autenticado
                }
            }
            return null; // Usuario no encontrado o contraseña incorrecta
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Usuario;