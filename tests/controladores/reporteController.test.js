const reportesController = require('../../src/controladores/reporteController');
const Proforma = require('../../src/modelos/Proforma');
const conexion = require('../../src/bd/conexion');

jest.mock('../../src/modelos/Proforma');
jest.mock('../../src/modelos/Auditoria', () => ({
    listarRecientes: jest.fn()
}));
jest.mock('../../src/bd/conexion', () => ({
    query: jest.fn()
}));

describe('Reportes Controller', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            query: {},
            session: {
                usuario: { id: 1, nombre: 'Admin' }
            }
        };

        res = {
            render: jest.fn(),
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };
    });

    describe('mostrarReportes', () => {
        it('debe renderizar el dashboard de reportes verificando proformas vencidas', async () => {
            Proforma.verificarProformasVencidas.mockResolvedValue(true);

            await reportesController.mostrarReportes(req, res);

            expect(Proforma.verificarProformasVencidas).toHaveBeenCalled();
            expect(res.render).toHaveBeenCalledWith('reportes/dashboard', {
                user: req.session.usuario
            });
        });

        it('debe manejar errores al renderizar', async () => {
            Proforma.verificarProformasVencidas.mockRejectedValue(new Error('DB Error'));

            await reportesController.mostrarReportes(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith('Error interno del servidor: DB Error');
        });
    });

    describe('proformasPorMes', () => {
        it('debe devolver datos normalizados de proformas por mes', async () => {
            req.query.periodo = 'anio';

            const mockData = [
                { mes: '2023-01', cantidad: 5, total_ventas: '500.00' },
                { mes: '2023-02', cantidad: 3, total_ventas: '300.00' }
            ];

            conexion.query.mockResolvedValue([mockData]);

            await reportesController.proformasPorMes(req, res);

            expect(conexion.query).toHaveBeenCalledWith(expect.stringContaining('FROM PROFORMA'));
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: [
                    { mes: '2023-01', cantidad: 5, total_ventas: 500 },
                    { mes: '2023-02', cantidad: 3, total_ventas: 300 }
                ],
                count: 2
            });
        });

        it('debe consultar FACTURA si PROFORMA no tiene datos', async () => {
            conexion.query
                .mockResolvedValueOnce([[]])
                .mockResolvedValueOnce([[{ mes: '2023-01', cantidad: 1, total_ventas: '100.00' }]]);

            await reportesController.proformasPorMes(req, res);

            expect(conexion.query).toHaveBeenCalledTimes(2);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: [{ mes: '2023-01', cantidad: 1, total_ventas: 100 }],
                count: 1
            });
        });

        it('debe manejar errores en la consulta', async () => {
            conexion.query.mockRejectedValue(new Error('SQL Error'));

            await reportesController.proformasPorMes(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'SQL Error',
                data: []
            });
        });

        it('debe filtrar por mes', async () => {
            req.query.periodo = 'mes';
            conexion.query.mockResolvedValue([[{ mes: '2023-10', cantidad: 2, total_ventas: '200' }]]);
            await reportesController.proformasPorMes(req, res);
            expect(conexion.query).toHaveBeenCalledWith(expect.stringContaining('MONTH(FechaEmision) = MONTH(CURDATE())'));
        });

        it('debe filtrar por trimestre', async () => {
            req.query.periodo = 'trimestre';
            conexion.query.mockResolvedValue([[{ mes: '2023-09', cantidad: 1, total_ventas: '100' }]]);
            await reportesController.proformasPorMes(req, res);
            expect(conexion.query).toHaveBeenCalledWith(expect.stringContaining('INTERVAL 3 MONTH'));
        });

        it('debe filtrar por semestre', async () => {
            req.query.periodo = 'semestre';
            conexion.query.mockResolvedValue([[{ mes: '2023-06', cantidad: 3, total_ventas: '300' }]]);
            await reportesController.proformasPorMes(req, res);
            expect(conexion.query).toHaveBeenCalledWith(expect.stringContaining('INTERVAL 6 MONTH'));
        });
    });

    describe('proformasPorEstado', () => {
        it('debe devolver la distribución de estados', async () => {
            const mockData = [
                { Estado: 'APROBADA', cantidad: 10, porcentaje: 50 },
                { Estado: 'PENDIENTE', cantidad: 10, porcentaje: 50 }
            ];

            conexion.query.mockResolvedValue([mockData]);

            await reportesController.proformasPorEstado(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockData
            });
        });

        it('debe aplicar filtro de trimestre', async () => {
            req.query.periodo = 'trimestre';
            conexion.query.mockResolvedValue([[]]);
            await reportesController.proformasPorEstado(req, res);
            expect(conexion.query).toHaveBeenCalledWith(expect.stringContaining('INTERVAL 3 MONTH'));
        });

        it('debe aplicar filtro de mes', async () => {
            req.query.periodo = 'mes';
            conexion.query.mockResolvedValue([[]]);
            await reportesController.proformasPorEstado(req, res);
            expect(conexion.query).toHaveBeenCalledWith(expect.stringContaining('MONTH(FechaEmision) = MONTH(CURDATE())'));
        });

        it('debe aplicar filtro de semestre', async () => {
            req.query.periodo = 'semestre';
            conexion.query.mockResolvedValue([[]]);
            await reportesController.proformasPorEstado(req, res);
            expect(conexion.query).toHaveBeenCalledWith(expect.stringContaining('INTERVAL 6 MONTH'));
        });

        it('debe aplicar filtro de anio', async () => {
            req.query.periodo = 'anio';
            conexion.query.mockResolvedValue([[]]);
            await reportesController.proformasPorEstado(req, res);
            expect(conexion.query).toHaveBeenCalledWith(expect.stringContaining('YEAR(FechaEmision) = YEAR(CURDATE())'));
        });

        it('debe manejar errores', async () => {
            conexion.query.mockRejectedValue(new Error('DB fail'));
            await reportesController.proformasPorEstado(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Error al obtener datos' });
        });
    });

    describe('proformasPorCliente', () => {
        it('debe devolver top clientes filtrados', async () => {
            const mockData = [{ cliente: 'Cliente A', cantidad: 5, total_ventas: 1000 }];
            conexion.query.mockResolvedValue([mockData]);
            await reportesController.proformasPorCliente(req, res);
            expect(conexion.query).toHaveBeenCalledWith(expect.stringContaining('INNER JOIN PROFORMA'));
            expect(res.json).toHaveBeenCalledWith({ success: true, data: mockData });
        });

        it('debe aplicar filtro de mes', async () => {
            req.query.periodo = 'mes';
            conexion.query.mockResolvedValue([[]]);
            await reportesController.proformasPorCliente(req, res);
            expect(conexion.query).toHaveBeenCalledWith(expect.stringContaining('MONTH(p.FechaEmision) = MONTH(CURDATE())'));
        });

        it('debe aplicar filtro de trimestre', async () => {
            req.query.periodo = 'trimestre';
            conexion.query.mockResolvedValue([[]]);
            await reportesController.proformasPorCliente(req, res);
            expect(conexion.query).toHaveBeenCalledWith(expect.stringContaining('INTERVAL 3 MONTH'));
        });

        it('debe aplicar filtro de semestre', async () => {
            req.query.periodo = 'semestre';
            conexion.query.mockResolvedValue([[]]);
            await reportesController.proformasPorCliente(req, res);
            expect(conexion.query).toHaveBeenCalledWith(expect.stringContaining('INTERVAL 6 MONTH'));
        });

        it('debe aplicar filtro de anio', async () => {
            req.query.periodo = 'anio';
            conexion.query.mockResolvedValue([[]]);
            await reportesController.proformasPorCliente(req, res);
            expect(conexion.query).toHaveBeenCalledWith(expect.stringContaining('YEAR(p.FechaEmision) = YEAR(CURDATE())'));
        });

        it('debe manejar errores', async () => {
            conexion.query.mockRejectedValue(new Error('fail'));
            await reportesController.proformasPorCliente(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Error al obtener datos' });
        });
    });

    describe('topClientesProformas', () => {
        it('debe devolver top clientes con más proformas', async () => {
            const mockData = [{ RazonSocial: 'ACME', total_proformas: 10, total_ventas: 5000, promedio_venta: 500 }];
            conexion.query.mockResolvedValue([mockData]);
            await reportesController.topClientesProformas(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: mockData });
        });

        it('debe filtrar por mes', async () => {
            req.query.periodo = 'mes';
            conexion.query.mockResolvedValue([[]]);
            await reportesController.topClientesProformas(req, res);
            expect(conexion.query).toHaveBeenCalledWith(expect.stringContaining('MONTH(p.FechaEmision) = MONTH(CURDATE())'));
        });

        it('debe filtrar por trimestre', async () => {
            req.query.periodo = 'trimestre';
            conexion.query.mockResolvedValue([[]]);
            await reportesController.topClientesProformas(req, res);
            expect(conexion.query).toHaveBeenCalledWith(expect.stringContaining('INTERVAL 3 MONTH'));
        });

        it('debe filtrar por semestre', async () => {
            req.query.periodo = 'semestre';
            conexion.query.mockResolvedValue([[]]);
            await reportesController.topClientesProformas(req, res);
            expect(conexion.query).toHaveBeenCalledWith(expect.stringContaining('INTERVAL 6 MONTH'));
        });

        it('debe filtrar por anio', async () => {
            req.query.periodo = 'anio';
            conexion.query.mockResolvedValue([[]]);
            await reportesController.topClientesProformas(req, res);
            expect(conexion.query).toHaveBeenCalledWith(expect.stringContaining('YEAR(p.FechaEmision) = YEAR(CURDATE())'));
        });

        it('debe manejar errores', async () => {
            conexion.query.mockRejectedValue(new Error('fail'));
            await reportesController.topClientesProformas(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('obtenerKPIs', () => {
        // Helper: mock secuencial de todas las queries del KPI
        function mockKPIsQueries({ ventaCount = 5, facturasCount = 3, tasaProformas = 10 } = {}) {
            Proforma.verificarProformasVencidas.mockResolvedValue(true);
            conexion.query
                // totalProformas
                .mockResolvedValueOnce([[{ total: tasaProformas }]])
                // estadisticasProformas
                .mockResolvedValueOnce([[
                    { Estado: 'PENDIENTE', cantidad: 3, total_monto: 300 },
                    { Estado: 'APROBADA', cantidad: 4, total_monto: 400 },
                    { Estado: 'VENCIDA', cantidad: 2, total_monto: 200 },
                    { Estado: 'CONVERTIDA', cantidad: 1, total_monto: 100 }
                ]])
                // promedioProformas
                .mockResolvedValueOnce([[{ promedio: 100.50 }]])
                // verificacionVenta
                .mockResolvedValueOnce([[{ total: ventaCount }]])
                // totalVentas
                .mockResolvedValueOnce([[{ total: ventaCount }]])
                // ventasMes
                .mockResolvedValueOnce([[{ ventas_mes: 500, cantidad_ventas_mes: 3 }]])
                // estadisticasVentas
                .mockResolvedValueOnce([[{ completadas: 4, pendientes: 1, total_completadas: 400 }]])
                // conversionData
                .mockResolvedValueOnce([[{ proformas_con_ventas: 2, total_proformas: tasaProformas }]]);
        }

        it('debe devolver KPIs cuando hay ventas existentes', async () => {
            mockKPIsQueries();
            await reportesController.obtenerKPIs(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    totalProformas: 10,
                    proformasPendientes: 3,
                    proformasAprobadas: 4,
                    proformasVencidas: 2,
                    promedioProformas: 100.50,
                    totalVentas: 5,
                    ventasMes: 500,
                    ventasCompletadas: 4,
                    tasaConversion: '20.00'
                })
            }));
        });

        it('debe inicializar VENTA desde FACTURA si está vacía y hay facturas', async () => {
            Proforma.verificarProformasVencidas.mockResolvedValue(true);
            conexion.query
                .mockResolvedValueOnce([[{ total: 5 }]])       // totalProformas
                .mockResolvedValueOnce([[]])                     // estadísticas (vacías)
                .mockResolvedValueOnce([[{ promedio: null }]])   // promedio
                .mockResolvedValueOnce([[{ total: 0 }]])         // verificacionVenta = 0
                .mockResolvedValueOnce([[{ total: 3 }]])         // facturas count > 0
                .mockResolvedValueOnce([{ affectedRows: 3 }])   // INSERT INTO VENTA
                .mockResolvedValueOnce([[{ total: 3 }]])         // totalVentas
                .mockResolvedValueOnce([[{ ventas_mes: 0, cantidad_ventas_mes: 0 }]]) // ventasMes
                .mockResolvedValueOnce([[{ completadas: 0, pendientes: 0, total_completadas: 0 }]])
                .mockResolvedValueOnce([[{ proformas_con_ventas: 0, total_proformas: 5 }]]);

            await reportesController.obtenerKPIs(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('debe inicializar VENTA vacía sin facturas disponibles', async () => {
            Proforma.verificarProformasVencidas.mockResolvedValue(true);
            conexion.query
                .mockResolvedValueOnce([[{ total: 2 }]])         // totalProformas
                .mockResolvedValueOnce([[]])                     // estadísticas
                .mockResolvedValueOnce([[{ promedio: null }]])   // promedio
                .mockResolvedValueOnce([[{ total: 0 }]])         // verificacionVenta = 0
                .mockResolvedValueOnce([[{ total: 0 }]])         // facturas count = 0 (no insert)
                .mockResolvedValueOnce([[{ total: 0 }]])         // totalVentas
                .mockResolvedValueOnce([[{ ventas_mes: 0, cantidad_ventas_mes: 0 }]])
                .mockResolvedValueOnce([[{ completadas: 0, pendientes: 0, total_completadas: 0 }]])
                .mockResolvedValueOnce([[{ proformas_con_ventas: 0, total_proformas: 0 }]]);

            await reportesController.obtenerKPIs(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({ tasaConversion: 0 })
            }));
        });

        it('debe filtrar por mes', async () => {
            req.query.periodo = 'mes';
            mockKPIsQueries();
            await reportesController.obtenerKPIs(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('debe filtrar por trimestre', async () => {
            req.query.periodo = 'trimestre';
            mockKPIsQueries();
            await reportesController.obtenerKPIs(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('debe filtrar por semestre', async () => {
            req.query.periodo = 'semestre';
            mockKPIsQueries();
            await reportesController.obtenerKPIs(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('debe filtrar por anio', async () => {
            req.query.periodo = 'anio';
            mockKPIsQueries();
            await reportesController.obtenerKPIs(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('debe manejar errores', async () => {
            Proforma.verificarProformasVencidas.mockRejectedValue(new Error('KPI fail'));
            await reportesController.obtenerKPIs(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        });
    });

    describe('ventasPorMes', () => {
        it('debe devolver ventas por mes cuando hay datos', async () => {
            conexion.query
                // SHOW TABLES
                .mockResolvedValueOnce([[{ Tables_in_db: 'VENTA' }]])
                // DESCRIBE VENTA
                .mockResolvedValueOnce([[{ Field: 'IdVenta', Type: 'int' }]])
                // SHOW TRIGGERS
                .mockResolvedValueOnce([[]])
                // COUNT VENTA
                .mockResolvedValueOnce([[{ total: 5 }]])
                // SELECT * FROM VENTA LIMIT 5
                .mockResolvedValueOnce([[{ IdVenta: 1 }]])
                // COUNT FACTURA
                .mockResolvedValueOnce([[{ total: 5 }]])
                // SELECT FACTURA LIMIT 5
                .mockResolvedValueOnce([[{ IdFactura: 1 }]])
                // faltantes check
                .mockResolvedValueOnce([[{ total: 0 }]])
                // SELECT ventas agrupadas
                .mockResolvedValueOnce([[{ mes: '2025-01', cantidad: 3, total_ventas: 1500 }]])

            await reportesController.ventasPorMes(req, res);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: [{ mes: '2025-01', cantidad: 3, total_ventas: 1500 }]
            });
        });

        it('debe insertar ventas desde facturas cuando VENTA está vacía', async () => {
            conexion.query
                .mockResolvedValueOnce([[{ Tables_in_db: 'VENTA' }]]) // SHOW TABLES
                .mockResolvedValueOnce([[{ Field: 'IdVenta', Type: 'int' }]]) // DESCRIBE
                .mockResolvedValueOnce([[]]) // SHOW TRIGGERS
                .mockResolvedValueOnce([[{ total: 0 }]]) // COUNT VENTA = 0
                .mockResolvedValueOnce([[{ total: 2 }]]) // COUNT FACTURA = 2
                .mockResolvedValueOnce([[{ IdFactura: 1 }]]) // FACTURA LIMIT 5
                .mockResolvedValueOnce([{ affectedRows: 2 }]) // INSERT INTO VENTA
                .mockResolvedValueOnce([[{ total: 2 }]]) // COUNT VENTA después
                .mockResolvedValueOnce([[{ mes: '2025-01', cantidad: 2, total_ventas: 800 }]]); // SELECT agrupado

            await reportesController.ventasPorMes(req, res);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: [{ mes: '2025-01', cantidad: 2, total_ventas: 800 }]
            });
        });

        it('debe devolver datos de prueba cuando no hay ventas ni facturas', async () => {
            conexion.query
                .mockResolvedValueOnce([[{ Tables_in_db: 'VENTA' }]]) // SHOW TABLES
                .mockResolvedValueOnce([[{ Field: 'IdVenta', Type: 'int' }]]) // DESCRIBE
                .mockResolvedValueOnce([[]]) // SHOW TRIGGERS
                .mockResolvedValueOnce([[{ total: 0 }]]) // COUNT VENTA = 0
                .mockResolvedValueOnce([[{ total: 0 }]]) // COUNT FACTURA = 0
                .mockResolvedValueOnce([[]]) // SELECT agrupado vacío
                .mockResolvedValueOnce([[]]) // SELECT * VENTA LIMIT 20
                .mockResolvedValueOnce([[]]); // fechas check

            await reportesController.ventasPorMes(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.arrayContaining([expect.objectContaining({ mes: '2025-01' })]),
                message: expect.stringContaining('No hay datos reales')
            }));
        });

        it('debe insertar faltantes cuando hay VENTA pero faltan facturas', async () => {
            conexion.query
                .mockResolvedValueOnce([[{ Tables_in_db: 'VENTA' }]]) // SHOW TABLES
                .mockResolvedValueOnce([[{ Field: 'IdVenta', Type: 'int' }]]) // DESCRIBE
                .mockResolvedValueOnce([[]]) // SHOW TRIGGERS
                .mockResolvedValueOnce([[{ total: 3 }]]) // COUNT VENTA > 0
                .mockResolvedValueOnce([[{ IdVenta: 1 }]]) // VENTA LIMIT 5
                .mockResolvedValueOnce([[{ total: 5 }]]) // COUNT FACTURA
                .mockResolvedValueOnce([[{ IdFactura: 1 }]]) // FACTURA LIMIT 5
                .mockResolvedValueOnce([[{ total: 2 }]]) // faltantes > 0
                .mockResolvedValueOnce([{ affectedRows: 2 }]) // INSERT faltantes
                .mockResolvedValueOnce([[{ mes: '2025-02', cantidad: 5, total_ventas: 2000 }]]); // resultado

            await reportesController.ventasPorMes(req, res);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: [{ mes: '2025-02', cantidad: 5, total_ventas: 2000 }]
            });
        });

        it('debe manejar error en SHOW TABLES sin romper', async () => {
            conexion.query
                .mockRejectedValueOnce(new Error('tabla no existe')) // SHOW TABLES falla
                .mockRejectedValueOnce(new Error('trigger error'))  // SHOW TRIGGERS falla
                .mockResolvedValueOnce([[{ total: 1 }]]) // COUNT VENTA
                .mockResolvedValueOnce([[{ IdVenta: 1 }]]) // VENTA LIMIT 5
                .mockResolvedValueOnce([[{ total: 1 }]]) // COUNT FACTURA
                .mockResolvedValueOnce([[{ IdFactura: 1 }]]) // FACTURA LIMIT 5
                .mockResolvedValueOnce([[{ total: 0 }]]) // faltantes
                .mockResolvedValueOnce([[{ mes: '2025-03', cantidad: 1, total_ventas: 100 }]]);

            await reportesController.ventasPorMes(req, res);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: [{ mes: '2025-03', cantidad: 1, total_ventas: 100 }]
            });
        });

        it('debe manejar errores generales', async () => {
            conexion.query
                .mockRejectedValueOnce(new Error('inner fail'))
                .mockRejectedValueOnce(new Error('inner fail'))
                .mockRejectedValue(new Error('Fallo general'));

            await reportesController.ventasPorMes(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        });

        it('debe manejar tabla VENTA que no existe en SHOW TABLES', async () => {
            conexion.query
                .mockResolvedValueOnce([[]]) // SHOW TABLES = vacío (tabla no existe)
                .mockResolvedValueOnce([[]]) // SHOW TRIGGERS
                .mockResolvedValueOnce([[{ total: 0 }]]) // COUNT VENTA = 0
                .mockResolvedValueOnce([[{ total: 0 }]]) // COUNT FACTURA = 0
                .mockResolvedValueOnce([[]]) // SELECT agrupado vacío
                .mockResolvedValueOnce([[]]) // VENTA LIMIT 20
                .mockResolvedValueOnce([[]]); // fechas check

            await reportesController.ventasPorMes(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('topClientesVentas', () => {
        it('debe devolver top clientes con ventas existentes', async () => {
            const mockClientes = [{ RazonSocial: 'ACME', total_ventas: 5, total_monto: 3000, promedio_venta: 600 }];
            conexion.query
                .mockResolvedValueOnce([[{ total: 5 }]])   // COUNT VENTA
                .mockResolvedValueOnce([[{ total: 5 }]])   // VENTAS por FACTURA
                .mockResolvedValueOnce([[{ total: 5 }]])   // FACTURAS por CLIENTE
                .mockResolvedValueOnce([[{ total: 5 }]])   // verificacion JOIN
                .mockResolvedValueOnce([mockClientes]);     // resultado final

            await reportesController.topClientesVentas(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: mockClientes });
        });

        it('debe devolver datos vacíos cuando no hay ventas ni facturas sin ventas', async () => {
            conexion.query
                .mockResolvedValueOnce([[{ total: 0 }]])   // COUNT VENTA = 0
                .mockResolvedValueOnce([[{ total: 0 }]])   // VENTAS por FACTURA
                .mockResolvedValueOnce([[{ total: 0 }]])   // FACTURAS por CLIENTE
                .mockResolvedValueOnce([[{ total: 0 }]])   // verificacion = 0
                .mockResolvedValueOnce([[{ total: 0 }]])   // clientesSinFacturas
                .mockResolvedValueOnce([[{ total: 0 }]]);  // facturasSinVentas = 0

            await reportesController.topClientesVentas(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: [],
                message: 'No hay datos de ventas por cliente'
            }));
        });

        it('debe insertar y devolver datos cuando hay facturas sin ventas', async () => {
            const mockResult = [{ RazonSocial: 'Fix Corp', total_ventas: 2, total_monto: 1000, promedio_venta: 500 }];
            conexion.query
                .mockResolvedValueOnce([[{ total: 0 }]])   // COUNT VENTA
                .mockResolvedValueOnce([[{ total: 0 }]])   // VENTAS por FACTURA
                .mockResolvedValueOnce([[{ total: 3 }]])   // FACTURAS por CLIENTE
                .mockResolvedValueOnce([[{ total: 0 }]])   // verificacion = 0
                .mockResolvedValueOnce([[{ total: 2 }]])   // clientesSinFacturas
                .mockResolvedValueOnce([[{ total: 3 }]])   // facturasSinVentas > 0
                .mockResolvedValueOnce([{ affectedRows: 3 }]) // INSERT
                .mockResolvedValueOnce([[{ total: 3 }]])   // verificacionDespues > 0
                .mockResolvedValueOnce([mockResult]);       // resultado final

            await reportesController.topClientesVentas(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: mockResult });
        });

        it('debe devolver vacío si insert no genera datos en JOIN', async () => {
            conexion.query
                .mockResolvedValueOnce([[{ total: 0 }]])
                .mockResolvedValueOnce([[{ total: 0 }]])
                .mockResolvedValueOnce([[{ total: 0 }]])
                .mockResolvedValueOnce([[{ total: 0 }]])
                .mockResolvedValueOnce([[{ total: 0 }]])
                .mockResolvedValueOnce([[{ total: 2 }]])    // facturasSinVentas > 0
                .mockResolvedValueOnce([{ affectedRows: 2 }])
                .mockResolvedValueOnce([[{ total: 0 }]]);   // verificacionDespues = 0

            await reportesController.topClientesVentas(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: [] }));
        });

        it('debe filtrar por periodo mes', async () => {
            req.query.periodo = 'mes';
            conexion.query
                .mockResolvedValueOnce([[{ total: 3 }]])
                .mockResolvedValueOnce([[{ total: 3 }]])
                .mockResolvedValueOnce([[{ total: 3 }]])
                .mockResolvedValueOnce([[{ total: 3 }]])
                .mockResolvedValueOnce([[]]);
            await reportesController.topClientesVentas(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('debe filtrar por periodo trimestre', async () => {
            req.query.periodo = 'trimestre';
            conexion.query
                .mockResolvedValueOnce([[{ total: 3 }]])
                .mockResolvedValueOnce([[{ total: 3 }]])
                .mockResolvedValueOnce([[{ total: 3 }]])
                .mockResolvedValueOnce([[{ total: 3 }]])
                .mockResolvedValueOnce([[]]);
            await reportesController.topClientesVentas(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('debe filtrar por periodo semestre', async () => {
            req.query.periodo = 'semestre';
            conexion.query
                .mockResolvedValueOnce([[{ total: 3 }]])
                .mockResolvedValueOnce([[{ total: 3 }]])
                .mockResolvedValueOnce([[{ total: 3 }]])
                .mockResolvedValueOnce([[{ total: 3 }]])
                .mockResolvedValueOnce([[]]);
            await reportesController.topClientesVentas(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('debe filtrar por periodo anio', async () => {
            req.query.periodo = 'anio';
            conexion.query
                .mockResolvedValueOnce([[{ total: 3 }]])
                .mockResolvedValueOnce([[{ total: 3 }]])
                .mockResolvedValueOnce([[{ total: 3 }]])
                .mockResolvedValueOnce([[{ total: 3 }]])
                .mockResolvedValueOnce([[]]);
            await reportesController.topClientesVentas(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('debe manejar errores', async () => {
            conexion.query.mockRejectedValue(new Error('ventas fail'));
            await reportesController.topClientesVentas(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('diagnosticoVenta', () => {
        it('debe devolver diagnóstico cuando la tabla existe con registros', async () => {
            conexion.query
                .mockResolvedValueOnce([[{ Tables_in_db: 'VENTA' }]]) // SHOW TABLES
                .mockResolvedValueOnce([[{ Field: 'IdVenta', Type: 'int' }]]) // DESCRIBE
                .mockResolvedValueOnce([[]]) // SHOW TRIGGERS
                .mockResolvedValueOnce([[{ total: 5 }]]) // COUNT VENTA
                .mockResolvedValueOnce([[{ total: 3 }]]) // COUNT FACTURA
                .mockResolvedValueOnce([[{ total: 1 }]]) // faltantes
                .mockResolvedValueOnce([[{ IdVenta: 1 }]]) // muestra de VENTA
                .mockResolvedValueOnce([[{ mes: '2025-01', cantidad: 5, total_ventas: 2000 }]]) // distribución
                .mockResolvedValueOnce([[{ IdCliente: 1, RazonSocial: 'Test', cantidad: 3, total: 1500 }]]); // ventas por cliente

            await reportesController.diagnosticoVenta(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                diagnostico: expect.objectContaining({
                    tablaExiste: true,
                    totalRegistros: 5
                })
            }));
        });

        it('debe devolver diagnóstico cuando la tabla no existe', async () => {
            conexion.query
                .mockResolvedValueOnce([[]]) // SHOW TABLES vacío
                .mockResolvedValueOnce([[]]) // SHOW TRIGGERS
                .mockResolvedValueOnce([[{ total: 0 }]]) // COUNT VENTA
                .mockResolvedValueOnce([[{ total: 0 }]]) // COUNT FACTURA
                .mockResolvedValueOnce([[{ total: 0 }]]) // faltantes
                .mockResolvedValueOnce([[]]) // distribución
                .mockResolvedValueOnce([[]]); // ventasPorCliente

            await reportesController.diagnosticoVenta(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                diagnostico: expect.objectContaining({ tablaExiste: false })
            }));
        });

        it('debe manejar errores', async () => {
            conexion.query.mockRejectedValue(new Error('diagnostico fail'));
            await reportesController.diagnosticoVenta(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('proformasVencidas', () => {
        it('debe devolver proformas vencidas mapeadas', async () => {
            Proforma.verificarProformasVencidas.mockResolvedValue(true);
            Proforma.obtenerProformasVencidas.mockResolvedValue([
                { IdProforma: 1, Codigo: 'PRO-001', ClienteNombre: 'ACME', FechaEmision: '2023-01-01', Total: 500, Estado: 'VENCIDA', ValidezOferta: 10, DiasTranscurridos: 30 }
            ]);

            await reportesController.proformasVencidas(req, res);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: [expect.objectContaining({
                    Codigo: 'PRO-001',
                    DiasVencidos: 20
                })]
            });
        });

        it('debe manejar lista vacía', async () => {
            Proforma.verificarProformasVencidas.mockResolvedValue(true);
            Proforma.obtenerProformasVencidas.mockResolvedValue([]);

            await reportesController.proformasVencidas(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
        });

        it('debe manejar errores', async () => {
            Proforma.verificarProformasVencidas.mockRejectedValue(new Error('vencidas fail'));
            await reportesController.proformasVencidas(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('estadisticasProformas', () => {
        it('debe devolver estadísticas por estado', async () => {
            Proforma.verificarProformasVencidas.mockResolvedValue(true);
            const stats = [{ Estado: 'PENDIENTE', cantidad: 5 }];
            Proforma.obtenerEstadisticasEstados.mockResolvedValue(stats);

            await reportesController.estadisticasProformas(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: stats });
        });

        it('debe manejar errores', async () => {
            Proforma.verificarProformasVencidas.mockRejectedValue(new Error('stats fail'));
            await reportesController.estadisticasProformas(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('proformasRecientes', () => {
        it('debe devolver proformas recientes', async () => {
            const mockData = [{ IdProforma: 1, Codigo: 'PRO-001', Estado: 'PENDIENTE' }];
            conexion.query.mockResolvedValue([mockData]);
            await reportesController.proformasRecientes(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: mockData });
        });

        it('debe manejar errores', async () => {
            conexion.query.mockRejectedValue(new Error('recientes fail'));
            await reportesController.proformasRecientes(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Error al obtener proformas' });
        });
    });

    describe('auditoriaReciente', () => {
        it('debe devolver registros de auditoría recientes', async () => {
            const Auditoria = require('../../src/modelos/Auditoria');
            const mockData = [{ id: 1, accion: 'LOGIN' }];
            Auditoria.listarRecientes.mockResolvedValue(mockData);
            await reportesController.auditoriaReciente(req, res);
            expect(res.json).toHaveBeenCalledWith({ success: true, data: mockData });
        });

        it('debe manejar errores', async () => {
            const Auditoria = require('../../src/modelos/Auditoria');
            Auditoria.listarRecientes.mockRejectedValue(new Error('audit fail'));
            await reportesController.auditoriaReciente(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Error al obtener auditoría' });
        });
    });

    describe('cuentasPorCobrar', () => {
        it('debe devolver resumen, detalle por cliente y facturas', async () => {
            const resumenMock = { totalFacturas: 10, montoTotal: 5000, totalVencidas: 3, montoVencido: 1500, totalPendientes: 7, montoPendiente: 3500 };
            const porClienteMock = [{ IdCliente: 1, RazonSocial: 'ACME', cantidadFacturas: 5, montoTotal: 2500 }];
            const facturasMock = [{ IdFactura: 1, Codigo: 'F001', RazonSocial: 'ACME', Total: 500, diasVencido: 10 }];

            conexion.query
                .mockResolvedValueOnce([[resumenMock]])
                .mockResolvedValueOnce([porClienteMock])
                .mockResolvedValueOnce([facturasMock]);

            await reportesController.cuentasPorCobrar(req, res);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    resumen: resumenMock,
                    porCliente: porClienteMock,
                    facturas: facturasMock
                }
            });
        });

        it('debe manejar errores', async () => {
            conexion.query.mockRejectedValue(new Error('cobrar fail'));
            await reportesController.cuentasPorCobrar(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        });
    });
});
