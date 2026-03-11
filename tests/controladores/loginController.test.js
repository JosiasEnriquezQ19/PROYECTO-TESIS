const loginController = require('../../src/controladores/loginController');
const Usuario = require('../../src/modelos/Usuario');
const auditoria = require('../../src/middleware/auditoria');

jest.mock('../../src/modelos/Usuario');
jest.mock('../../src/middleware/auditoria', () => ({
    log: jest.fn()
}));

describe('Login Controller', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        
        req = {
            body: {},
            session: {
                regenerate: jest.fn((cb) => cb(null)),
                save: jest.fn((cb) => cb(null)),
                destroy: jest.fn((cb) => cb(null))
            }
        };
        
        res = {
            redirect: jest.fn(),
            render: jest.fn(),
            clearCookie: jest.fn()
        };
    });

    describe('mostrarLogin', () => {
        it('debe redirigir a /menu/principal si el usuario ya tiene sesión', () => {
            req.session.usuario = { id: 1, Correo: 'test@admin.com' };
            
            loginController.mostrarLogin(req, res);
            
            expect(res.redirect).toHaveBeenCalledWith('/menu/principal');
        });

        it('debe renderizar login/login si no hay sesión activa', () => {
            req.session.usuario = null;
            
            loginController.mostrarLogin(req, res);
            
            expect(res.render).toHaveBeenCalledWith('login/login', { error: null });
        });
    });

    describe('procesarLogin', () => {
        it('debe autenticar exitosamente a un administrador y redirigir a /menu', async () => {
            req.body = { correo: 'admin@carsil.com', clave: '123456' };
            const usuarioMock = { IdUsuario: 1, Correo: 'admin@carsil.com', IdRol: 1 };
            
            Usuario.autenticar.mockResolvedValue(usuarioMock);
            
            await loginController.procesarLogin(req, res);
            
            expect(Usuario.autenticar).toHaveBeenCalledWith('admin@carsil.com', '123456');
            expect(auditoria.log).toHaveBeenCalledWith(req, 'AUTH', 'LOGIN', expect.stringContaining('admin@carsil.com'));
            expect(req.session.regenerate).toHaveBeenCalled();
            expect(req.session.usuario).toEqual(expect.objectContaining({ Correo: 'admin@carsil.com' }));
            expect(req.session.save).toHaveBeenCalled();
            expect(res.redirect).toHaveBeenCalledWith('/menu');
        });

        it('debe autenticar exitosamente a un empleado (Rol 2) y redirigir a /asistencia/marcar', async () => {
            req.body = { correo: 'empleado@carsil.com', clave: '123456' };
            const usuarioMock = { IdUsuario: 2, Correo: 'empleado@carsil.com', IdRol: 2 };
            
            Usuario.autenticar.mockResolvedValue(usuarioMock);
            
            await loginController.procesarLogin(req, res);
            
            expect(res.redirect).toHaveBeenCalledWith('/asistencia/marcar');
        });

        it('debe fallar si las credenciales son incorrectas', async () => {
            req.body = { correo: 'wrong@carsil.com', clave: 'wrong' };
            Usuario.autenticar.mockResolvedValue(null);
            
            await loginController.procesarLogin(req, res);
            
            expect(auditoria.log).toHaveBeenCalledWith(req, 'AUTH', 'LOGIN_FALLIDO', expect.stringContaining('wrong@carsil.com'));
            expect(res.render).toHaveBeenCalledWith('login/login', { error: 'Correo o contrasena incorrectos.' });
        });

        it('debe manejar errores al autenticar (excepción)', async () => {
            req.body = { correo: 'error@carsil.com', clave: 'error' };
            Usuario.autenticar.mockRejectedValue(new Error('Database error'));
            
            await loginController.procesarLogin(req, res);
            
            expect(res.render).toHaveBeenCalledWith('login/login', { error: 'Error interno del servidor.' });
        });
    });

    describe('cerrarSesion', () => {
        it('debe destruir la sesión, limpiar cookies y redirigir a /login', async () => {
            req.session.usuario = { Correo: 'test@carsil.com' };
            
            await loginController.cerrarSesion(req, res);
            
            expect(auditoria.log).toHaveBeenCalledWith(req, 'AUTH', 'LOGOUT', expect.stringContaining('test@carsil.com'));
            expect(req.session.destroy).toHaveBeenCalled();
            expect(res.clearCookie).toHaveBeenCalledWith('connect.sid');
            expect(res.redirect).toHaveBeenCalledWith('/login');
        });
        
        it('debe manejar logout cuando req.session.usuario no existe', async () => {
            req.session.usuario = null;
            
            await loginController.cerrarSesion(req, res);
            
            expect(auditoria.log).toHaveBeenCalledWith(req, 'AUTH', 'LOGOUT', expect.stringContaining('desconocido'));
        });
    });
});
