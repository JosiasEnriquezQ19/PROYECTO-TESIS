// FacturaController es una clase. Se mockean todos los modelos que usa.
jest.mock('../../src/modelos/Factura');
jest.mock('../../src/modelos/Cliente');
jest.mock('../../src/modelos/Producto');
jest.mock('../../src/modelos/Empresa');
jest.mock('../../src/modelos/Proforma');
jest.mock('../../src/modelos/Usuario');

const Factura = require('../../src/modelos/Factura');
const Cliente = require('../../src/modelos/Cliente');
const Producto = require('../../src/modelos/Producto');
const Empresa = require('../../src/modelos/Empresa');
const Proforma = require('../../src/modelos/Proforma');
const FacturaController = require('../../src/controladores/facturaController');

let controller, req, res;

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Configurar mock de instancia de Factura
    Factura.mockImplementation(() => ({
        listar: jest.fn(),
        obtenerPorId: jest.fn(),
        crear: jest.fn()
    }));

    controller = new FacturaController();
    req = {
        session: { usuario: { IdUsuario: 1, IdRol: 1 } },
        params: {}, body: {}, query: {}
    };
    res = { render: jest.fn(), redirect: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn() };
});
afterEach(() => console.error.mockRestore());

describe('FacturaController.listar', () => {
    test('renderiza la vista con las facturas', async () => {
        const facturasMock = [{ IdFactura: 1, Codigo: 'FAC-001' }];
        controller.facturaModel.listar.mockResolvedValue(facturasMock);

        await controller.listar(req, res);

        expect(res.render).toHaveBeenCalledWith('facturas/lista', expect.objectContaining({
            title: 'Gestión de Facturas',
            facturas: facturasMock
        }));
    });

    test('renderiza lista vacía con error si falla la BD', async () => {
        controller.facturaModel.listar.mockRejectedValue(new Error('DB error'));

        await controller.listar(req, res);

        expect(res.render).toHaveBeenCalledWith('facturas/lista', expect.objectContaining({
            facturas: [],
            error: expect.stringContaining('Error al cargar')
        }));
    });
});

describe('FacturaController.mostrarCrear', () => {
    test('renderiza el formulario con todos los datos necesarios', async () => {
        Cliente.listar.mockResolvedValue([{ IdCliente: 1 }]);
        Producto.listar.mockResolvedValue([{ IdProducto: 1 }]);
        Empresa.getAll.mockResolvedValue([{ IdEmpresa: 1 }]);
        Proforma.listar.mockResolvedValue([{ IdProforma: 1 }]);

        await controller.mostrarCrear(req, res);

        expect(res.render).toHaveBeenCalledWith('facturas/crear', expect.objectContaining({
            clientes: expect.any(Array),
            productos: expect.any(Array),
            empresas: expect.any(Array)
        }));
    });

    test('renderiza con listas vacías si falla la carga', async () => {
        Cliente.listar.mockRejectedValue(new Error('DB error'));
        Producto.listar.mockRejectedValue(new Error('DB error'));
        Empresa.getAll.mockRejectedValue(new Error('DB error'));
        Proforma.listar.mockRejectedValue(new Error('DB error'));

        await controller.mostrarCrear(req, res);

        expect(res.render).toHaveBeenCalledWith('facturas/crear', expect.objectContaining({
            clientes: [],
            error: expect.stringContaining('Error al cargar')
        }));
    });
});

describe('FacturaController.crear', () => {
    test('retorna 401 si no hay sesión de usuario', async () => {
        req.session = {};
        req.body = { IdCliente: 1, IdEmpresa: 1, FechaEmision: '2026-03-11', productos: [{}] };

        await controller.crear(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    test('retorna 400 si faltan datos requeridos', async () => {
        req.body = { IdCliente: 1 }; // faltan campos

        await controller.crear(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
});
