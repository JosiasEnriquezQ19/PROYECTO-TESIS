jest.mock('../../src/bd/conexion');

const db = require('../../src/bd/conexion');
const Remuneracion = require('../../src/modelos/Remuneracion');

beforeEach(() => jest.clearAllMocks());

describe('Remuneracion.getAll()', () => {
    test('retorna todas las remuneraciones con nombre de empleado', async () => {
        const mock = [{ IdRemuneracion: 1, Empleado: 'Ana García', Total: 1800 }];
        db.query.mockResolvedValue([mock]);

        const resultado = await Remuneracion.getAll();
        expect(resultado).toEqual(mock);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('JOIN USUARIO'));
    });
});

describe('Remuneracion.getById()', () => {
    test('retorna la remuneracion correcta', async () => {
        const mock = { IdRemuneracion: 2, Total: 2000 };
        db.query.mockResolvedValue([[mock]]);

        const resultado = await Remuneracion.getById(2);
        expect(resultado).toEqual(mock);
    });

    test('retorna undefined si no existe', async () => {
        db.query.mockResolvedValue([[]]);
        const resultado = await Remuneracion.getById(999);
        expect(resultado).toBeUndefined();
    });
});

describe('Remuneracion.create()', () => {
    test('inserta la remuneracion con los campos correctos', async () => {
        db.query.mockResolvedValue([{ insertId: 10 }]);

        const datos = {
            IdUsuario: 1, Periodo: '2026-01', FechaInicio: '2026-01-01',
            FechaFin: '2026-01-31', SueldoBase: 1500, Total: 1500, Estado: 'PENDIENTE'
        };

        const resultado = await Remuneracion.create(datos);
        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO REMUNERACION'),
            expect.arrayContaining([1, '2026-01', 1500])
        );
        expect(resultado).toEqual({ insertId: 10 });
    });

    test('usa valores por defecto para Bonificaciones y Descuentos', async () => {
        db.query.mockResolvedValue([{ insertId: 11 }]);
        const datos = { IdUsuario: 1, Periodo: '2026-02', FechaInicio: '2026-02-01', FechaFin: '2026-02-28', SueldoBase: 1200, Total: 1200 };
        await Remuneracion.create(datos);
        // Bonificaciones=0, Descuentos=0, Estado='PENDIENTE'
        expect(db.query).toHaveBeenCalledWith(expect.anything(), expect.arrayContaining([0, 0, 'PENDIENTE']));
    });
});

describe('Remuneracion.update()', () => {
    test('actualiza la remuneracion correctamente', async () => {
        db.query.mockResolvedValue([{ affectedRows: 1 }]);
        const datos = { IdUsuario: 1, Periodo: '2026-01', FechaInicio: '2026-01-01', FechaFin: '2026-01-31', SueldoBase: 1600, Total: 1600, Estado: 'PAGADO' };
        await Remuneracion.update(5, datos);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE REMUNERACION'), expect.arrayContaining([5]));
    });
});

describe('Remuneracion.delete()', () => {
    test('elimina la remuneracion', async () => {
        db.query.mockResolvedValue([{ affectedRows: 1 }]);
        const resultado = await Remuneracion.delete(7);
        expect(db.query).toHaveBeenCalledWith('DELETE FROM REMUNERACION WHERE IdRemuneracion = ?', [7]);
        expect(resultado).toEqual({ affectedRows: 1 });
    });
});
