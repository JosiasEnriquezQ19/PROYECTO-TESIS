const Producto = require('../../src/modelos/Producto');
const conexion = require('../../src/bd/conexion');

jest.mock('../../src/bd/conexion', () => ({
    query: jest.fn()
}));

describe('Producto Model', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('contarActivos', () => {
        it('debe contar los productos activos', async () => {
            conexion.query.mockResolvedValue([[{ total: 10 }]]);
            const total = await Producto.contarActivos();
            expect(conexion.query).toHaveBeenCalledWith('SELECT COUNT(*) as total FROM PRODUCTO WHERE Estado = 1');
            expect(total).toBe(10);
        });
    });

    describe('listarPorFiltro', () => {
        it('debe listar productos filtrando por campo y valor', async () => {
            const mockProductos = [{ id: 1, Nombre: 'Taladro' }];
            conexion.query.mockResolvedValue([mockProductos]);
            
            const result = await Producto.listarPorFiltro('Nombre', 'Taladro');
            expect(conexion.query).toHaveBeenCalledWith('SELECT * FROM PRODUCTO WHERE Estado = 1 AND Nombre LIKE ?', ['%Taladro%']);
            expect(result).toEqual(mockProductos);
        });
    });

    describe('listar', () => {
        it('debe listar todos los productos si no hay termino', async () => {
            const mockProductos = [{ id: 1 }];
            conexion.query.mockResolvedValue([mockProductos]);
            
            const result = await Producto.listar();
            expect(conexion.query).toHaveBeenCalledWith('SELECT * FROM PRODUCTO ORDER BY Codigo', []);
            expect(result).toEqual(mockProductos);
        });

        it('debe buscar productos por termino', async () => {
            const mockProductos = [{ id: 2 }];
            conexion.query.mockResolvedValue([mockProductos]);
            
            const result = await Producto.listar('Taladro');
            expect(conexion.query).toHaveBeenCalledWith('SELECT * FROM PRODUCTO WHERE (Codigo LIKE ? OR Nombre LIKE ?) ORDER BY Codigo', ['%Taladro%', '%Taladro%']);
            expect(result).toEqual(mockProductos);
        });
    });

    describe('crear', () => {
        it('debe crear un producto insertando todos los campos incluyendo valores default', async () => {
            conexion.query.mockResolvedValue([{ insertId: 1 }]);
            
            const prod = {
                Codigo: 'PRD-001',
                Nombre: 'Producto Prueba',
                Descripcion: 'Desc',
                Marca: 'Marca',
                Modelo: 'Modelo',
                Tipo: 'Tipo',
                UnidadMedida: 'UND',
                PrecioUnitario: 10.5,
                Stock: 20,
                StockMinimo: 5
            };
            
            await Producto.crear(prod);
            expect(conexion.query).toHaveBeenCalledTimes(1);
            expect(conexion.query.mock.calls[0][1]).toEqual([
                'PRD-001', 'Producto Prueba', 'Desc', 'Marca', 'Modelo', 'Tipo', 'UND', 10.5, 20, 5
            ]);
        });
        
        it('debe usar valores por defecto para stock minimos', async () => {
            conexion.query.mockResolvedValue([{ insertId: 1 }]);
            
            const prod = {
                Codigo: 'PRD-002', Nombre: 'Prod 2', Descripcion: '', Marca: '', Modelo: '', Tipo: '', UnidadMedida: 'UND', PrecioUnitario: 10
            };
            
            await Producto.crear(prod);
            expect(conexion.query.mock.calls[0][1]).toEqual([
                'PRD-002', 'Prod 2', '', '', '', '', 'UND', 10, 0, 5
            ]);
        });
    });

    describe('obtenerPorId', () => {
        it('debe obtener un producto especifico', async () => {
            const mockProd = { IdProducto: 5 };
            conexion.query.mockResolvedValue([[mockProd]]);
            const result = await Producto.obtenerPorId(5);
            expect(result).toEqual(mockProd);
        });
    });

    describe('actualizar', () => {
        it('debe actualizar producto y manejar stocks por defecto', async () => {
            conexion.query.mockResolvedValue([{ affectedRows: 1 }]);
            
            const prod = { Codigo: 'PRD-001', Nombre: 'Producto Cero', PrecioUnitario: 10, UnidadMedida: 'UND' };
            await Producto.actualizar(1, prod);
            
            expect(conexion.query.mock.calls[0][1]).toEqual([
                'PRD-001', 'Producto Cero', undefined, undefined, undefined, undefined, 'UND', 10, 0, 5, 1
            ]);
        });
    });

    describe('eliminar', () => {
        it('debe cambiar estado a inactivo (0)', async () => {
            conexion.query.mockResolvedValue([{ affectedRows: 1 }]);
            await Producto.eliminar(5);
            expect(conexion.query).toHaveBeenCalledWith('UPDATE PRODUCTO SET Estado = 0 WHERE IdProducto = ?', [5]);
        });
    });

    describe('obtenerTiposCodigo', () => {
        it('debe obtener codigos distintos', async () => {
            const mockCodigos = [{ Codigo: 'HERR' }, { Codigo: 'ELEC' }];
            conexion.query.mockResolvedValue([mockCodigos]);
            const result = await Producto.obtenerTiposCodigo();
            expect(result).toEqual(mockCodigos);
        });
    });

    describe('listarPorCodigo', () => {
        it('debe listar todos si no se pasa codigo', async () => {
            conexion.query.mockResolvedValue([[{ id: 1 }]]);
            await Producto.listarPorCodigo();
            expect(conexion.query).toHaveBeenCalledWith('SELECT * FROM PRODUCTO ORDER BY Codigo', []);
        });

        it('debe filtrar por codigo si se pasa', async () => {
            conexion.query.mockResolvedValue([[{ id: 1 }]]);
            await Producto.listarPorCodigo('HERR');
            expect(conexion.query).toHaveBeenCalledWith('SELECT * FROM PRODUCTO WHERE Codigo = ? ORDER BY Nombre', ['HERR']);
        });
    });

    describe('stock bajo', () => {
        it('debe listar stock bajo', async () => {
            const mockProds = [{ id: 1 }];
            conexion.query.mockResolvedValue([mockProds]);
            const res = await Producto.listarStockBajo();
            expect(conexion.query).toHaveBeenCalledWith(expect.stringContaining('Stock <= StockMinimo'));
            expect(res).toEqual(mockProds);
        });

        it('debe contar stock bajo', async () => {
            conexion.query.mockResolvedValue([[{ total: 4 }]]);
            const res = await Producto.contarStockBajo();
            expect(conexion.query).toHaveBeenCalledWith(expect.stringContaining('COUNT(*) as total'));
            expect(res).toBe(4);
        });
    });
});
