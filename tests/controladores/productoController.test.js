jest.mock('../../src/modelos/Producto');

const Producto = require('../../src/modelos/Producto');
const {
    listarProductos,
    crearProducto,
    actualizarProducto
} = require('../../src/controladores/productoController');

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    console.error.mockRestore();
});

// ─────────────────────────────────────────────
// listarProductos
// ─────────────────────────────────────────────
describe('listarProductos', () => {
    let req, res;

    beforeEach(() => {
        req = { query: {}, user: { IdRol: 1 } };
        res = { render: jest.fn() };
    });

    test('renderiza la vista con todos los productos sin filtros', async () => {
        const productosMock = [{ IdProducto: 1, Nombre: 'Cable HDMI' }];
        Producto.listar.mockResolvedValue(productosMock);

        await listarProductos(req, res);

        expect(Producto.listar).toHaveBeenCalledWith();
        expect(res.render).toHaveBeenCalledWith('productos/lista', expect.objectContaining({
            title: 'Lista de Productos',
            productos: productosMock
        }));
    });

    test('filtra por término de búsqueda', async () => {
        req.query.termino = 'Monitor';
        Producto.listar.mockResolvedValue([]);

        await listarProductos(req, res);

        expect(Producto.listar).toHaveBeenCalledWith('Monitor');
    });

    test('filtra por código específico usando listarPorFiltro', async () => {
        req.query.codigo = 'PROD-001';
        Producto.listarPorFiltro.mockResolvedValue([{ IdProducto: 2 }]);

        await listarProductos(req, res);

        expect(Producto.listarPorFiltro).toHaveBeenCalledWith('Codigo', 'PROD-001');
    });

    test('renderiza lista vacía si falla la BD', async () => {
        Producto.listar.mockRejectedValue(new Error('DB error'));

        await listarProductos(req, res);

        expect(res.render).toHaveBeenCalledWith('productos/lista', expect.objectContaining({
            productos: [],
            error: expect.stringContaining('Error al cargar productos')
        }));
    });
});

// ─────────────────────────────────────────────
// crearProducto
// ─────────────────────────────────────────────
describe('crearProducto', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {
                Codigo: 'PROD-001',
                Nombre: 'Mouse Óptico',
                Descripcion: 'Mouse USB',
                Marca: 'Logitech',
                Modelo: 'M100',
                Tipo: 'Periférico',
                UnidadMedida: 'UNID',
                PrecioUnitario: 25.00
            },
            user: { IdRol: 1 }
        };
        res = { redirect: jest.fn(), render: jest.fn() };
    });

    test('crea el producto y redirige con éxito', async () => {
        Producto.crear.mockResolvedValue();

        await crearProducto(req, res);

        expect(Producto.crear).toHaveBeenCalledTimes(1);
        expect(res.redirect).toHaveBeenCalledWith(
            expect.stringContaining('/productos?success=')
        );
    });

    test('renderiza error de código duplicado (ER_DUP_ENTRY)', async () => {
        const err = new Error('Duplicate entry');
        err.code = 'ER_DUP_ENTRY';
        Producto.crear.mockRejectedValue(err);

        await crearProducto(req, res);

        expect(res.render).toHaveBeenCalledWith('productos/crear', expect.objectContaining({
            messages: expect.objectContaining({
                error: expect.stringContaining('código de producto ya existe')
            })
        }));
    });

    test('renderiza error genérico si falla la creación', async () => {
        Producto.crear.mockRejectedValue(new Error('DB error'));

        await crearProducto(req, res);

        expect(res.render).toHaveBeenCalledWith('productos/crear', expect.objectContaining({
            messages: expect.objectContaining({ error: 'Error al crear el producto.' })
        }));
    });
});

// ─────────────────────────────────────────────
// actualizarProducto
// ─────────────────────────────────────────────
describe('actualizarProducto', () => {
    let req, res;

    beforeEach(() => {
        req = {
            params: { id: '4' },
            body: {
                Codigo: 'PROD-004',
                Nombre: 'Teclado Mecánico',
                Descripcion: null,
                Marca: 'HyperX',
                Modelo: 'Alloy',
                Tipo: 'Periférico',
                UnidadMedida: 'UNID',
                PrecioUnitario: 120.00
            },
            user: { IdRol: 1 }
        };
        res = { redirect: jest.fn() };
    });

    test('actualiza el producto y redirige con éxito', async () => {
        Producto.actualizar.mockResolvedValue();

        await actualizarProducto(req, res);

        expect(Producto.actualizar).toHaveBeenCalledWith('4', expect.objectContaining({
            Codigo: 'PROD-004',
            Nombre: 'Teclado Mecánico'
        }));
        expect(res.redirect).toHaveBeenCalledWith(
            expect.stringContaining('/productos?success=')
        );
    });

    test('redirige con error si falla la actualización', async () => {
        Producto.actualizar.mockRejectedValue(new Error('BD error'));

        await actualizarProducto(req, res);

        expect(res.redirect).toHaveBeenCalledWith(
            expect.stringContaining('/productos?error=')
        );
    });
});
