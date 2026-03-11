const menuControlador = require('../../src/controladores/menuControlador');
const pool = require('../../src/bd/conexion');
const Producto = require('../../src/modelos/Producto');
const Auditoria = require('../../src/modelos/Auditoria');

jest.mock('../../src/bd/conexion', () => ({
    query: jest.fn()
}));
jest.mock('../../src/modelos/Producto');
jest.mock('../../src/modelos/Auditoria');

describe('Menu Controlador (Dashboard)', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        
        req = {
            query: {}
        };
        
        res = {
            render: jest.fn()
        };

        // Mock base para pool.query que devuelva arrays vacíos por defecto
        pool.query.mockResolvedValue([[]]);
        
        // Mocks base para modelos
        Producto.listarStockBajo.mockResolvedValue([]);
        Auditoria.listarRecientes.mockResolvedValue([]);
    });

    describe('mostrarMenu', () => {
        it('debe renderizar el menú principal con las estadísticas por defecto', async () => {
            await menuControlador.mostrarMenu(req, res);
            
            expect(res.render).toHaveBeenCalledWith('menu/principal', expect.objectContaining({
                estadisticas: expect.any(Object),
                actividadSemanal: expect.any(String),
                actividadMensual: expect.any(String),
                proformasRecientes: expect.any(Array),
                estadosProformas: expect.any(String),
                totalFacturas: expect.any(Number),
                auditoriaReciente: expect.any(Array),
                productosStockBajo: expect.any(Array),
                periodo: 'todo'
            }));
        });

        it('debe manejar los datos estadísticos correctamente', async () => {
            // Configurar respuestas específicas para las consultas iterativas
            pool.query
                // 1. Clientes
                .mockResolvedValueOnce([[{ t: 150 }]])
                // 2. Empleados
                .mockResolvedValueOnce([[{ t: 10 }]])
                // 3. Proformas
                .mockResolvedValueOnce([[{ t: 250 }]])
                // 4. Productos
                .mockResolvedValueOnce([[{ t: 100 }]])
                // 5. Actividad Semanal
                .mockResolvedValueOnce([[{ dia: 2, total: 5 }, { dia: 3, total: 3 }]])
                // 6. Actividad Mensual
                .mockResolvedValueOnce([[{ mesNombre: 'Ene', total: 20 }]])
                // 7. Proformas Recientes
                .mockResolvedValueOnce([[{ IdProforma: 1, Codigo: 'PRF-001' }]])
                // 8. Estados Proformas
                .mockResolvedValueOnce([[{ Estado: 'PENDIENTE', total: 5 }, { Estado: 'APROBADA', total: 10 }]])
                // 9. Total Facturas
                .mockResolvedValueOnce([[{ total: 50 }]]);

            await menuControlador.mostrarMenu(req, res);
            
            expect(res.render).toHaveBeenCalledWith('menu/principal', expect.objectContaining({
                estadisticas: { clientes: 150, empleados: 10, proformas: 250, productos: 100 },
                totalFacturas: 50
            }));
            
            // Verificar que los datos JSON fueron serializados correctamente
            const renderCalls = res.render.mock.calls[0][1];
            expect(renderCalls.actividadSemanal).toContain('5'); // Total del Lunes (dia 2)
            expect(renderCalls.actividadMensual).toContain('Ene');
            expect(renderCalls.estadosProformas).toContain('5'); // pendientes
        });

        it('debe procesar correctamente los filtros por periodo', async () => {
            req.query.periodo = 'trimestre';
            
            await menuControlador.mostrarMenu(req, res);
            
            // Verificar que se haya inyectado el filtro en alguna de las consultas
            const queryInvocations = pool.query.mock.calls;
            const tieneFiltro = queryInvocations.some(call => 
                call[0].includes('INTERVAL 3 MONTH')
            );
            
            expect(tieneFiltro).toBe(true);
            expect(res.render).toHaveBeenCalledWith('menu/principal', expect.objectContaining({
                periodo: 'trimestre'
            }));
        });

        it('debe manejar el bloque de catch global generalizando una respuesta vacía', async () => {
            // Forzar un error no en una consulta, sino un error irrecuperable de sintaxis si existiera
            // o simplemente haciendo que uno de los mocks lance el error hacia arriba.
            // Una forma fácil de forzar un error en el bloque try global:
            req.query = null; // Esto causará un error en: req.query.periodo || 'todo'
            
            await menuControlador.mostrarMenu(req, res);
            
            // Comprobamos que res.render se llamó en el bloque catch
            expect(res.render).toHaveBeenCalledWith('menu/principal', expect.objectContaining({
                estadisticas: { clientes: 0, empleados: 0, proformas: 0, productos: 0 }
            }));
        });
    });
});
