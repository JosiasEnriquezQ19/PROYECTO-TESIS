jest.mock('../../src/bd/conexion');

const db = require('../../src/bd/conexion');
const Empresa = require('../../src/modelos/Empresa');

beforeEach(() => jest.clearAllMocks());

describe('Empresa.getAll()', () => {
    test('retorna todas las empresas', async () => {
        const mock = [{ IdEmpresa: 1, Nombre: 'CARSIL SAC', RUC: '20123456789' }];
        db.query.mockResolvedValue([mock]);

        const resultado = await Empresa.getAll();
        expect(resultado).toEqual(mock);
        expect(db.query).toHaveBeenCalledWith('SELECT * FROM EMPRESA');
    });
});

describe('Empresa.getById()', () => {
    test('retorna la empresa correcta', async () => {
        const mock = { IdEmpresa: 1, Nombre: 'CARSIL SAC' };
        db.query.mockResolvedValue([[mock]]);

        const resultado = await Empresa.getById(1);
        expect(resultado).toEqual(mock);
        expect(db.query).toHaveBeenCalledWith('SELECT * FROM EMPRESA WHERE IdEmpresa = ?', [1]);
    });

    test('retorna undefined si no existe', async () => {
        db.query.mockResolvedValue([[]]);
        const resultado = await Empresa.getById(999);
        expect(resultado).toBeUndefined();
    });
});

describe('Empresa.create()', () => {
    test('inserta la empresa y retorna su ID', async () => {
        db.execute.mockResolvedValue([{ insertId: 3 }]);

        const datos = { Nombre: 'Nueva SA', RUC: '20999999999', Direccion: 'Av. Lima 100' };
        const id = await Empresa.create(datos);

        expect(id).toBe(3);
        expect(db.execute).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO EMPRESA'),
            expect.arrayContaining(['Nueva SA', '20999999999'])
        );
    });

    test('lanza error si falla la inserción', async () => {
        db.execute.mockRejectedValue(new Error('DB error'));
        await expect(Empresa.create({ Nombre: 'X', RUC: '1', Direccion: 'Y' })).rejects.toThrow('DB error');
    });
});

describe('Empresa.update()', () => {
    test('lanza error si Nombre es vacío', async () => {
        await expect(Empresa.update(1, { Nombre: '' })).rejects.toThrow('El nombre de la empresa es requerido');
    });

    test('lanza error si RUC es vacío', async () => {
        await expect(Empresa.update(1, { Nombre: 'Test', RUC: '' })).rejects.toThrow('El RUC es requerido');
    });
});
