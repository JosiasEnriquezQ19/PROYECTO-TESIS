const Auditoria = require('../../src/modelos/Auditoria');
const db = require('../../src/bd/conexion');

jest.mock('../../src/bd/conexion', () => ({
    query: jest.fn()
}));

describe('Auditoria Model', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('registrar', () => {
        it('debe registrar una entrada exitosamente con datos completos', async () => {
            db.query.mockResolvedValue([{ insertId: 1 }]);
            
            const data = {
                IdUsuario: 1,
                NombreUsuario: 'Admin',
                Modulo: 'USUARIOS',
                Accion: 'CREAR',
                Descripcion: 'Creó un usuario',
                IP: '192.168.1.1'
            };

            await Auditoria.registrar(data);

            expect(db.query).toHaveBeenCalledWith('INSERT INTO AUDITORIA SET ?', expect.objectContaining({
                IdUsuario: 1,
                NombreUsuario: 'Admin',
                Modulo: 'USUARIOS',
                Accion: 'CREAR',
                Descripcion: 'Creó un usuario',
                IP: '192.168.1.1',
                FechaHora: expect.any(Date)
            }));
        });

        it('debe registrar usando valores por defecto si faltan datos', async () => {
            db.query.mockResolvedValue([{ insertId: 2 }]);
            
            await Auditoria.registrar({});

            expect(db.query).toHaveBeenCalledWith('INSERT INTO AUDITORIA SET ?', expect.objectContaining({
                IdUsuario: null,
                NombreUsuario: 'Sistema',
                Modulo: 'SISTEMA',
                Accion: 'INFO',
                Descripcion: '',
                IP: null,
                FechaHora: expect.any(Date)
            }));
        });

        it('no debe lanzar error si la db falla (falla silenciosa de auditoría)', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            db.query.mockRejectedValue(new Error('DB connection lost'));
            
            await expect(Auditoria.registrar({})).resolves.not.toThrow();
            expect(consoleSpy).toHaveBeenCalledWith('[Auditoria] Error al registrar:', 'DB connection lost');
            
            consoleSpy.mockRestore();
        });
    });

    describe('listarRecientes', () => {
        it('debe listar los registros más recientes limitados por el parámetro', async () => {
            const mockRows = [{ IdAuditoria: 1, Accion: 'LOGIN' }];
            db.query.mockResolvedValue([mockRows]);

            const limit = 5;
            const result = await Auditoria.listarRecientes(limit);

            expect(db.query).toHaveBeenCalledWith(expect.stringContaining('LIMIT ?'), [limit]);
            expect(result).toEqual(mockRows);
        });

        it('debe usar límite 15 por defecto', async () => {
            db.query.mockResolvedValue([[]]);
            
            await Auditoria.listarRecientes();
            
            expect(db.query).toHaveBeenCalledWith(expect.stringContaining('LIMIT ?'), [15]);
        });
    });

    describe('listar', () => {
        it('debe retornar lista paginada y totales sin filtros', async () => {
            db.query
                .mockResolvedValueOnce([[{ total: 100 }]]) // COUNT
                .mockResolvedValueOnce([[{ IdAuditoria: 1 }]]); // SELECT
                
            const result = await Auditoria.listar();

            expect(db.query).toHaveBeenCalledTimes(2);
            expect(result).toEqual({
                rows: [{ IdAuditoria: 1 }],
                total: 100,
                paginas: 2 // 100 / 50 (limite por defecto)
            });
        });

        it('debe aplicar filtros y paginación correcta', async () => {
            db.query
                .mockResolvedValueOnce([[{ total: 10 }]])
                .mockResolvedValueOnce([[{ IdAuditoria: 1 }]]);
                
            const result = await Auditoria.listar({
                pagina: 2,
                limite: 10,
                modulo: 'VENTAS',
                accion: 'ELIMINAR',
                busqueda: 'admin'
            });

            // Verificar query de COUNT
            expect(db.query.mock.calls[0][0]).toContain('WHERE Modulo = ? AND Accion = ? AND (NombreUsuario LIKE ? OR Descripcion LIKE ?)');
            expect(db.query.mock.calls[0][1]).toEqual(['VENTAS', 'ELIMINAR', '%admin%', '%admin%']);
            
            // Verificar query de SELECT
            const selectQuery = db.query.mock.calls[1][0];
            expect(selectQuery).toContain('LIMIT 10 OFFSET 10');
            
            expect(result.paginas).toBe(1);
        });
    });

    describe('obtenerFiltros', () => {
        it('debe retornar modulos y acciones extraidos de la BD', async () => {
            db.query
                .mockResolvedValueOnce([[{ Modulo: 'VENTAS' }, { Modulo: 'COMPRAS' }]])
                .mockResolvedValueOnce([[{ Accion: 'CREAR' }, { Accion: 'ELIMINAR' }]]);
                
            const result = await Auditoria.obtenerFiltros();
            
            expect(result).toEqual({
                modulos: ['VENTAS', 'COMPRAS'],
                acciones: ['CREAR', 'ELIMINAR']
            });
        });
    });
});
