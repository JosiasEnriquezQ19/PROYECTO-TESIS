jest.mock('../../src/modelos/Remuneracion');
jest.mock('../../src/modelos/Usuario');

const Remuneracion = require('../../src/modelos/Remuneracion');
const Usuario = require('../../src/modelos/Usuario');
const remuneracionController = require('../../src/controladores/remuneracionController');

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

describe('remuneracionController.listar', () => {
    test('renderiza la vista con las remuneraciones', async () => {
        const mock = [{ IdRemuneracion: 1, Total: 1800 }];
        Remuneracion.getAll.mockResolvedValue(mock);

        await remuneracionController.listar(req, res);
        expect(res.render).toHaveBeenCalledWith('pagos/listar', expect.objectContaining({
            remuneraciones: mock
        }));
    });

    test('renderiza lista vacía con error si falla la BD', async () => {
        Remuneracion.getAll.mockRejectedValue(new Error('DB error'));
        await remuneracionController.listar(req, res);
        expect(res.render).toHaveBeenCalledWith('pagos/listar', expect.objectContaining({
            remuneraciones: [],
            error: expect.stringContaining('Error al obtener')
        }));
    });
});

describe('remuneracionController.crear', () => {
    test('crea la remuneración y redirige con éxito', async () => {
        Remuneracion.create.mockResolvedValue({ insertId: 1 });
        req.body = {
            IdUsuario: 1, Periodo: '2026-01', FechaInicio: '2026-01-01',
            FechaFin: '2026-01-31', SueldoBase: 1500, Total: 1500
        };

        await remuneracionController.crear(req, res);
        expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('?success='));
    });

    test('redirige con error si faltan campos obligatorios', async () => {
        req.body = { IdUsuario: 1 }; // faltan campos
        await remuneracionController.crear(req, res);
        expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('?error='));
        expect(Remuneracion.create).not.toHaveBeenCalled();
    });

    test('redirige con error de duplicado (ER_DUP_ENTRY)', async () => {
        const err = new Error('Duplicate');
        err.code = 'ER_DUP_ENTRY';
        Remuneracion.create.mockRejectedValue(err);
        req.body = {
            IdUsuario: 1, Periodo: '2026-01', FechaInicio: '2026-01-01',
            FechaFin: '2026-01-31', SueldoBase: 1500, Total: 1500
        };
        await remuneracionController.crear(req, res);
        expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('error='));
    });
});

describe('remuneracionController.crearForm', () => {
    test('renderiza el formulario con los usuarios', async () => {
        const usuariosMock = [{ IdUsuario: 1, Nombres: 'Ana' }];
        Usuario.listar.mockResolvedValue(usuariosMock);

        await remuneracionController.crearForm(req, res);
        expect(res.render).toHaveBeenCalledWith('pagos/crear', expect.objectContaining({
            usuarios: usuariosMock
        }));
    });

    test('redirige con error si falla la carga de usuarios', async () => {
        Usuario.listar.mockRejectedValue(new Error('DB error'));
        await remuneracionController.crearForm(req, res);
        expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('/pagos/remuneracion?error='));
    });
});
