jest.mock('../../src/modelos/Empleado');
jest.mock('../../src/modelos/Usuario');

const Empleado = require('../../src/modelos/Empleado');
const Usuario = require('../../src/modelos/Usuario');
const empleadoController = require('../../src/controladores/empleadoController');

let req, res;
beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    req = {
        flash: jest.fn().mockReturnValue([]),
        session: { usuario: { IdRol: 1 } },
        params: {}, body: {}
    };
    res = { render: jest.fn(), redirect: jest.fn() };
});
afterEach(() => console.error.mockRestore());

describe('empleadoController.list', () => {
    test('renderiza la vista con empleados y usuarios', async () => {
        const empleadosMock = [{ IdEmpleado: 1, Cargo: 'Vendedor' }];
        const usuariosMock = [{ IdUsuario: 1, Nombres: 'Ana' }];
        Empleado.getAll.mockResolvedValue(empleadosMock);
        Usuario.getAll.mockResolvedValue(usuariosMock);

        await empleadoController.list(req, res);

        expect(res.render).toHaveBeenCalledWith('empleados/lista', expect.objectContaining({
            empleados: empleadosMock,
            usuarios: usuariosMock
        }));
    });

    test('redirige a /menu/principal si falla la carga', async () => {
        Empleado.getAll.mockRejectedValue(new Error('DB error'));
        Usuario.getAll.mockResolvedValue([]);

        await empleadoController.list(req, res);
        expect(res.redirect).toHaveBeenCalledWith('/menu/principal');
    });
});

describe('empleadoController.create', () => {
    test('crea el empleado y redirige a /empleados', async () => {
        Empleado.create.mockResolvedValue(5);
        req.body = { IdUsuario: 1, Cargo: 'Técnico' };

        await empleadoController.create(req, res);
        expect(Empleado.create).toHaveBeenCalledWith(req.body);
        expect(res.redirect).toHaveBeenCalledWith('/empleados');
    });

    test('redirige a /empleados/nuevo si falla la creación', async () => {
        Empleado.create.mockRejectedValue(new Error('DB error'));
        await empleadoController.create(req, res);
        expect(res.redirect).toHaveBeenCalledWith('/empleados/nuevo');
    });
});

describe('empleadoController.editForm', () => {
    test('renderiza el formulario de edición con los datos del empleado', async () => {
        const empleadoMock = { IdEmpleado: 2, Cargo: 'Supervisor' };
        Empleado.getById.mockResolvedValue(empleadoMock);
        Usuario.getAll.mockResolvedValue([]);
        req.params.id = '2';

        await empleadoController.editForm(req, res);
        expect(res.render).toHaveBeenCalledWith('empleados/edit', expect.objectContaining({
            empleado: empleadoMock
        }));
    });

    test('redirige a /empleados si el empleado no existe', async () => {
        Empleado.getById.mockResolvedValue(null);
        Usuario.getAll.mockResolvedValue([]);
        req.params.id = '999';

        await empleadoController.editForm(req, res);
        expect(res.redirect).toHaveBeenCalledWith('/empleados');
    });
});
