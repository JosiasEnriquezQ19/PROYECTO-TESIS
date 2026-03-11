const { verificarAutenticacion, verificarRol, tienePermiso } = require('../../src/middleware/auth');

// ─────────────────────────────────────────────
// verificarAutenticacion
// ─────────────────────────────────────────────
describe('verificarAutenticacion', () => {
    let req, res, next;

    beforeEach(() => {
        req = { session: {}, path: '/clientes', flash: jest.fn() };
        res = { redirect: jest.fn() };
        next = jest.fn();
    });

    test('redirige a /login si no hay sesión', () => {
        verificarAutenticacion(req, res, next);
        expect(res.redirect).toHaveBeenCalledWith('/login');
        expect(next).not.toHaveBeenCalled();
    });

    test('llama next() y asigna req.user si hay usuario en sesión', () => {
        req.session.usuario = { IdUsuario: 1, IdRol: 1, Nombre: 'Admin' };
        verificarAutenticacion(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(req.user).toEqual(req.session.usuario);
        expect(res.redirect).not.toHaveBeenCalled();
    });

    test('permite acceso a la ruta /login sin sesión', () => {
        req.path = '/login';
        verificarAutenticacion(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(res.redirect).not.toHaveBeenCalled();
    });

    test('permite acceso a rutas /recuperar/* sin sesión', () => {
        req.path = '/recuperar/codigo';
        verificarAutenticacion(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(res.redirect).not.toHaveBeenCalled();
    });
});

// ─────────────────────────────────────────────
// verificarRol
// ─────────────────────────────────────────────
describe('verificarRol', () => {
    let req, res, next;

    beforeEach(() => {
        req = { session: {}, flash: jest.fn() };
        res = { redirect: jest.fn() };
        next = jest.fn();
    });

    test('redirige a /login si no hay sesión', () => {
        const middleware = verificarRol(1);
        middleware(req, res, next);
        expect(res.redirect).toHaveBeenCalledWith('/login');
    });

    test('llama next() si el rol del usuario está permitido', () => {
        req.session.usuario = { IdRol: 1 };
        const middleware = verificarRol(1, 3);
        middleware(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(res.redirect).not.toHaveBeenCalled();
    });

    test('redirige a /asistencia/marcar si el rol es empleado (IdRol=2)', () => {
        req.session.usuario = { IdRol: 2 };
        const middleware = verificarRol(1, 3); // empleado no está permitido
        middleware(req, res, next);
        expect(res.redirect).toHaveBeenCalledWith('/asistencia/marcar');
        expect(next).not.toHaveBeenCalled();
    });

    test('redirige a /menu/principal si el rol no tiene permiso y no es empleado', () => {
        req.session.usuario = { IdRol: 3 };
        const middleware = verificarRol(1); // supervisor no está en la lista
        middleware(req, res, next);
        expect(res.redirect).toHaveBeenCalledWith('/menu/principal');
    });
});

// ─────────────────────────────────────────────
// tienePermiso
// ─────────────────────────────────────────────
describe('tienePermiso', () => {
    test('administrador (IdRol=1) tiene acceso a todos los módulos', () => {
        const usuario = { IdRol: 1 };
        expect(tienePermiso(usuario, 'clientes')).toBe(true);
        expect(tienePermiso(usuario, 'reportes')).toBe(true);
        expect(tienePermiso(usuario, 'usuarios')).toBe(true);
    });

    test('empleado (IdRol=2) no tiene acceso a ningún módulo', () => {
        const usuario = { IdRol: 2 };
        expect(tienePermiso(usuario, 'clientes')).toBe(false);
        expect(tienePermiso(usuario, 'proformas')).toBe(false);
    });

    test('supervisor (IdRol=3) no tiene acceso a usuarios ni empresa', () => {
        const usuario = { IdRol: 3 };
        expect(tienePermiso(usuario, 'usuarios')).toBe(false);
        expect(tienePermiso(usuario, 'empresa')).toBe(false);
        expect(tienePermiso(usuario, 'clientes')).toBe(true);
    });

    test('retorna false si usuario es null', () => {
        expect(tienePermiso(null, 'clientes')).toBe(false);
    });

    test('retorna false para módulo desconocido', () => {
        const usuario = { IdRol: 1 };
        expect(tienePermiso(usuario, 'modulo_inexistente')).toBe(false);
    });
});
