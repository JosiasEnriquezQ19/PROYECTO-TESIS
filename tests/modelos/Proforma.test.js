const Proforma = require('../../src/modelos/Proforma');
const conexion = require('../../src/bd/conexion');

// Mockear conexion.getConnection y conexion.query
const mockConnection = {
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn(),
    query: jest.fn()
};

jest.mock('../../src/bd/conexion', () => ({
    query: jest.fn(),
    getConnection: jest.fn(() => mockConnection)
}));

describe('Proforma Model', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup por defecto para las querys simuladas en transacciones
        mockConnection.query.mockResolvedValue([{ insertId: 1, affectedRows: 1 }]);
    });

    describe('verificarProformasVencidas', () => {
        it('debe actualizar el estado de las proformas vencidas', async () => {
            conexion.query.mockResolvedValue([{ affectedRows: 5 }]);
            const res = await Proforma.verificarProformasVencidas();
            expect(conexion.query).toHaveBeenCalledWith(expect.stringContaining("SET Estado = 'VENCIDA'"));
            expect(res).toBe(5);
        });

        it('debe lanzar error si falla query', async () => {
            conexion.query.mockRejectedValue(new Error('DB error'));
            await expect(Proforma.verificarProformasVencidas()).rejects.toThrow('DB error');
        });
    });

    describe('contarProformas', () => {
        it('debe contar total de proformas', async () => {
            conexion.query.mockResolvedValue([[{ total: 100 }]]);
            const total = await Proforma.contarProformas();
            expect(total).toBe(100);
        });
    });

    describe('obtenerEstadisticasEstados', () => {
        it('debe retornar estadisticas agrupadas', async () => {
            conexion.query.mockResolvedValue([[{ Estado: 'PENDIENTE', cantidad: 10 }]]);
            const res = await Proforma.obtenerEstadisticasEstados();
            expect(res).toEqual([{ Estado: 'PENDIENTE', cantidad: 10 }]);
        });
    });

    describe('obtenerProformasVencidas', () => {
        it('debe listar solo proformas vencidas sin factura', async () => {
            conexion.query.mockResolvedValue([[{ IdProforma: 1 }]]);
            const res = await Proforma.obtenerProformasVencidas();
            expect(conexion.query).toHaveBeenCalledWith(expect.stringContaining('f.IdFactura IS NULL'));
            expect(res).toEqual([{ IdProforma: 1 }]);
        });
    });

    describe('generarCodigo', () => {
        it('debe generar PROF-001 si no hay registros', async () => {
            conexion.query
                .mockResolvedValueOnce([[{ total: 0 }]]) // COUNT PROF-
                .mockResolvedValueOnce([[{ existe: 0 }]]); // Check no existe
            
            const codigo = await Proforma.generarCodigo();
            expect(codigo).toBe('PROF-001');
        });

        it('debe generar el siguiente basandose en la sumatoria si ya existe uno borrado', async () => {
            conexion.query
                .mockResolvedValueOnce([[{ total: 1 }]]) 
                .mockResolvedValueOnce([[{ existe: 1 }]]) 
                .mockResolvedValueOnce([[{ maxNum: 5 }]]); 
            
            const codigo = await Proforma.generarCodigo();
            expect(codigo).toBe('PROF-006');
        });

        it('debe dar fallback string estilo PROF-xxxx si falla DB', async () => {
            conexion.query.mockRejectedValue(new Error('db down'));
            const codigo = await Proforma.generarCodigo();
            expect(codigo).toMatch(/^PROF-\d{4}$/);
        });
    });

    describe('listar', () => {
        it('debe obtener y formatear el listado principal de proformas junto a sus detalles y estado visual', async () => {
            // Mock principal list
            const hoy = new Date();
            const fechaAntigua = new Date(hoy);
            fechaAntigua.setDate(hoy.getDate() - 20); // Vencida
            
            conexion.query
                .mockResolvedValueOnce([[{ IdProforma: 1, FechaEmision: fechaAntigua.toISOString(), ValidezOferta: 10, Estado: 'PENDIENTE' }]])
                .mockResolvedValueOnce([[{ IdProducto: 2 }]]); // Detalles
                
            const res = await Proforma.listar();
            
            expect(res[0].EstadoVisual).toBe('VENCIDA');
            expect(res[0].detalle).toEqual([{ IdProducto: 2 }]);
        });
    });

    describe('crear', () => {
        const mockData = {
            Codigo: 'PR-1', IdUsuario: 1, IdCliente: 1, FechaEmision: '2023',
            SubTotal: 100, TotalIGV: 18, Total: 118,
            detalle: [{ IdProducto: 1, Cantidad: 1, PrecioUnitario: 100 }]
        };

        it('debe ejecutar transaccion para crear proforma', async () => {
            await Proforma.crear(mockData);
            
            expect(mockConnection.beginTransaction).toHaveBeenCalled();
            expect(mockConnection.query).toHaveBeenCalledTimes(2); // 1 prof + 1 detalle
            expect(mockConnection.commit).toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalled();
        });

        it('debe hacer rollback si falla', async () => {
            mockConnection.query.mockRejectedValueOnce(new Error('fail prof'));
            
            await expect(Proforma.crear(mockData)).rejects.toThrow('fail prof');
            
            expect(mockConnection.rollback).toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalled();
        });
    });

    describe('obtenerPorId', () => {
        it('debe obtener proforma con cabecera y detalle y calcular EstadoVisual', async () => {
            const hoy = new Date();
            const fechaReciente = new Date(hoy);
            fechaReciente.setDate(hoy.getDate() - 2); // Apenas 2 dias (No Vencida)
            
            conexion.query
                .mockResolvedValueOnce([[{ IdProforma: 1, FechaEmision: fechaReciente.toISOString(), ValidezOferta: 10, Estado: 'PENDIENTE' }]])
                .mockResolvedValueOnce([[{ IdProducto: 5 }]]);
                
            const res = await Proforma.obtenerPorId(1);
            
            expect(res.EstadoVisual).toBe('PENDIENTE');
            expect(res.detalle).toEqual([{ IdProducto: 5 }]);
        });

        it('debe retornar null si no existe', async () => {
            conexion.query.mockResolvedValueOnce([[]]);
            const res = await Proforma.obtenerPorId(99);
            expect(res).toBeNull();
        });
    });

    describe('actualizar', () => {
        const mockDataUpdate = {
            Codigo: 'PR-1',
            detalle: [{ IdProducto: 2, Cantidad: 2, PrecioUnitario: 50 }]
        };

        it('debe actualizar proforma en transaccion (update, delete detalle, insert nuevo detalle)', async () => {
            await Proforma.actualizar(1, mockDataUpdate);
            
            expect(mockConnection.beginTransaction).toHaveBeenCalled();
            expect(mockConnection.query).toHaveBeenCalledTimes(3); 
            expect(mockConnection.commit).toHaveBeenCalled();
            expect(mockConnection.release).toHaveBeenCalled();
        });

        it('debe hacer rollback en caso de fallo al actualizar', async () => {
            mockConnection.query.mockRejectedValueOnce(new Error('error en update'));
            
            await expect(Proforma.actualizar(1, mockDataUpdate)).rejects.toThrow('error en update');
            expect(mockConnection.rollback).toHaveBeenCalled();
        });
    });

    describe('eliminar', () => {
        it('debe anular proforma en vez de borrarla fisicamente', async () => {
            conexion.query.mockResolvedValue([{ affectedRows: 1 }]);
            await Proforma.eliminar(1);
            expect(conexion.query).toHaveBeenCalledWith(expect.stringContaining("Estado = 'ANULADA'"), [1]);
        });
    });

    describe('obtenerPorCodigo', () => {
        it('debe encontrar proforma y retornar objeto proforma+detalles', async () => {
            conexion.query
                .mockResolvedValueOnce([[{ IdProforma: 1, Codigo: 'PRF-A' }]])
                .mockResolvedValueOnce([[{ IdProducto: 1 }]]);
                
            const res = await Proforma.obtenerPorCodigo('PRF-A');
            expect(res.proforma.Codigo).toBe('PRF-A');
            expect(res.detalles.length).toBe(1);
        });

        it('debe retornar null si codigo no existe', async () => {
            conexion.query.mockResolvedValueOnce([[]]);
            const res = await Proforma.obtenerPorCodigo('NOEXISTE');
            expect(res).toBeNull();
        });
    });
});
