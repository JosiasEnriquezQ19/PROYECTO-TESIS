jest.mock('../../src/modelos/Usuario');

const Usuario = require('../../src/modelos/Usuario');
const { mostrarLogin, procesarLogin, cerrarSesion } = require('../../src/controladores/loginController');

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    console.error.mockRestore();
});

// ─────────────────────────────────────────────
// mostrarLogin
// ─────────────────────────────────────────────
describe('mostrarLogin', () => {
    test('renderiza la vista del login sin error', () => {
        const req = {};
        const res = { render: jest.fn() };

        mostrarLogin(req, res);

        expect(res.render).toHaveBeenCalledWith('login/login', { error: null });
    });
});

// ─────────────────────────────────────────────
// procesarLogin
// ─────────────────────────────────────────────
describe('procesarLogin', () => {
    let req, res;

    // Helper para simular req.session.regenerate con éxito
    function crearReqConSesion(usuario) {
        return {
            body: { correo: 'user@mail.com', clave: '1234' },
            session: {
                regenerate: jest.fn((cb) => {
                    cb(null); // sin error
                }),
                save: jest.fn((cb) => {
                    cb(null); // sin error
                }),
                usuario: null
            }
        };
    }

    beforeEach(() => {
        res = { render: jest.fn(), redirect: jest.fn() };
    });

    test('redirige a /menu si el usuario es Admin (IdRol=1)', async () => {
        const usuarioMock = { IdUsuario: 1, IdRol: 1, Nombres: 'Admin' };
        Usuario.autenticar.mockResolvedValue(usuarioMock);
        req = crearReqConSesion(usuarioMock);

        await procesarLogin(req, res);

        expect(res.redirect).toHaveBeenCalledWith('/menu');
    });

    test('redirige a /asistencia/marcar si el usuario es Empleado (IdRol=2)', async () => {
        const usuarioMock = { IdUsuario: 2, IdRol: 2, Nombres: 'Empleado' };
        Usuario.autenticar.mockResolvedValue(usuarioMock);
        req = crearReqConSesion(usuarioMock);

        await procesarLogin(req, res);

        expect(res.redirect).toHaveBeenCalledWith('/asistencia/marcar');
    });

    test('redirige a /menu si el usuario es Supervisor (IdRol=3)', async () => {
        const usuarioMock = { IdUsuario: 3, IdRol: 3, Nombres: 'Supervisor' };
        Usuario.autenticar.mockResolvedValue(usuarioMock);
        req = crearReqConSesion(usuarioMock);

        await procesarLogin(req, res);

        expect(res.redirect).toHaveBeenCalledWith('/menu');
    });

    test('renderiza error si credenciales incorrectas (usuario null)', async () => {
        Usuario.autenticar.mockResolvedValue(null);
        req = { body: { correo: 'x@mail.com', clave: 'mal' } };

        await procesarLogin(req, res);

        expect(res.render).toHaveBeenCalledWith('login/login', {
            error: 'Correo o contraseña incorrectos.'
        });
    });

    test('renderiza error si falla la autenticación (excepción de BD)', async () => {
        Usuario.autenticar.mockRejectedValue(new Error('DB timeout'));
        req = { body: { correo: 'x@mail.com', clave: '1234' } };

        await procesarLogin(req, res);

        expect(res.render).toHaveBeenCalledWith('login/login', {
            error: 'Error interno del servidor.'
        });
    });

    test('renderiza error si falla session.regenerate', async () => {
        const usuarioMock = { IdUsuario: 1, IdRol: 1 };
        Usuario.autenticar.mockResolvedValue(usuarioMock);
        req = {
            body: { correo: 'user@mail.com', clave: '1234' },
            session: {
                regenerate: jest.fn((cb) => cb(new Error('regenerate failed'))),
                save: jest.fn()
            }
        };

        await procesarLogin(req, res);

        expect(res.render).toHaveBeenCalledWith('login/login', {
            error: 'Error interno del servidor.'
        });
    });
});

// ─────────────────────────────────────────────
// cerrarSesion
// ─────────────────────────────────────────────
describe('cerrarSesion', () => {
    test('destruye la sesión y redirige a /login', () => {
        const req = {
            session: {
                destroy: jest.fn((cb) => cb(null))
            }
        };
        const res = {
            clearCookie: jest.fn(),
            redirect: jest.fn()
        };

        cerrarSesion(req, res);

        expect(req.session.destroy).toHaveBeenCalled();
        expect(res.clearCookie).toHaveBeenCalledWith('connect.sid');
        expect(res.redirect).toHaveBeenCalledWith('/login');
    });

    test('redirige a /login aunque falle la destrucción de sesión', () => {
        const req = {
            session: {
                destroy: jest.fn((cb) => cb(new Error('destroy error')))
            }
        };
        const res = {
            clearCookie: jest.fn(),
            redirect: jest.fn()
        };

        cerrarSesion(req, res);

        expect(res.redirect).toHaveBeenCalledWith('/login');
    });
});
