# Proyecto Gestión Proforma — CARSIL

Sistema web para la gestión de proformas, clientes, ventas y reportes analíticos para CARSIL Equipos y Servicios SAC. Construido con Node.js, Express, EJS y MySQL.

## Características

- Gestión de entidades: Proformas, Clientes, Productos, Facturas, Pagos, Empleados, Contratos, Roles y Usuarios.
- Panel de reportes con KPIs y gráficos (proformas, estados, top clientes, ventas mensuales).
- Autenticación (login) y middleware de autorización.
- Plantillas EJS con diseño de menú y estilos personalizados.
- Scripts SQL y utilitarios para inicializar y actualizar la base de datos.

## Tecnologías

- Node.js + Express
- EJS (vistas)
- MySQL
- Bootstrap/Bootstrap Icons + CSS propio

## Estructura del proyecto (resumen)

```
app.js
package.json
src/
	bd/
		conexion.js
		script_database.txt
		instalar_triggers_venta.js
		actualizar_ventas.sql
	controladores/ (controllers)
	modelos/ (models)
	rutas/ (routes)
	vistas/
		reportes/dashboard.ejs
		Proforma_MODELO.html
publico/ (assets)
docs/IMPLEMENTACION_VENTAS.md
```

## Requisitos previos

- Node.js 16 o superior: https://nodejs.org
- MySQL 5.7/8.0 instalado y en ejecución
- Cuenta de usuario MySQL con permisos para crear/alterar tablas y triggers

## Configuración rápida (Windows PowerShell)

1) Instalar dependencias

```powershell
cd "C:\Users\Josia\OneDrive\Documentos\4to Ciclo IDAT\Proyecto Certificador de Desarrollo de Software 2\PRESENTACION\Proyecto Gestion Proforma"
npm install
```

2) Configurar conexión a base de datos

- Edita `src/bd/conexion.js` y ajusta host, user, password y database a tu entorno local.
- Base de datos esperada (por defecto): `dbventasdemo`.

3) Inicializar base de datos

- Crea la base y estructura ejecutando el script SQL. Puedes usar MySQL Workbench o, si tienes el cliente MySQL en PATH, desde PowerShell:

```powershell
# Ajusta usuario y contraseña según tu entorno
mysql -u root -p dbventasdemo < .\src\bd\script_database.txt
```

4) (Opcional) Instalar triggers de ventas

```powershell
node .\src\bd\instalar_triggers_venta.js
```

5) (Opcional) Aplicar actualizaciones SQL

```powershell
mysql -u root -p dbventasdemo < .\src\bd\actualizar_ventas.sql
```

## Ejecutar la aplicación

```powershell
# Arrancar
node app.js

# Abrir en el navegador
# http://localhost:3000
```

Sugerencia: si tu `package.json` define un script `start`, también puedes usar:

```powershell
npm start
```

Para desarrollo con autorecarga, puedes usar nodemon:

```powershell
npx nodemon app.js
```

## Rutas típicas (orientativas)

- Autenticación: `/login`
- Proformas: `/proformas` (listar/crear/editar)
- Reportes: `/reportes` o desde el menú de reportes (vista `reportes/dashboard.ejs`)

Nota: La navegación exacta depende de las rutas definidas en `src/rutas/*.js` y del menú principal.

## Personalización del menú y estilos

El diseño del menú y los estilos asociados se mantienen en las vistas EJS y la carpeta `publico/css`. Cualquier ajuste visual debe respetar estas hojas de estilo para conservar la apariencia existente.

## Problemas comunes y solución

- Error de conexión MySQL (ER_ACCESS_DENIED / ECONNREFUSED):
	- Verifica credenciales en `src/bd/conexion.js` y que MySQL esté corriendo.
	- Confirma que la base `dbventasdemo` existe y contiene las tablas.

- Puerto 3000 en uso:
	- Cambia el puerto en `app.js` (por ejemplo, a 3001) y vuelve a iniciar.

- Espacios en rutas (OneDrive):
	- Usa comillas en PowerShell como en los ejemplos de arriba.

## Documentación adicional

- `docs/IMPLEMENTACION_VENTAS.md`: guía específica para la implementación de ventas.
- `src/vistas/Proforma_MODELO.html`: plantilla HTML de referencia para proformas.

## Contribuir

1. Crea una rama desde `main`.
2. Realiza cambios y agrega pruebas si corresponde.
3. Abre un Pull Request describiendo el cambio y el impacto.

## Licencia

Proyecto de uso educativo/interno para CARSIL Equipos y Servicios SAC. Si deseas agregar una licencia abierta (MIT, GPL, etc.), crea un archivo `LICENSE` en la raíz del proyecto.

