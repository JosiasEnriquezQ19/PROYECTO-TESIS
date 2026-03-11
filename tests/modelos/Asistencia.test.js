jest.mock('../../src/bd/conexion');
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});

const db = require('../../src/bd/conexion');
const Asistencia = require('../../src/modelos/Asistencia');

beforeEach(() => jest.clearAllMocks());
afterAll(() => { console.log.mockRestore(); console.error.mockRestore(); console.warn.mockRestore(); });

describe('Asistencia.create()', () => {
    test('inserta el registro y retorna el ID', async () => {
        db.execute.mockResolvedValue([{ insertId: 99 }]);

        const datos = {
            IdEmpleado: 3, Fecha: '2026-03-11', HoraEntrada: '08:00:00',
            HoraSalida: null, Estado: 'PRESENTE', TipoAsistencia: 'REGULAR', JornadaLaboral: 'COMPLETA'
        };

        const id = await Asistencia.create(datos);
        expect(id).toBe(99);
        expect(db.execute).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO ASISTENCIA'),
            expect.arrayContaining([3, '2026-03-11', '08:00:00'])
        );
    });

    test('usa el estado PRESENTE por defecto', async () => {
        db.execute.mockResolvedValue([{ insertId: 100 }]);
        await Asistencia.create({ IdEmpleado: 1, Fecha: '2026-03-11', HoraEntrada: '09:00:00' });
        expect(db.execute).toHaveBeenCalledWith(expect.anything(), expect.arrayContaining(['PRESENTE']));
    });
});

describe('Asistencia.getById()', () => {
    test('retorna la asistencia correcta', async () => {
        const mock = { IdAsistencia: 5, Fecha: '2026-03-11', NombreCompleto: 'Juan Pérez' };
        db.execute.mockResolvedValue([[mock]]);

        const resultado = await Asistencia.getById(5);
        expect(resultado).toEqual(mock);
        expect(db.execute).toHaveBeenCalledWith(expect.stringContaining('WHERE a.IdAsistencia = ?'), [5]);
    });

    test('retorna undefined si no existe', async () => {
        db.execute.mockResolvedValue([[]]);
        const resultado = await Asistencia.getById(999);
        expect(resultado).toBeUndefined();
    });
});

describe('Asistencia.update()', () => {
    test('actualiza los campos especificados dinámicamente', async () => {
        db.execute.mockResolvedValue([{ affectedRows: 1 }]);

        const filas = await Asistencia.update(10, { HoraSalida: '17:00:00', JornadaLaboral: 'COMPLETA' });

        expect(filas).toBe(1);
        expect(db.execute).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE ASISTENCIA SET'),
            expect.arrayContaining(['17:00:00', 'COMPLETA', 10])
        );
    });
});

describe('Asistencia.delete()', () => {
    test('elimina el registro y retorna filas afectadas', async () => {
        db.execute.mockResolvedValue([{ affectedRows: 1 }]);
        const filas = await Asistencia.delete(7);
        expect(filas).toBe(1);
        expect(db.execute).toHaveBeenCalledWith('DELETE FROM ASISTENCIA WHERE IdAsistencia = ?', [7]);
    });
});

describe('Asistencia.checkDuplicate()', () => {
    test('retorna true si ya existe un registro para el empleado y fecha', async () => {
        db.execute.mockResolvedValue([[{ count: 1 }]]);
        const existe = await Asistencia.checkDuplicate(3, '2026-03-11');
        expect(existe).toBe(true);
    });

    test('retorna false si no hay duplicado', async () => {
        db.execute.mockResolvedValue([[{ count: 0 }]]);
        const existe = await Asistencia.checkDuplicate(3, '2026-03-12');
        expect(existe).toBe(false);
    });
});

describe('Asistencia.getEmpleados()', () => {
    test('retorna la lista de empleados activos', async () => {
        const mock = [{ IdEmpleado: 1, NombreCompleto: 'Ana Torres', Cargo: 'Vendedor' }];
        db.execute.mockResolvedValue([mock]);

        const resultado = await Asistencia.getEmpleados();
        expect(resultado).toEqual(mock);
        expect(db.execute).toHaveBeenCalledWith(expect.stringContaining("Estado = 'ACTIVO'"));
    });
});
