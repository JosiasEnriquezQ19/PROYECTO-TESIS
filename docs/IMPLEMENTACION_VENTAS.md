# Implementación del Trigger para Facturas y Ventas

Este documento explica cómo implementar el trigger que automáticamente actualiza la tabla VENTA cuando se registra una factura o cuando cambia su estado a "PAGADA".

## Archivos Modificados/Creados

1. `src/bd/venta_triggers.sql` - Script SQL con los triggers
2. `src/bd/actualizar_ventas.sql` - Script para actualizar ventas existentes
3. `src/controladores/reporteController.js` - Controlador de reportes actualizado
4. `src/rutas/reporteRoutes.js` - Rutas actualizadas para los nuevos endpoints
5. `src/vistas/reportes/dashboard.ejs` - Vista del dashboard actualizada

## Pasos para Implementar

### 1. Ejecutar los Scripts SQL

1. Abre tu cliente MySQL (por ejemplo, MySQL Workbench)
2. Conéctate a tu base de datos DBVENTASDEMO
3. Ejecuta el script `actualizar_ventas.sql` para crear los triggers y actualizar los datos históricos

```sql
source ruta/a/tu/proyecto/src/bd/actualizar_ventas.sql
```

### 2. Verificar que los Triggers Estén Creados

```sql
SHOW TRIGGERS LIKE 'FACTURA';
```

Deberías ver dos triggers: `after_factura_insert` y `after_factura_update`

### 3. Verificar los Datos Iniciales en la Tabla VENTA

```sql
SELECT * FROM VENTA;
```

Deberías ver registros que corresponden a las facturas existentes.

### 4. Reiniciar el Servidor Node.js

```bash
# Detener el servidor actual (Ctrl+C) y luego
npm start
```

## Cómo Funcionan los Triggers

1. **Trigger after_factura_insert**:
   - Se ejecuta automáticamente después de insertar una nueva factura
   - Si la factura tiene estado "PAGADA", se inserta en VENTA con estado "COMPLETADA"
   - Si la factura tiene otro estado, se inserta en VENTA con ese mismo estado

2. **Trigger after_factura_update**:
   - Se ejecuta automáticamente después de actualizar una factura existente
   - Si el estado cambió a "PAGADA", actualiza o inserta un registro en VENTA con estado "COMPLETADA"
   - Para otros cambios, actualiza el registro correspondiente en VENTA

## Nuevas Funcionalidades en el Dashboard

1. **KPIs de Ventas**:
   - Ventas del mes actual
   - Total de ventas completadas
   - Eficiencia de ventas (% de ventas completadas vs total proformas)

2. **Gráficos de Ventas**:
   - Ventas mensuales (cantidad y total)
   - Top 5 clientes por ventas

## Pruebas a Realizar

1. **Crear una Nueva Factura**:
   - Verifica que se agregue automáticamente a la tabla VENTA

2. **Cambiar el Estado de una Factura a "PAGADA"**:
   - Verifica que se actualice el registro en VENTA a "COMPLETADA"

3. **Revisar el Dashboard**:
   - Verifica que los nuevos KPIs y gráficos muestren datos correctos
   - Verifica que la exportación a PDF incluya los nuevos gráficos

## Solución de Problemas

- Si los triggers no funcionan, verifica los errores en el log de MySQL
- Si los gráficos no se muestran, revisa la consola del navegador para ver errores JavaScript
- Si los datos no se actualizan en tiempo real, utiliza el botón "Actualizar" en el dashboard

## Recomendaciones

- Los triggers optimizan el proceso de actualización de ventas, asegurando consistencia en la base de datos
- Para mejores reportes, clasifica las facturas con estados claros: PENDIENTE, PAGADA, ANULADA
- Considera agregar más filtros en el dashboard para análisis más detallados (por fechas, clientes, etc.)
