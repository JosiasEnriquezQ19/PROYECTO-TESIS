jest.mock('../../src/modelos/Empresa');

const Empresa = require('../../src/modelos/Empresa');
const empresaController = require('../../src/controladores/empresaController');

let req, res;
beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    req = {
        flash: jest.fn().mockReturnValue([]),
        session: { usuario: { IdRol: 1 } },
        params: {}, body: {}, file: null
    };
    res = { render: jest.fn(), redirect: jest.fn() };
});
afterEach(() => console.error.mockRestore());

describe('empresaController.listar', () => {
    test('renderiza la vista con las empresas', async () => {
        const mock = [{ IdEmpresa: 1, Nombre: 'CARSIL SAC' }];
        Empresa.getAll.mockResolvedValue(mock);

        await empresaController.listar(req, res);
        expect(res.render).toHaveBeenCalledWith('empresa/lista', expect.objectContaining({
            empresas: mock
        }));
    });

    test('redirige a /empresa si falla la carga', async () => {
        Empresa.getAll.mockRejectedValue(new Error('DB error'));
        await empresaController.listar(req, res);
        expect(res.redirect).toHaveBeenCalledWith('/empresa');
    });
});

describe('empresaController.crearForm', () => {
    test('renderiza el formulario de creación', () => {
        empresaController.crearForm(req, res);
        expect(res.render).toHaveBeenCalledWith('empresa/crear', expect.anything());
    });
});

describe('empresaController.crear', () => {
    test('crea la empresa y redirige a /empresa', async () => {
        Empresa.create.mockResolvedValue(2);
        req.body = { Nombre: 'Nueva Empresa', RUC: '20111111111', Direccion: 'Av. Test' };

        await empresaController.crear(req, res);
        expect(Empresa.create).toHaveBeenCalledTimes(1);
        expect(res.redirect).toHaveBeenCalledWith('/empresa');
    });

    test('redirige a /empresa/crear si falla la creación', async () => {
        Empresa.create.mockRejectedValue(new Error('DB error'));
        req.body = { Nombre: 'X', RUC: '1', Direccion: 'Y' };

        await empresaController.crear(req, res);
        expect(res.redirect).toHaveBeenCalledWith('/empresa/crear');
    });
});

describe('empresaController.editarForm', () => {
    test('renderiza el formulario de edición', async () => {
        const mock = { IdEmpresa: 1, Nombre: 'CARSIL SAC' };
        Empresa.getById.mockResolvedValue(mock);
        req.params.id = '1';

        await empresaController.editarForm(req, res);
        expect(res.render).toHaveBeenCalledWith('empresa/edit', expect.objectContaining({
            empresa: mock
        }));
    });

    test('redirige a /empresa si la empresa no existe', async () => {
        Empresa.getById.mockResolvedValue(null);
        req.params.id = '999';

        await empresaController.editarForm(req, res);
        expect(res.redirect).toHaveBeenCalledWith('/empresa');
    });
});
