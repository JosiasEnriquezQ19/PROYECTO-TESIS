const Usuario = require('../../src/modelos/Usuario');
const db = require('../../src/bd/conexion');
const bcrypt = require('bcrypt');

jest.mock('../../src/bd/conexion', () => ({
    query: jest.fn()
}));

jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn()
}));

describe('Usuario Model', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('crear', () => {
        const validUser = {
            Nombres: 'Juan', Apellidos: 'Perez', NumeroDocumento: '12345678',
            Correo: 'test@test.com', Clave: '123', IdRol: 1
        };

        it('debe lanzar error si faltan campos obligatorios', async () => {
            const invalidUser = { Nombres: 'Juan' };
            await expect(Usuario.crear(invalidUser)).rejects.toThrow('Todos los campos obligatorios deben ser completados');
        });

        it('debe lanzar error si documento existe', async () => {
            db.query.mockResolvedValueOnce([[{ IdUsuario: 1 }]]); // Documento query
            await expect(Usuario.crear(validUser)).rejects.toThrow('El número de documento ya está registrado');
        });

        it('debe lanzar error si correo existe', async () => {
            db.query
                .mockResolvedValueOnce([[]]) // Documento
                .mockResolvedValueOnce([[{ IdUsuario: 1 }]]); // Correo
            await expect(Usuario.crear(validUser)).rejects.toThrow('El correo electrónico ya está registrado');
        });

        it('debe lanzar error si correo invalido', async () => {
            db.query.mockResolvedValue([[]]);
            const badEmailUser = { ...validUser, Correo: 'correo-invalido' };
            await expect(Usuario.crear(badEmailUser)).rejects.toThrow('El formato del correo electrónico no es válido');
        });

        it('debe lanzar error si rol no existe', async () => {
            db.query
                .mockResolvedValueOnce([[]]) // Doc
                .mockResolvedValueOnce([[]]) // Email
                .mockResolvedValueOnce([[]]); // Rol nulo
            await expect(Usuario.crear(validUser)).rejects.toThrow('El rol seleccionado no existe');
        });

        it('debe crear el usuario exitosamente hasheando la clave', async () => {
            db.query
                .mockResolvedValueOnce([[]]) // Doc
                .mockResolvedValueOnce([[]]) // Email
                .mockResolvedValueOnce([[{ IdRol: 1 }]]) // Rol ok
                .mockResolvedValueOnce([{ insertId: 5 }]); // Insert ok
                
            bcrypt.hash.mockResolvedValue('hashed_password');
            
            const insertId = await Usuario.crear(validUser);
            
            expect(bcrypt.hash).toHaveBeenCalledWith('123', 12);
            expect(db.query).toHaveBeenCalledWith('INSERT INTO USUARIO SET ?', expect.objectContaining({ Clave: 'hashed_password' }));
            expect(insertId).toBe(5);
        });
    });

    describe('listar, obtenerPorId, eliminar, obtenerRoles', () => {
        it('debe listar todos los usuarios', async () => {
            db.query.mockResolvedValue([[{ id: 1 }]]);
            const res = await Usuario.listar();
            expect(db.query).toHaveBeenCalledWith(expect.stringContaining('JOIN ROL'));
            expect(res).toEqual([{ id: 1 }]);
        });

        it('debe obtener por id', async () => {
            db.query.mockResolvedValue([[{ id: 1 }]]);
            const res = await Usuario.obtenerPorId(1);
            expect(db.query).toHaveBeenCalledWith('SELECT * FROM USUARIO WHERE IdUsuario = ?', [1]);
            expect(res).toEqual({ id: 1 });
        });

        it('debe eliminar (estado 0)', async () => {
            db.query.mockResolvedValue([{}]);
            await Usuario.eliminar(5);
            expect(db.query).toHaveBeenCalledWith('UPDATE USUARIO SET Estado = 0 WHERE IdUsuario = ?', [5]);
        });
        
        it('debe obtener roles', async () => {
            db.query.mockResolvedValue([[{ id: 1 }]]);
            const res = await Usuario.obtenerRoles();
            expect(db.query).toHaveBeenCalledWith('SELECT IdRol, Descripcion FROM ROL');
            expect(res).toEqual([{ id: 1 }]);
        });
    });

    describe('actualizar', () => {
        it('debe lanzar error si no hay campos validos', async () => {
            await expect(Usuario.actualizar(1, { CampoInvalido: 'test' })).rejects.toThrow('No hay datos válidos para actualizar');
        });

        it('debe hashear la clave si se envía una nueva', async () => {
            bcrypt.hash.mockResolvedValue('new_hash');
            db.query.mockResolvedValue([{ affectedRows: 1 }]);
            
            await Usuario.actualizar(1, { Nombres: 'Test', Clave: 'new_pass' });
            
            expect(bcrypt.hash).toHaveBeenCalledWith('new_pass', 12);
            expect(db.query).toHaveBeenCalledWith('UPDATE USUARIO SET ? WHERE IdUsuario = ?', [{ Nombres: 'Test', Clave: 'new_hash' }, 1]);
        });
        
        it('debe eliminar clave si llega vacia', async () => {
            db.query.mockResolvedValue([{ affectedRows: 1 }]);
            await Usuario.actualizar(1, { Nombres: 'Test', Clave: '   ' }); // clave vacia despues de trim
            expect(db.query.mock.calls[0][1][0].Clave).toBeUndefined();
        });

        it('debe lanzar error si no afecto columnas', async () => {
            db.query.mockResolvedValue([{ affectedRows: 0 }]);
            await expect(Usuario.actualizar(1, { Nombres: 'Test' })).rejects.toThrow('Usuario no encontrado o sin cambios realizados');
        });
    });

    describe('autenticar', () => {
        it('debe retornar null si el usuario no existe', async () => {
            db.query.mockResolvedValue([[]]);
            const res = await Usuario.autenticar('test@test.com', '123');
            expect(res).toBeNull();
        });

        it('debe comparar hash bcrypt y retornar usuario si es correcto', async () => {
            const mockUser = { IdUsuario: 1, Correo: 't@t.com', Clave: '$2b$12$hash' };
            db.query.mockResolvedValue([[mockUser]]);
            bcrypt.compare.mockResolvedValue(true);
            
            const res = await Usuario.autenticar('t@t.com', '123');
            
            expect(bcrypt.compare).toHaveBeenCalledWith('123', '$2b$12$hash');
            expect(res).toEqual(mockUser);
        });

        it('debe retornar null si bcrypt falla', async () => {
            const mockUser = { IdUsuario: 1, Correo: 't@t.com', Clave: '$2b$12$hash' };
            db.query.mockResolvedValue([[mockUser]]);
            bcrypt.compare.mockResolvedValue(false);
            
            const res = await Usuario.autenticar('t@t.com', '123');
            expect(res).toBeNull();
        });

        it('migración: debe autenticar con clave plana y hashear', async () => {
            const mockUser = { IdUsuario: 1, Correo: 't@t.com', Clave: 'plana123' };
            db.query.mockResolvedValueOnce([[mockUser]]); // SELECT devuelve user
            db.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE no falla
            bcrypt.hash.mockResolvedValue('nuevo_hash');

            const res = await Usuario.autenticar('t@t.com', 'plana123');
            
            expect(bcrypt.hash).toHaveBeenCalledWith('plana123', 12);
            expect(db.query).toHaveBeenCalledWith('UPDATE USUARIO SET Clave = ? WHERE IdUsuario = ?', ['nuevo_hash', 1]);
            expect(res.Clave).toBe('nuevo_hash');
        });
    });

    describe('getAllActive & getAll', () => {
        it('debe obtener todos activos', async () => {
            db.query.mockResolvedValue([[{ id: 1 }]]);
            await Usuario.getAllActive();
            expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE Estado = 1'));
        });

        it('debe obtener todos', async () => {
            db.query.mockResolvedValue([[{ id: 1 }]]);
            await Usuario.getAll();
            expect(db.query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY Apellidos, Nombres'));
        });
    });
});
