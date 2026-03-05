const db = require('../bd/conexion');
const conexion = require('../bd/conexion');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

class Usuario {
    static async crear(usuarioData) {
        try {
            if (!usuarioData.Nombres || !usuarioData.Apellidos || !usuarioData.NumeroDocumento ||
                !usuarioData.Correo || !usuarioData.Clave || !usuarioData.IdRol) {
                throw new Error('Todos los campos obligatorios deben ser completados');
            }

            const [docExistente] = await db.query('SELECT IdUsuario FROM USUARIO WHERE NumeroDocumento = ?', [usuarioData.NumeroDocumento]);
            if (docExistente.length > 0) throw new Error('El numero de documento ya esta registrado');

            const [emailExistente] = await db.query('SELECT IdUsuario FROM USUARIO WHERE Correo = ?', [usuarioData.Correo]);
            if (emailExistente.length > 0) throw new Error('El correo electronico ya esta registrado');

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(usuarioData.Correo)) throw new Error('El formato del correo electronico no es valido');

            const [rolExistente] = await db.query('SELECT IdRol FROM ROL WHERE IdRol = ?', [usuarioData.IdRol]);
            if (rolExistente.length === 0) throw new Error('El rol seleccionado no existe');

            if ('ConfirmarClave' in usuarioData) delete usuarioData.ConfirmarClave;

            // Hashear contrasena con bcrypt
            usuarioData.Clave = await bcrypt.hash(usuarioData.Clave, SALT_ROUNDS);

            const [result] = await db.query('INSERT INTO USUARIO SET ?', {
                ...usuarioData,
                FechaRegistro: new Date()
            });

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
            if ('ConfirmarClave' in usuarioData) delete usuarioData.ConfirmarClave;

            if (usuarioData.hasOwnProperty('Clave') && (!usuarioData.Clave || usuarioData.Clave.trim() === '')) {
                delete usuarioData.Clave;
            } else if (usuarioData.hasOwnProperty('Clave') && usuarioData.Clave.trim() !== '') {
                // Hashear la nueva contrasena antes de guardar
                usuarioData.Clave = await bcrypt.hash(usuarioData.Clave.trim(), SALT_ROUNDS);
            }

            await db.query('UPDATE USUARIO SET ? WHERE IdUsuario = ?', [usuarioData, id]);
            return true;
        } catch (error) {
            throw error;
        }
    }

    static async eliminar(id) {
        await db.query('UPDATE USUARIO SET Estado = 0 WHERE IdUsuario = ?', [id]);
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

    static async getAllActive() {
        try {
            const [rows] = await db.query(`
                SELECT IdUsuario, Nombres, Apellidos, Correo
                FROM USUARIO WHERE Estado = 1
                ORDER BY Apellidos, Nombres
            `);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async getAll() {
        try {
            const [rows] = await db.query('SELECT * FROM USUARIO ORDER BY Apellidos, Nombres');
            return rows;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Autenticacion con soporte de migracion automatica:
     * - Si la contrasena almacenada es un hash bcrypt ($2b$), usa bcrypt.compare
     * - Si es texto plano (contrasenas antiguas), compara directamente y actualiza el hash
     */
    static async autenticar(correo, clave) {
        try {
            const sql = 'SELECT * FROM USUARIO WHERE Correo = ? AND Estado = 1';
            const [resultados] = await conexion.query(sql, [correo]);
            if (resultados.length === 0) return null;

            const usuario = resultados[0];
            const claveAlmacenada = usuario.Clave;

            // Detectar si ya es bcrypt hash
            if (claveAlmacenada.startsWith('$2b$') || claveAlmacenada.startsWith('$2a$')) {
                const valido = await bcrypt.compare(clave, claveAlmacenada);
                return valido ? usuario : null;
            } else {
                // Contrasena en texto plano (usuario antiguo): comparar y migrar automaticamente
                if (claveAlmacenada === clave) {
                    const nuevoHash = await bcrypt.hash(clave, SALT_ROUNDS);
                    await conexion.query('UPDATE USUARIO SET Clave = ? WHERE IdUsuario = ?', [nuevoHash, usuario.IdUsuario]);
                    console.log(`[Seguridad] Contrasena del usuario ${usuario.IdUsuario} migrada a bcrypt.`);
                    return usuario;
                }
                return null;
            }
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Usuario;