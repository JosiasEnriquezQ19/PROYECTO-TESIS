const Empleado = require('../../src/modelos/Empleado');
const db = require('../../src/bd/conexion');

jest.mock('../../src/bd/conexion', () => ({
    query: jest.fn()
}));

describe('Empleado Model', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('contarActivos', () => {
        it('debe retornar la cantidad de empleados activos', async () => {
            db.query.mockResolvedValue([[{ total: 3 }]]);
            
            const total = await Empleado.contarActivos();
            
            expect(db.query).toHaveBeenCalledWith(expect.stringContaining("WHERE Estado = 'ACTIVO'"));
            expect(total).toBe(3);
        });

        it('debe propagar el error si la db falla', async () => {
            db.query.mockRejectedValue(new Error('DB Error'));
            
            await expect(Empleado.contarActivos()).rejects.toThrow('DB Error');
        });
    });

    describe('getAll', () => {
        it('debe retornar todos los empleados con datos de usuario', async () => {
            const mockEmpleados = [{ IdEmpleado: 1, Nombres: 'Juan' }];
            db.query.mockResolvedValue([mockEmpleados]);
            
            const result = await Empleado.getAll();
            
            expect(db.query).toHaveBeenCalledWith(expect.stringContaining('JOIN USUARIO'));
            expect(result).toEqual(mockEmpleados);
        });
    });

    describe('getById', () => {
        it('debe retornar un empleado por su ID', async () => {
            const mockEmpleado = { IdEmpleado: 1, Nombres: 'Juan' };
            db.query.mockResolvedValue([[mockEmpleado]]);
            
            const result = await Empleado.getById(1);
            
            expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE e.IdEmpleado = ?'), [1]);
            expect(result).toEqual(mockEmpleado);
        });
    });

    describe('create', () => {
        it('debe crear un empleado y retornar su insertId', async () => {
            db.query.mockResolvedValue([{ insertId: 10 }]);
            
            const data = {
                IdUsuario: 2, Cargo: 'Ventas', Area: 'Comercial', FechaContratacion: '2023-01-01',
                TipoContrato: 'Fijo', SueldoBase: 1500, Banco: 'BCP', NumeroCuenta: '123',
                TipoCuenta: 'Ahorros', Estado: 'ACTIVO'
            };
            
            const insertId = await Empleado.create(data);
            
            expect(db.query).toHaveBeenCalledTimes(1);
            expect(db.query.mock.calls[0][1]).toEqual([
                2, 'Ventas', 'Comercial', '2023-01-01', 'Fijo', 1500, 'BCP', '123', 'Ahorros', 'ACTIVO'
            ]);
            expect(insertId).toBe(10);
        });
    });

    describe('update', () => {
        it('debe actualizar un empleado y retornar affectedRows', async () => {
            db.query.mockResolvedValue([{ affectedRows: 1 }]);
            
            const data = {
                Cargo: 'Gerente', Area: 'Admin', FechaContratacion: '2023-01-01',
                TipoContrato: 'Indefinido', SueldoBase: 3000, Banco: 'BBVA', NumeroCuenta: '456',
                TipoCuenta: 'Corriente', Estado: 'ACTIVO'
            };
            
            const affectedRows = await Empleado.update(1, data);
            
            expect(db.query).toHaveBeenCalledTimes(1);
            expect(affectedRows).toBe(1);
        });
    });

    describe('delete', () => {
        it('debe cambiar el estado a INACTIVO', async () => {
            db.query.mockResolvedValue([{ affectedRows: 1 }]);
            
            const affectedRows = await Empleado.delete(1);
            
            expect(db.query).toHaveBeenCalledWith(expect.stringContaining("SET Estado = 'INACTIVO' WHERE IdEmpleado = ?"), [1]);
            expect(affectedRows).toBe(1);
        });
    });
});
