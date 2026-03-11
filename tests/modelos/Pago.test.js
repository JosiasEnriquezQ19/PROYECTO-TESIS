jest.mock('../../src/bd/conexion');

const db = require('../../src/bd/conexion');
const Pago = require('../../src/modelos/Pago');

beforeEach(() => jest.clearAllMocks());

describe('Pago.create()', () => {
    test('inserta el pago y retorna el ID', async () => {
        db.execute.mockResolvedValue([{ insertId: 20 }]);

        const datos = {
            IdEmpleado: 1, Semana: 10, Anio: 2026, FechaInicio: '2026-03-02', FechaFin: '2026-03-08',
            HorasTrabajadas: 40, SueldoSemanal: 375, TotalPago: 375
        };

        const id = await Pago.create(datos);
        expect(id).toBe(20);
        expect(db.execute).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO PAGO'),
            expect.arrayContaining([1, 10, 2026, 375])
        );
    });

    test('usa valores por defecto para Estado y MetodoPago', async () => {
        db.execute.mockResolvedValue([{ insertId: 21 }]);
        const datos = { IdEmpleado: 2, Semana: 11, Anio: 2026, FechaInicio: '2026-03-09', FechaFin: '2026-03-15', HorasTrabajadas: 40, SueldoSemanal: 400, TotalPago: 400 };
        await Pago.create(datos);
        expect(db.execute).toHaveBeenCalledWith(expect.anything(), expect.arrayContaining(['PENDIENTE', 'TRANSFERENCIA']));
    });
});

describe('Pago.getAll()', () => {
    test('retorna todos los pagos con nombre de empleado', async () => {
        const mock = [{ IdPago: 1, NombreEmpleado: 'Ana Torres', TotalPago: 375 }];
        db.query.mockResolvedValue([mock]);

        const resultado = await Pago.getAll();
        expect(resultado).toEqual(mock);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('JOIN EMPLEADO'));
    });
});

describe('Pago.getById()', () => {
    test('retorna el pago correcto', async () => {
        const mock = { IdPago: 5, NombreEmpleado: 'Pedro Gómez', TotalPago: 450 };
        db.query.mockResolvedValue([[mock]]);

        const resultado = await Pago.getById(5);
        expect(resultado).toEqual(mock);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE p.IdPago = ?'), [5]);
    });
});

describe('Pago.update()', () => {
    test('actualiza los campos dinámicamente y retorna filas afectadas', async () => {
        db.query.mockResolvedValue([{ affectedRows: 1 }]);

        const filas = await Pago.update(5, { Estado: 'PAGADO', FechaPago: '2026-03-10' });
        expect(filas).toBe(1);
        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE PAGO SET'),
            expect.arrayContaining(['PAGADO', '2026-03-10', 5])
        );
    });
});

describe('Pago.delete()', () => {
    test('elimina el pago y retorna filas afectadas', async () => {
        db.query.mockResolvedValue([{ affectedRows: 1 }]);
        const filas = await Pago.delete(8);
        expect(filas).toBe(1);
        expect(db.query).toHaveBeenCalledWith('DELETE FROM PAGO WHERE IdPago = ?', [8]);
    });
});
