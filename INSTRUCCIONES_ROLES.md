# 🔐 Sistema de Control de Acceso por Roles

## ✅ Implementación Completada

### 📋 Roles del Sistema

#### 1. **Administrador** (IdRol = 1)
**Acceso Total al Sistema**

✅ **Proformas** - Ver, crear, editar, eliminar
✅ **Facturas** - Ver, crear, editar, eliminar
✅ **Clientes** - Ver, crear, editar, eliminar
✅ **Productos** - Ver, crear, editar, eliminar
✅ **Empleados** - Ver, crear, editar, eliminar
✅ **Pagos** - Ver, crear, editar, eliminar
✅ **Reportes** - Ver todos los reportes
✅ **Usuarios** - Gestión completa (crear, editar, eliminar usuarios)
✅ **Asistencias** - Ver, registrar, editar
✅ **Empresa** - Configuración del sistema

---

#### 2. **Supervisor** (IdRol = 2)
**Acceso Limitado**

✅ **Proformas** - Ver, crear, editar
✅ **Facturas** - Ver, crear
✅ **Clientes** - Ver, crear, editar
✅ **Productos** - Solo ver (lectura)
✅ **Empleados** - Solo ver (lectura)
✅ **Pagos** - Solo ver (lectura)
✅ **Reportes** - Ver reportes
❌ **Usuarios** - **NO** puede gestionar usuarios
✅ **Asistencias** - Ver, registrar
❌ **Empresa** - **NO** puede modificar configuración

---

#### 3. **Empleado** (IdRol = 3)
**Pendiente de configurar**

❌ Sin permisos asignados aún

---

## 🛠️ Cambios Realizados

### 1. **Middleware de Autenticación** (`src/middleware/auth.js`)
- ✅ `verificarAutenticacion`: Verifica que el usuario esté logueado
- ✅ `verificarRol`: Verifica que el usuario tenga el rol adecuado
- ✅ `tienePermiso`: Función auxiliar para verificar permisos en las vistas

### 2. **Menú Principal** (`src/vistas/menu/principal.ejs`)
- ✅ Elementos del menú se muestran/ocultan según el rol del usuario
- ✅ Administrador ve todas las opciones
- ✅ Supervisor no ve: Usuarios y Empresa

### 3. **Rutas Protegidas**
- ✅ **Usuarios** (`src/rutas/usuarioRoutes.js`): Solo Administrador
- ✅ **Empresa** (`src/rutas/empresaRoutes.js`): Solo Administrador

### 4. **Configuración Global** (`app.js`)
- ✅ Función `tienePermiso` disponible en todas las vistas
- ✅ Variable `user` con información del usuario logueado

---

## 📊 Estructura de la Base de Datos

### Tabla ROL
```sql
IdRol | Descripcion
------|-------------
1     | Administrador
2     | Supervisor
3     | Empleado
```

### Tabla USUARIO
El campo `IdRol` en la tabla `USUARIO` determina los permisos del usuario.

---

## 🚀 Cómo Usar el Sistema

### Para Probar:
1. **Iniciar el servidor**: `npm start`
2. **Login como Administrador**: Usar un usuario con `IdRol = 1`
   - Verás TODAS las opciones del menú
   - Podrás acceder a Usuarios y Empresa
3. **Login como Supervisor**: Usar un usuario con `IdRol = 2`
   - NO verás las opciones de Usuarios y Empresa
   - Si intentas acceder directamente a esas rutas, serás redirigido

### Crear Usuarios de Prueba:
```sql
-- Crear un Administrador
INSERT INTO USUARIO (Nombres, Apellidos, NumeroDocumento, Correo, Clave, IdRol, Estado, FechaRegistro)
VALUES ('Admin', 'Sistema', '12345678', 'admin@carsil.com', 'admin123', 1, 1, NOW());

-- Crear un Supervisor
INSERT INTO USUARIO (Nombres, Apellidos, NumeroDocumento, Correo, Clave, IdRol, Estado, FechaRegistro)
VALUES ('Super', 'Visor', '87654321', 'supervisor@carsil.com', 'super123', 2, 1, NOW());
```

---

## 🔄 Próximos Pasos

### Pendiente:
- [ ] Configurar permisos para el rol **Empleado** (IdRol = 3)
- [ ] Agregar permisos más granulares (ej: solo lectura en ciertas secciones)
- [ ] Implementar auditoría de acciones por usuario

---

## ⚠️ Importante

- **Usuarios** y **Empresa** están protegidos y solo accesibles para Administrador
- Si un Supervisor intenta acceder a estas secciones, será redirigido al menú principal
- El sistema muestra mensajes flash cuando se deniega el acceso
- El menú lateral se adapta automáticamente según el rol del usuario logueado
