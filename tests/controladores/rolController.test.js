jest.mock('../../src/modelos/Rol');
const Rol = require('../../src/modelos/Rol');
const rolController = require('../../src/controladores/rolController');

let req, res;
beforeEach(() => {
    jest.clearAllMocks();
    req = { flash: jest.fn().mockReturnValue([]), params: {}, body: {} };
    res = { render: jest.fn(), redirect: jest.fn() };
});

describe('rolController.listar', () => {
    test('renderiza la vista con los roles', async () => {
        const mock = [{ IdRol: 1, Descripcion: 'Admin' }];
        Rol.getAll.mockResolvedValue(mock);

        await rolController.listar(req, res);
        expect(res.render).toHaveBeenCalledWith('roles/listar', expect.objectContaining({ roles: mock }));
    });

    test('redirige a / si falla la obtención', async () => {
        Rol.getAll.mockRejectedValue(new Error('DB error'));
        await rolController.listar(req, res);
        expect(res.redirect).toHaveBeenCalledWith('/');
    });
});

describe('rolController.crearForm', () => {
    test('renderiza el formulario de creación', () => {
        rolController.crearForm(req, res);
        expect(res.render).toHaveBeenCalledWith('roles/crear', expect.anything());
    });
});

describe('rolController.crear', () => {
    test('crea el rol y redirige a /roles', async () => {
        Rol.create.mockResolvedValue(5);
        req.body = { Descripcion: 'Nuevo Rol' };

        await rolController.crear(req, res);
        expect(Rol.create).toHaveBeenCalledWith(req.body);
        expect(res.redirect).toHaveBeenCalledWith('/roles');
    });

    test('redirige a /roles/crear si falla la creación', async () => {
        Rol.create.mockRejectedValue(new Error('error'));
        await rolController.crear(req, res);
        expect(res.redirect).toHaveBeenCalledWith('/roles/crear');
    });
});

describe('rolController.editar', () => {
    test('actualiza el rol y redirige a /roles', async () => {
        Rol.update.mockResolvedValue(1);
        req.params.id = '2';
        req.body = { Descripcion: 'Actualizado' };

        await rolController.editar(req, res);
        expect(Rol.update).toHaveBeenCalledWith('2', req.body);
        expect(res.redirect).toHaveBeenCalledWith('/roles');
    });

    test('redirige al formulario de edición si falla', async () => {
        Rol.update.mockRejectedValue(new Error('error'));
        req.params.id = '2';
        await rolController.editar(req, res);
        expect(res.redirect).toHaveBeenCalledWith('/roles/editar/2');
    });
});

describe('rolController.eliminar', () => {
    test('elimina el rol y redirige a /roles', async () => {
        Rol.delete.mockResolvedValue(1);
        req.params.id = '3';

        await rolController.eliminar(req, res);
        expect(Rol.delete).toHaveBeenCalledWith('3');
        expect(res.redirect).toHaveBeenCalledWith('/roles');
    });

    test('redirige igualmente si falla la eliminación', async () => {
        Rol.delete.mockRejectedValue(new Error('error'));
        req.params.id = '3';
        await rolController.eliminar(req, res);
        expect(res.redirect).toHaveBeenCalledWith('/roles');
    });
});
