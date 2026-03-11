jest.mock('../../src/modelos/Usuario');

const Usuario = require('../../src/modelos/Usuario');
const {
    listarUsuarios,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario
} = require('../../src/controladores/usuarioController');

let req, res;
beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    req = {
        flash: jest.fn().mockReturnValue([]),
        params: {}, body: {}
    };
    res = { render: jest.fn(), redirect: jest.fn(), status: jest.fn().mockReturnThis(), send: jest.fn() };
});
afterEach(() => { console.error.mockRestore(); console.log.mockRestore(); });

describe('listarUsuarios', () => {
    test('renderiza la vista con los usuarios', async () => {
        const mock = [{ IdUsuario: 1, Nombres: 'Admin' }];
        Usuario.listar.mockResolvedValue(mock);

        await listarUsuarios(req, res);
        expect(res.render).toHaveBeenCalledWith('usuarios/listar', expect.objectContaining({ usuarios: mock }));
    });

    test('retorna 500 si falla la obtención', async () => {
        Usuario.listar.mockRejectedValue(new Error('DB error'));
        await listarUsuarios(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('crearUsuario', () => {
    test('crea el usuario y redirige a /usuarios', async () => {
        Usuario.crear.mockResolvedValue(10);
        req.body = { Nombres: 'Juan', Correo: 'juan@mail.com', Clave: '123456', IdRol: 1, NumeroDocumento: '12345678', Apellidos: 'Pérez' };

        await crearUsuario(req, res);
        expect(res.redirect).toHaveBeenCalledWith('/usuarios');
    });

    test('renderiza el formulario con error si falla la creación', async () => {
        Usuario.crear.mockRejectedValue(new Error('Correo ya existe'));
        Usuario.obtenerRoles.mockResolvedValue([{ IdRol: 1, Descripcion: 'Admin' }]);
        req.body = { Nombres: 'Juan', Correo: 'juan@mail.com' };

        await crearUsuario(req, res);
        expect(res.render).toHaveBeenCalledWith('usuarios/crear', expect.objectContaining({
            error: 'Correo ya existe'
        }));
    });
});

describe('actualizarUsuario', () => {
    beforeEach(() => {
        req.params.id = '5';
    });

    test('actualiza el usuario (sin cambiar contraseña) y redirige', async () => {
        Usuario.actualizar.mockResolvedValue(true);
        req.body = { Nombres: 'Editado', Clave: '', ConfirmarClave: '' };

        await actualizarUsuario(req, res);
        expect(res.redirect).toHaveBeenCalledWith('/usuarios');
        // No debe incluir Clave en los datos enviados
        expect(Usuario.actualizar).toHaveBeenCalledWith('5', expect.not.objectContaining({ Clave: '' }));
    });

    test('actualiza con nueva contraseña válida', async () => {
        Usuario.actualizar.mockResolvedValue(true);
        req.body = { Nombres: 'Editado', Clave: 'nueva123', ConfirmarClave: 'nueva123' };

        await actualizarUsuario(req, res);
        expect(res.redirect).toHaveBeenCalledWith('/usuarios');
        expect(Usuario.actualizar).toHaveBeenCalledWith('5', expect.objectContaining({ Clave: 'nueva123' }));
    });

    test('renderiza error si las contraseñas no coinciden', async () => {
        Usuario.obtenerPorId.mockResolvedValue({ IdUsuario: 5 });
        Usuario.obtenerRoles.mockResolvedValue([]);
        req.body = { Nombres: 'Editado', Clave: 'abc123', ConfirmarClave: 'xyz789' };

        await actualizarUsuario(req, res);
        expect(res.render).toHaveBeenCalledWith('usuarios/editar', expect.objectContaining({
            error: 'Las contraseñas no coinciden'
        }));
    });

    test('renderiza error si la contraseña es muy corta', async () => {
        Usuario.obtenerPorId.mockResolvedValue({ IdUsuario: 5 });
        Usuario.obtenerRoles.mockResolvedValue([]);
        req.body = { Nombres: 'Editado', Clave: '123', ConfirmarClave: '123' };

        await actualizarUsuario(req, res);
        expect(res.render).toHaveBeenCalledWith('usuarios/editar', expect.objectContaining({
            error: expect.stringContaining('6 caracteres')
        }));
    });
});

describe('eliminarUsuario', () => {
    test('elimina el usuario y redirige a /usuarios', async () => {
        Usuario.eliminar.mockResolvedValue(true);
        req.params.id = '3';

        await eliminarUsuario(req, res);
        expect(Usuario.eliminar).toHaveBeenCalledWith('3');
        expect(res.redirect).toHaveBeenCalledWith('/usuarios');
    });
});
