jest.mock('../../src/bd/conexion');
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

const conexion = require('../../src/bd/conexion');
const Proforma = require('../../src/modelos/Proforma');

beforeEach(() => jest.clearAllMocks());
afterAll(() => { console.log.mockRestore(); console.error.mockRestore(); });

describe('Proforma.contarProformas()', () => {
    test('retorna el total de proformas', async () => {
        conexion.query.mockResolvedValue([[{ total: 25 }]]);
        const total = await Proforma.contarProformas();
        expect(total).toBe(25);
        expect(conexion.query).toHaveBeenCalledWith('SELECT COUNT(*) as total FROM PROFORMA');
    });

    test('lanza error si falla la consulta', async () => {
        conexion.query.mockRejectedValue(new Error('DB error'));
        await expect(Proforma.contarProformas()).rejects.toThrow('DB error');
    });
});

describe('Proforma.obtenerEstadisticasEstados()', () => {
    test('retorna estadisticas agrupadas por estado', async () => {
        const mock = [
            { Estado: 'PENDIENTE', cantidad: 10, total_monto: 5000, porcentaje: 40 },
            { Estado: 'APROBADA', cantidad: 15, total_monto: 8000, porcentaje: 60 }
        ];
        conexion.query.mockResolvedValue([mock]);

        const resultado = await Proforma.obtenerEstadisticasEstados();
        expect(resultado).toEqual(mock);
        expect(conexion.query).toHaveBeenCalledWith(expect.stringContaining('GROUP BY Estado'));
    });
});

describe('Proforma.generarCodigo()', () => {
    test('genera PROF-001 cuando no hay proformas', async () => {
        conexion.query
            .mockResolvedValueOnce([[{ total: 0 }]])   // COUNT REGEXP
            .mockResolvedValueOnce([[{ existe: 0 }]]); // CHECK existencia

        const codigo = await Proforma.generarCodigo();
        expect(codigo).toBe('PROF-001');
    });

    test('genera PROF-026 cuando ya existen 25', async () => {
        conexion.query
            .mockResolvedValueOnce([[{ total: 25 }]])  // COUNT
            .mockResolvedValueOnce([[{ existe: 0 }]]); // CHECK

        const codigo = await Proforma.generarCodigo();
        expect(codigo).toBe('PROF-026');
    });

    test('busca el MAX cuando el código ya existe', async () => {
        conexion.query
            .mockResolvedValueOnce([[{ total: 5 }]])   // COUNT
            .mockResolvedValueOnce([[{ existe: 1 }]])  // CHECK → ya existe
            .mockResolvedValueOnce([[{ maxNum: 7 }]]); // MAX

        const codigo = await Proforma.generarCodigo();
        expect(codigo).toBe('PROF-008');
    });

    test('usa fallback si falla la consulta', async () => {
        conexion.query.mockRejectedValue(new Error('DB error'));
        const codigo = await Proforma.generarCodigo();
        expect(codigo).toMatch(/^PROF-\d+$/);
    });
});

describe('Proforma.verificarProformasVencidas()', () => {
    test('retorna el número de proformas actualizadas', async () => {
        conexion.query.mockResolvedValue([{ affectedRows: 3 }]);
        const afectadas = await Proforma.verificarProformasVencidas();
        expect(afectadas).toBe(3);
        expect(conexion.query).toHaveBeenCalledWith(expect.stringContaining("Estado = 'VENCIDA'"));
    });
});
