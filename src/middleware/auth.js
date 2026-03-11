// Middleware para verificar si el usuario está autenticado
exports.verificarAutenticacion = (req, res, next) => {
    // Comprueba si el usuario está logueado (si existe una sesión de usuario)
    if (req.session && req.session.usuario) {
        // Si está autenticado, guarda el usuario en req.user para usarlo en las vistas
        req.user = req.session.usuario;
        // Evitar que el navegador cachee páginas protegidas
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        return next();
    }
    
    // Si la ruta es del login o recuperación de contraseña, permitir acceso
    if (req.path === '/login' || req.path.startsWith('/recuperar')) {
        return next();
    }
    
    // Si no está autenticado, redirigir al login
    req.flash('error', 'Debe iniciar sesión para acceder a esta página');
    return res.redirect('/login');
};

// Middleware para verificar roles específicos
exports.verificarRol = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.session || !req.session.usuario) {
            req.flash('error', 'Debe iniciar sesión para acceder a esta página');
            return res.redirect('/login');
        }

        const usuario = req.session.usuario;
        const rolUsuario = usuario.IdRol;

        // Verificar si el rol del usuario está en la lista de roles permitidos
        if (rolesPermitidos.includes(rolUsuario)) {
            return next();
        }

        // Si no tiene permiso, redirigir según el rol
        req.flash('error', 'No tiene permisos para acceder a esta página');
        
        // Si es empleado (IdRol 2), redirigir a marcado de asistencia
        if (rolUsuario === 2) {
            return res.redirect('/asistencia/marcar');
        }
        
        // Para otros roles, redirigir al menú principal
        return res.redirect('/menu/principal');
    };
};

// Función auxiliar para verificar permisos en las vistas
exports.tienePermiso = (usuario, modulo) => {
    if (!usuario || !usuario.IdRol) {
        return false;
    }

    const permisos = {
        // Administrador (IdRol = 1) - Acceso total
        1: {
            proformas: true,
            facturas: true,
            clientes: true,
            productos: true,
            empleados: true,
            pagos: true,
            reportes: true,
            usuarios: true,
            asistencias: true,
            empresa: true,
            auditoria: true
        },
        // Empleado (IdRol = 2) - Solo acceso a marcado de asistencia
        2: {
            proformas: false,
            facturas: false,
            clientes: false,
            productos: false,
            empleados: false,
            pagos: false,
            reportes: false,
            usuarios: false,
            asistencias: false,  // No acceso a gestión de asistencias
            empresa: false,
            auditoria: false
        },
        // Supervisor (IdRol = 3) - Acceso limitado
        3: {
            proformas: true,
            facturas: true,
            clientes: true,
            productos: true,  // Solo ver
            empleados: true,  // Solo ver
            pagos: true,      // Solo ver
            reportes: true,
            usuarios: false,  // NO acceso
            asistencias: true,
            empresa: false,   // NO acceso
            auditoria: false
        }
    };

    return permisos[usuario.IdRol]?.[modulo] || false;
};
