jest.mock('../../src/bd/conexion');

const db = require('../../src/bd/conexion');
const Empleado = require('../../src/modelos/Empleado');

beforeEach(() => jest.clearAllMocks());

describe('Empleado.contarActivos()', () => {
    test('retorna el total de empleados activos', async () => {
        db.query.mockResolvedValue([[{ total: 12 }]]);
        const total = await Empleado.contarActivos();
        expect(total).toBe(12);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining("Estado = 'ACTIVO'"));
    });
});

describe('Empleado.getAll()', () => {
    test('retorna todos los empleados con datos de usuario', async () => {
        const mock = [{ IdEmpleado: 1, Nombres: 'Juan', Cargo: 'Vendedor' }];
        db.query.mockResolvedValue([mock]);

        const resultado = await Empleado.getAll();
        expect(resultado).toEqual(mock);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('JOIN USUARIO'));
    });
});

describe('Empleado.getById()', () => {
    test('retorna el empleado correcto con sus datos de usuario', async () => {
        const mock = { IdEmpleado: 3, Nombres: 'Carlos', Cargo: 'Supervisor' };
        db.query.mockResolvedValue([[mock]]);

        const resultado = await Empleado.getById(3);
        expect(resultado).toEqual(mock);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE e.IdEmpleado = ?'), [3]);
    });

    test('retorna undefined si no existe', async () => {
        db.query.mockResolvedValue([[]]);
        const resultado = await Empleado.getById(999);
        expect(resultado).toBeUndefined();
    });
});

describe('Empleado.create()', () => {
    test('inserta el empleado y retorna su ID', async () => {
        db.query.mockResolvedValue([{ insertId: 8 }]);
        const datos = {
            IdUsuario: 5, Cargo: 'Técnico', Area: 'Sistemas',
            FechaContratacion: '2026-01-01', TipoContrato: 'INDEFINIDO',
            SueldoBase: 1500, Banco: 'BCP', NumeroCuenta: '123456', TipoCuenta: 'AHORROS', Estado: 'ACTIVO'
        };
        const id = await Empleado.create(datos);
        expect(id).toBe(8);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO EMPLEADO'), expect.arrayContaining([5, 'Técnico', 1500]));
    });
});

describe('Empleado.update()', () => {
    test('actualiza el empleado correctamente', async () => {
        db.query.mockResolvedValue([{ affectedRows: 1 }]);
        const datos = {
            Cargo: 'Jefe de Área', Area: 'Ventas', FechaContratacion: '2025-06-01',
            TipoContrato: 'INDEFINIDO', SueldoBase: 2000, Banco: 'BBVA',
            NumeroCuenta: '789012', TipoCuenta: 'CORRIENTE', Estado: 'ACTIVO'
        };
        await Empleado.update(3, datos);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE EMPLEADO SET'), expect.arrayContaining([3]));
    });
});
