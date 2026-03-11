jest.mock('../../src/bd/conexion');

const conexion = require('../../src/bd/conexion');
const Usuario = require('../../src/modelos/Usuario');

beforeEach(() => {
    jest.clearAllMocks();
});

// ─────────────────────────────────────────────
// Usuario.autenticar()
// ─────────────────────────────────────────────
describe('Usuario.autenticar()', () => {
    test('retorna el usuario si correo y clave son correctos', async () => {
        const usuarioMock = {
            IdUsuario: 1,
            Correo: 'admin@carsil.com',
            Clave: 'admin123',
            IdRol: 1,
            Estado: 1
        };
        conexion.query.mockResolvedValue([[usuarioMock]]);

        const resultado = await Usuario.autenticar('admin@carsil.com', 'admin123');

        expect(resultado).toEqual(usuarioMock);
    });

    test('retorna null si la clave es incorrecta', async () => {
        const usuarioMock = {
            IdUsuario: 1,
            Correo: 'admin@carsil.com',
            Clave: 'admin123',
            IdRol: 1,
            Estado: 1
        };
        conexion.query.mockResolvedValue([[usuarioMock]]);

        const resultado = await Usuario.autenticar('admin@carsil.com', 'claveIncorrecta');

        expect(resultado).toBeNull();
    });

    test('retorna null si el usuario no existe o está inactivo', async () => {
        conexion.query.mockResolvedValue([[]]); // sin resultados

        const resultado = await Usuario.autenticar('noexiste@mail.com', '1234');

        expect(resultado).toBeNull();
    });

    test('lanza error si falla la consulta a la BD', async () => {
        conexion.query.mockRejectedValue(new Error('DB error'));

        await expect(Usuario.autenticar('admin@carsil.com', '1234'))
            .rejects
            .toThrow('DB error');
    });
});

// ─────────────────────────────────────────────
// Usuario.listar()
// ─────────────────────────────────────────────
describe('Usuario.listar()', () => {
    test('retorna la lista de usuarios con su rol', async () => {
        const usuariosMock = [
            { IdUsuario: 1, Nombres: 'Carlos', Rol: 'Administrador' },
            { IdUsuario: 2, Nombres: 'Ana', Rol: 'Empleado' }
        ];
        conexion.query.mockResolvedValue([usuariosMock]);

        const resultado = await Usuario.listar();

        expect(resultado).toEqual(usuariosMock);
        expect(conexion.query).toHaveBeenCalledWith(
            expect.stringContaining('JOIN ROL')
        );
    });
});

// ─────────────────────────────────────────────
// Usuario.obtenerPorId()
// ─────────────────────────────────────────────
describe('Usuario.obtenerPorId()', () => {
    test('retorna el usuario correcto por ID', async () => {
        const usuarioMock = { IdUsuario: 3, Nombres: 'Pedro', Correo: 'pedro@mail.com' };
        conexion.query.mockResolvedValue([[usuarioMock]]);

        const resultado = await Usuario.obtenerPorId(3);

        expect(resultado).toEqual(usuarioMock);
        expect(conexion.query).toHaveBeenCalledWith(
            'SELECT * FROM USUARIO WHERE IdUsuario = ?',
            [3]
        );
    });

    test('retorna undefined si el usuario no existe', async () => {
        conexion.query.mockResolvedValue([[]]);
        const resultado = await Usuario.obtenerPorId(999);
        expect(resultado).toBeUndefined();
    });
});

// ─────────────────────────────────────────────
// Usuario.eliminar()
// ─────────────────────────────────────────────
describe('Usuario.eliminar()', () => {
    test('ejecuta DELETE y retorna true', async () => {
        conexion.query.mockResolvedValue([{ affectedRows: 1 }]);

        const resultado = await Usuario.eliminar(5);

        expect(resultado).toBe(true);
        expect(conexion.query).toHaveBeenCalledWith(
            'DELETE FROM USUARIO WHERE IdUsuario = ?',
            [5]
        );
    });
});
