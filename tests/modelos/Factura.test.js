// Factura usa métodos de instancia y this.conexion.execute() / getConnection()
// Se mockea la conexión directamente en el objeto instanciado

jest.mock('../../src/bd/conexion', () => ({
    execute: jest.fn(),
    getConnection: jest.fn()
}));

const conexion = require('../../src/bd/conexion');
const Factura = require('../../src/modelos/Factura');

let factura;

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    factura = new Factura();
});

afterEach(() => {
    console.error.mockRestore();
    console.log.mockRestore();
});

// ─────────────────────────────────────────────
// factura.listar()
// ─────────────────────────────────────────────
describe('Factura.listar()', () => {
    test('retorna todas las facturas con datos relacionados', async () => {
        const facturasMock = [
            { IdFactura: 1, Codigo: 'FAC-001', ClienteNombre: 'Empresa SA', Total: 1180 },
            { IdFactura: 2, Codigo: 'FAC-002', ClienteNombre: 'Comercial XYZ', Total: 590 }
        ];
        conexion.execute.mockResolvedValue([facturasMock]);

        const resultado = await factura.listar();

        expect(resultado).toEqual(facturasMock);
        expect(conexion.execute).toHaveBeenCalledWith(
            expect.stringContaining('FROM FACTURA f')
        );
    });

    test('lanza error si falla la consulta', async () => {
        conexion.execute.mockRejectedValue(new Error('DB timeout'));

        await expect(factura.listar()).rejects.toThrow('DB timeout');
    });
});

// ─────────────────────────────────────────────
// factura.obtenerPorId()
// ─────────────────────────────────────────────
describe('Factura.obtenerPorId()', () => {
    test('retorna null si la factura no existe', async () => {
        conexion.execute.mockResolvedValueOnce([[]]); // query factura → sin resultados

        const resultado = await factura.obtenerPorId(999);

        expect(resultado).toBeNull();
    });

    test('retorna factura con detalles vacíos si no hay detalles en BD', async () => {
        const facturaMock = { IdFactura: 1, Codigo: 'FAC-001', Total: 1180 };

        // Primera llamada: query de factura principal
        conexion.execute
            .mockResolvedValueOnce([[facturaMock]])         // obtener factura
            .mockResolvedValueOnce([[{ total: 0 }]]);       // verificación de detalles → 0

        const resultado = await factura.obtenerPorId(1);

        expect(resultado).toEqual({
            factura: facturaMock,
            detalles: []
        });
    });

    test('retorna factura con sus detalles cuando existen', async () => {
        const facturaMock = { IdFactura: 1, Codigo: 'FAC-001', Total: 1180 };
        const detallesMock = [
            { IdDetalleFactura: 1, ProductoNombre: 'Cable HDMI', Cantidad: 2, Total: 60 }
        ];

        conexion.execute
            .mockResolvedValueOnce([[facturaMock]])          // factura principal
            .mockResolvedValueOnce([[{ total: 1 }]])         // verificación: 1 detalle
            .mockResolvedValueOnce([detallesMock]);          // detalles completos

        const resultado = await factura.obtenerPorId(1);

        expect(resultado.factura).toEqual(facturaMock);
        expect(resultado.detalles).toEqual(detallesMock);
    });

    test('lanza error si falla la consulta', async () => {
        conexion.execute.mockRejectedValue(new Error('DB error'));

        await expect(factura.obtenerPorId(1)).rejects.toThrow('DB error');
    });
});

// ─────────────────────────────────────────────
// factura.crear() — validaciones sin tocar BD
// ─────────────────────────────────────────────
describe('Factura.crear() — validación de proforma', () => {
    let connMock;

    beforeEach(() => {
        connMock = {
            beginTransaction: jest.fn().mockResolvedValue(),
            execute: jest.fn(),
            commit: jest.fn().mockResolvedValue(),
            rollback: jest.fn().mockResolvedValue(),
            release: jest.fn()
        };
        conexion.getConnection.mockResolvedValue(connMock);
    });

    test('lanza error si la proforma no existe', async () => {
        connMock.execute.mockResolvedValueOnce([[]]); // proforma no encontrada

        const datos = { IdProforma: 99, IdUsuario: 1, IdCliente: 1, IdEmpresa: 1 };

        await expect(factura.crear(datos, [])).rejects.toThrow('La proforma especificada no existe');
        expect(connMock.rollback).toHaveBeenCalled();
    });

    test('lanza error si la proforma no está APROBADA', async () => {
        connMock.execute.mockResolvedValueOnce([[{ Estado: 'PENDIENTE' }]]);

        const datos = { IdProforma: 1, IdUsuario: 1, IdCliente: 1, IdEmpresa: 1 };

        await expect(factura.crear(datos, [])).rejects.toThrow(
            'Solo se pueden generar facturas de proformas aprobadas'
        );
        expect(connMock.rollback).toHaveBeenCalled();
    });
});
