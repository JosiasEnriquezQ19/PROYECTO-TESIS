const db = require('../bd/conexion');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

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

            // Hashear contraseña
            usuarioData.Clave = await bcrypt.hash(usuarioData.Clave, SALT_ROUNDS);

            // Guardar el usuario
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
            // Filtrar solo campos permitidos (seguridad)
            const camposPermitidos = ['Nombres', 'Apellidos', 'TipoDocumento', 'NumeroDocumento', 'Correo', 'Telefono', 'Direccion', 'IdRol', 'Estado', 'Clave'];
            const datosLimpios = {};

            for (const campo of camposPermitidos) {
                if (campo in usuarioData && usuarioData[campo] !== undefined) {
                    datosLimpios[campo] = usuarioData[campo];
                }
            }

            // Eliminar ConfirmarClave si existe
            if ('ConfirmarClave' in datosLimpios) {
                delete datosLimpios.ConfirmarClave;
            }

            // Si llega una nueva clave, guardarla hasheada.
            if (datosLimpios.Clave) {
                const claveNueva = datosLimpios.Clave.trim();
                if (!claveNueva) {
                    delete datosLimpios.Clave;
                    console.log('Contrasena vacia detectada en modelo - eliminada del update');
                } else {
                    datosLimpios.Clave = await bcrypt.hash(claveNueva, SALT_ROUNDS);
                    console.log('Contraseña actualizada para usuario ID:', id);
                }
            }

            console.log('Datos que se actualizarán:', Object.keys(datosLimpios));

            if (Object.keys(datosLimpios).length === 0) {
                throw new Error('No hay datos válidos para actualizar');
            }

            const [result] = await db.query('UPDATE USUARIO SET ? WHERE IdUsuario = ?', [datosLimpios, id]);

            if (result.affectedRows === 0) {
                throw new Error('Usuario no encontrado o sin cambios realizados');
            }

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
            const sql = `
                SELECT u.*, r.Descripcion as RolNombre 
                FROM USUARIO u
                LEFT JOIN ROL r ON u.IdRol = r.IdRol
                WHERE u.Correo = ? AND u.Estado = 1
            `;
            const [resultados] = await db.query(sql, [correo]);

            if (resultados.length === 0) {
                return null;
            }

            const usuario = resultados[0];
            const claveGuardada = usuario.Clave || '';
            let autenticado = false;

            // Soporte para claves hasheadas con bcrypt.
            if (typeof claveGuardada === 'string' && claveGuardada.startsWith('$2')) {
                autenticado = await bcrypt.compare(clave, claveGuardada);
            } else {
                // Compatibilidad temporal con claves legadas en texto plano.
                autenticado = claveGuardada === clave;

                // Si el login fue valido con formato legado, migrar inmediatamente a hash.
                if (autenticado) {
                    const claveHasheada = await bcrypt.hash(clave, SALT_ROUNDS);
                    await db.query('UPDATE USUARIO SET Clave = ? WHERE IdUsuario = ?', [claveHasheada, usuario.IdUsuario]);
                    usuario.Clave = claveHasheada;
                }
            }

            return autenticado ? usuario : null;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Usuario;