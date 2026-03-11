jest.mock('../../src/bd/conexion');

const pool = require('../../src/bd/conexion');
const Notificacion = require('../../src/modelos/Notificacion');

beforeEach(() => jest.clearAllMocks());

describe('Notificacion.crear()', () => {
    test('inserta la notificacion y retorna el ID', async () => {
        pool.query.mockResolvedValue([{ insertId: 15 }]);

        const id = await Notificacion.crear({
            Tipo: 'INFO', Modulo: 'Ventas', Mensaje: 'Nueva venta', Detalle: null, Usuario: 'admin'
        });

        expect(id).toBe(15);
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO notificaciones'),
            ['INFO', 'Ventas', 'Nueva venta', null, 'admin']
        );
    });
});

describe('Notificacion.obtenerRecientes()', () => {
    test('retorna las últimas 20 notificaciones por defecto', async () => {
        const mock = [{ IdNotificacion: 1, Mensaje: 'Test' }];
        pool.query.mockResolvedValue([mock]);

        const resultado = await Notificacion.obtenerRecientes();
        expect(resultado).toEqual(mock);
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('ORDER BY FechaCreacion DESC LIMIT ?'),
            [20]
        );
    });

    test('acepta un límite personalizado', async () => {
        pool.query.mockResolvedValue([[]]);
        await Notificacion.obtenerRecientes(5);
        expect(pool.query).toHaveBeenCalledWith(expect.anything(), [5]);
    });
});

describe('Notificacion.obtenerNoLeidas()', () => {
    test('retorna notificaciones no leídas', async () => {
        const mock = [{ IdNotificacion: 3, Leida: 0 }];
        pool.query.mockResolvedValue([mock]);

        const resultado = await Notificacion.obtenerNoLeidas();
        expect(resultado).toEqual(mock);
        expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('Leida = 0'));
    });
});

describe('Notificacion.contarNoLeidas()', () => {
    test('retorna el conteo de no leídas', async () => {
        pool.query.mockResolvedValue([[{ total: 7 }]]);
        const total = await Notificacion.contarNoLeidas();
        expect(total).toBe(7);
    });
});

describe('Notificacion.marcarLeida()', () => {
    test('marca la notificacion específica como leída', async () => {
        pool.query.mockResolvedValue([{ affectedRows: 1 }]);
        await Notificacion.marcarLeida(3);
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('SET Leida = 1 WHERE IdNotificacion = ?'),
            [3]
        );
    });
});

describe('Notificacion.marcarTodasLeidas()', () => {
    test('marca todas las notificaciones como leídas', async () => {
        pool.query.mockResolvedValue([{ affectedRows: 5 }]);
        await Notificacion.marcarTodasLeidas();
        expect(pool.query).toHaveBeenCalledWith(
            'UPDATE notificaciones SET Leida = 1 WHERE Leida = 0'
        );
    });
});
