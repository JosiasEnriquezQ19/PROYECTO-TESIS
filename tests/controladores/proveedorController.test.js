jest.mock('../../src/modelos/Proveedor');

const Proveedor = require('../../src/modelos/Proveedor');
const proveedorController = require('../../src/controladores/proveedorController');

let req, res;
beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    req = {
        flash: jest.fn().mockReturnValue([]),
        user: { IdRol: 1 },
        params: {}, body: {}, query: {}
    };
    res = { render: jest.fn(), redirect: jest.fn() };
});
afterEach(() => console.error.mockRestore());

describe('proveedorController.list', () => {
    test('renderiza la vista con los proveedores', async () => {
        const mock = [{ IdProveedor: 1, RazonSocial: 'TechProv' }];
        Proveedor.getAll.mockResolvedValue(mock);

        await proveedorController.list(req, res);
        expect(res.render).toHaveBeenCalledWith('proveedores/lista', expect.objectContaining({
            proveedores: mock
        }));
    });

    test('redirige a /menu si falla la carga', async () => {
        Proveedor.getAll.mockRejectedValue(new Error('DB error'));
        await proveedorController.list(req, res);
        expect(res.redirect).toHaveBeenCalledWith('/menu');
    });
});

describe('proveedorController.create', () => {
    beforeEach(() => {
        req.body = {
            RUC: '20777777777', RazonSocial: 'Nuevo Proveedor',
            Direccion: 'Av. Test', Telefono: '', Celular: '', Email: '', Contacto: '', Estado: 1
        };
    });

    test('crea el proveedor y redirige a /proveedores', async () => {
        Proveedor.checkDuplicateRuc.mockResolvedValue(false);
        Proveedor.create.mockResolvedValue(5);

        await proveedorController.create(req, res);

        expect(Proveedor.create).toHaveBeenCalledTimes(1);
        expect(res.redirect).toHaveBeenCalledWith('/proveedores');
    });

    test('redirige con error si el RUC está duplicado', async () => {
        Proveedor.checkDuplicateRuc.mockResolvedValue(true);

        await proveedorController.create(req, res);

        expect(Proveedor.create).not.toHaveBeenCalled();
        expect(res.redirect).toHaveBeenCalledWith('/proveedores/crear');
    });

    test('redirige con error si falla la creación', async () => {
        Proveedor.checkDuplicateRuc.mockResolvedValue(false);
        Proveedor.create.mockRejectedValue(new Error('DB error'));

        await proveedorController.create(req, res);
        expect(res.redirect).toHaveBeenCalledWith('/proveedores/crear');
    });
});

describe('proveedorController.editForm', () => {
    test('renderiza el formulario de edición', async () => {
        Proveedor.getById.mockResolvedValue({ IdProveedor: 2, RazonSocial: 'Distribuidora' });
        req.params.id = '2';

        await proveedorController.editForm(req, res);
        expect(res.render).toHaveBeenCalledWith('proveedores/editar', expect.objectContaining({
            proveedor: expect.objectContaining({ IdProveedor: 2 })
        }));
    });

    test('redirige a /proveedores si el proveedor no existe', async () => {
        Proveedor.getById.mockResolvedValue(null);
        req.params.id = '999';

        await proveedorController.editForm(req, res);
        expect(res.redirect).toHaveBeenCalledWith('/proveedores');
    });
});
