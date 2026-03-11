jest.mock('../../src/bd/conexion');

const conexion = require('../../src/bd/conexion');
const Producto = require('../../src/modelos/Producto');

beforeEach(() => {
    jest.clearAllMocks();
});

// ─────────────────────────────────────────────
// Producto.listar()
// ─────────────────────────────────────────────
describe('Producto.listar()', () => {
    test('retorna todos los productos activos sin filtro', async () => {
        const productosMock = [
            { IdProducto: 1, Nombre: 'Cable HDMI', Estado: 1 },
            { IdProducto: 2, Nombre: 'Teclado USB', Estado: 1 }
        ];
        conexion.query.mockResolvedValue([productosMock]);

        const resultado = await Producto.listar('');

        expect(resultado).toEqual(productosMock);
        expect(conexion.query).toHaveBeenCalledWith(
            'SELECT * FROM PRODUCTO WHERE Estado = 1',
            []
        );
    });

    test('filtra por término de búsqueda en Codigo y Nombre', async () => {
        conexion.query.mockResolvedValue([[{ IdProducto: 1, Nombre: 'Cable HDMI' }]]);

        await Producto.listar('Cable');

        expect(conexion.query).toHaveBeenCalledWith(
            expect.stringContaining('LIKE ?'),
            ['%Cable%', '%Cable%']
        );
    });

    test('retorna array vacío si no hay productos', async () => {
        conexion.query.mockResolvedValue([[]]);
        const resultado = await Producto.listar('');
        expect(resultado).toEqual([]);
    });
});

// ─────────────────────────────────────────────
// Producto.listarPorFiltro()
// ─────────────────────────────────────────────
describe('Producto.listarPorFiltro()', () => {
    test('construye la query con el campo y valor correctos', async () => {
        conexion.query.mockResolvedValue([[{ IdProducto: 1 }]]);

        await Producto.listarPorFiltro('Codigo', 'ABC-001');

        expect(conexion.query).toHaveBeenCalledWith(
            expect.stringContaining('Codigo LIKE ?'),
            ['%ABC-001%']
        );
    });
});

// ─────────────────────────────────────────────
// Producto.obtenerPorId()
// ─────────────────────────────────────────────
describe('Producto.obtenerPorId()', () => {
    test('retorna el producto correcto por ID', async () => {
        const productoMock = { IdProducto: 3, Nombre: 'Monitor 24"', PrecioUnitario: 350 };
        conexion.query.mockResolvedValue([[productoMock]]);

        const resultado = await Producto.obtenerPorId(3);

        expect(resultado).toEqual(productoMock);
        expect(conexion.query).toHaveBeenCalledWith(
            'SELECT * FROM PRODUCTO WHERE IdProducto = ?',
            [3]
        );
    });

    test('retorna undefined si el producto no existe', async () => {
        conexion.query.mockResolvedValue([[]]);
        const resultado = await Producto.obtenerPorId(999);
        expect(resultado).toBeUndefined();
    });
});

// ─────────────────────────────────────────────
// Producto.crear()
// ─────────────────────────────────────────────
describe('Producto.crear()', () => {
    test('inserta el producto con todos los campos', async () => {
        conexion.query.mockResolvedValue([{ affectedRows: 1 }]);

        const datos = {
            Codigo: 'PROD-001',
            Nombre: 'Monitor LG',
            Descripcion: '24 pulgadas Full HD',
            Marca: 'LG',
            Modelo: '24MK430H',
            Tipo: 'Electrónico',
            UnidadMedida: 'UNID',
            PrecioUnitario: 450.00
        };

        await Producto.crear(datos);

        expect(conexion.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO PRODUCTO'),
            expect.arrayContaining(['PROD-001', 'Monitor LG', 450.00])
        );
    });
});

// ─────────────────────────────────────────────
// Producto.eliminar()
// ─────────────────────────────────────────────
describe('Producto.eliminar()', () => {
    test('realiza soft-delete cambiando Estado a 0', async () => {
        conexion.query.mockResolvedValue([{ affectedRows: 1 }]);

        await Producto.eliminar(5);

        expect(conexion.query).toHaveBeenCalledWith(
            'UPDATE PRODUCTO SET Estado = 0 WHERE IdProducto = ?',
            [5]
        );
    });
});

// ─────────────────────────────────────────────
// Producto.contarActivos()
// ─────────────────────────────────────────────
describe('Producto.contarActivos()', () => {
    test('retorna el total de productos activos', async () => {
        conexion.query.mockResolvedValue([[{ total: 18 }]]);

        const total = await Producto.contarActivos();

        expect(total).toBe(18);
    });
});
