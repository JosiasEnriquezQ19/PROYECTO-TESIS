// Proveedor usa callback-style db.query (Promise wrapping manual)
// El mock debe invocar el callback correctamente

jest.mock('../../src/bd/conexion', () => ({ query: jest.fn() }));

const db = require('../../src/bd/conexion');
const Proveedor = require('../../src/modelos/Proveedor');

beforeEach(() => jest.clearAllMocks());

// Helper: simula callback exitoso con 2 args (sql, cb)
function mockQueryCallback(result) {
    db.query.mockImplementation((...args) => {
        const cb = args[args.length - 1];
        if (typeof cb === 'function') cb(null, result);
    });
}

// Helper: simula callback de error
function mockQueryError(err) {
    db.query.mockImplementation((...args) => {
        const cb = args[args.length - 1];
        if (typeof cb === 'function') cb(err, null);
    });
}

describe('Proveedor.getAll()', () => {
    test('retorna todos los proveedores', async () => {
        const mock = [{ IdProveedor: 1, RazonSocial: 'TechProv SAC' }];
        mockQueryCallback(mock);

        const resultado = await Proveedor.getAll();
        expect(resultado).toEqual(mock);
    });

    test('rechaza la promesa si hay error de BD', async () => {
        mockQueryError(new Error('DB error'));
        await expect(Proveedor.getAll()).rejects.toThrow('DB error');
    });
});

describe('Proveedor.getById()', () => {
    test('retorna el proveedor correcto', async () => {
        const mock = { IdProveedor: 2, RazonSocial: 'Distribuidora Lima' };
        mockQueryCallback([mock]);

        const resultado = await Proveedor.getById(2);
        expect(resultado).toEqual(mock);
    });

    test('retorna null si el proveedor no existe', async () => {
        mockQueryCallback([]);
        const resultado = await Proveedor.getById(999);
        expect(resultado).toBeNull();
    });
});

describe('Proveedor.checkDuplicateRuc()', () => {
    test('retorna true si el RUC ya existe', async () => {
        mockQueryCallback([{ count: 1 }]);
        const existe = await Proveedor.checkDuplicateRuc('20123456789');
        expect(existe).toBe(true);
    });

    test('retorna false si el RUC no existe', async () => {
        mockQueryCallback([{ count: 0 }]);
        const existe = await Proveedor.checkDuplicateRuc('99999999999');
        expect(existe).toBe(false);
    });
});

describe('Proveedor.create()', () => {
    test('inserta el proveedor y retorna su ID', async () => {
        mockQueryCallback({ insertId: 10 });

        const id = await Proveedor.create({
            RUC: '20777777777', RazonSocial: 'Nuevo Proveedor', Estado: 1
        });
        expect(id).toBe(10);
    });

    test('rechaza si hay error al insertar', async () => {
        mockQueryError(new Error('Duplicate entry'));
        await expect(Proveedor.create({ RUC: '20777777777', RazonSocial: 'Test' })).rejects.toThrow('Duplicate entry');
    });
});
