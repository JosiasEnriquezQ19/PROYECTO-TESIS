const Cliente = require('../modelos/Cliente');
const Empleado = require('../modelos/Empleado');
const Proforma = require('../modelos/Proforma');
const Producto = require('../modelos/Producto');

exports.mostrarMenu = async (req, res) => {
    try {
        // Objeto para almacenar estadísticas
        let estadisticas = {
            clientes: 0,
            empleados: 0,
            proformas: 0,
            productos: 0
        };

        // Intentar obtener cada estadística de forma individual
        try {
            estadisticas.clientes = await Cliente.contarActivos();
        } catch (err) {
            console.error('Error al contar clientes:', err);
        }

        try {
            estadisticas.empleados = await Empleado.contarActivos();
        } catch (err) {
            console.error('Error al contar empleados:', err);
        }

        try {
            estadisticas.proformas = await Proforma.contarProformas();
        } catch (err) {
            console.error('Error al contar proformas:', err);
        }

        try {
            estadisticas.productos = await Producto.contarActivos();
        } catch (err) {
            console.error('Error al contar productos:', err);
        }

        // Pasar datos dinámicos a la vista (las variables globales user y tienePermiso ya están disponibles via res.locals)
        res.render('menu/principal', { 
            estadisticas: estadisticas
        });
    } catch (error) {
        console.error('Error general al obtener estadísticas:', error);
        // En caso de error, renderizar la vista con estadísticas en cero
        res.render('menu/principal', { 
            estadisticas: {
                clientes: 0,
                empleados: 0,
                proformas: 0,
                productos: 0
            }
        });
    }
};