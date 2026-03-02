const Pago = require('../modelos/Pago');
const Empleado = require('../modelos/Empleado');
const Asistencia = require('../modelos/Asistencia');
const db = require('../bd/conexion');

const pagoController = {
    listar: async (req, res) => {
        try {
            console.log('Controlador de pagos listar ejecutándose...');
            
            // Hacer la consulta directamente en el controlador para evitar problemas con el modelo
            const sql = `
                SELECT p.*, 
                       CONCAT(u.Nombres, ' ', u.Apellidos) as NombreEmpleado
                FROM PAGO p
                LEFT JOIN EMPLEADO e ON p.IdEmpleado = e.IdEmpleado
                LEFT JOIN USUARIO u ON e.IdUsuario = u.IdUsuario
                ORDER BY p.Anio DESC, p.Semana DESC, p.FechaInicio DESC
            `;
            const [pagos] = await db.query(sql);
            
            console.log('Pagos obtenidos:', pagos);
            res.render('pagos/listar', { 
                pagos, 
                user: req.user || null,
                success: req.flash('success'),
                error: req.flash('error'),
                messages: req.flash() 
            });
        } catch (error) {
            console.error('Error en controlador de pagos:', error);
            req.flash('error', 'Error al obtener los pagos');
            res.redirect('/');
        }
    },
    crearForm: async (req, res) => {
        try {
            const empleados = await Empleado.getAll();
            res.render('pagos/crear', { 
                empleados,
                user: req.user || null,
                success: req.flash('success'),
                error: req.flash('error'),
                messages: req.flash() 
            });
        } catch (error) {
            req.flash('error', 'Error al cargar empleados');
            res.redirect('/pagos/listar');
        }
    },
    crear: async (req, res) => {
        try {
            // Calcular automáticamente las horas trabajadas desde asistencias antes de crear
            const { IdEmpleado, FechaInicio, FechaFin } = req.body;
            
            if (IdEmpleado && FechaInicio && FechaFin) {
                const resultadoHoras = await Asistencia.getTotalHorasTrabajadasRango(IdEmpleado, FechaInicio, FechaFin);
                req.body.HorasTrabajadas = resultadoHoras.TotalHoras || 0;
                
                // Log para debugging
                console.log(`Horas calculadas automáticamente: ${req.body.HorasTrabajadas} para empleado ${IdEmpleado} del ${FechaInicio} al ${FechaFin}`);
            }
            
            await Pago.create(req.body);
            req.flash('success', 'Pago registrado correctamente con horas calculadas desde asistencias');
            res.redirect('/pagos/listar');
        } catch (error) {
            console.error('Error al crear pago:', error);
            req.flash('error', 'Error al registrar el pago: ' + error.message);
            res.redirect('/pagos/crear');
        }
    },
    editarForm: async (req, res) => {
        try {
            const pago = await Pago.getById(req.params.id);
            const empleados = await Empleado.getAll();
            res.render('pagos/edit', { 
                pago, 
                empleados,
                user: req.user || null,
                success: req.flash('success'),
                error: req.flash('error'),
                messages: req.flash() 
            });
        } catch (error) {
            req.flash('error', 'Error al cargar el pago');
            res.redirect('/pagos/listar');
        }
    },
    editar: async (req, res) => {
        try {
            // Recalcular automáticamente las horas trabajadas desde asistencias antes de actualizar
            const { IdEmpleado, FechaInicio, FechaFin } = req.body;
            
            if (IdEmpleado && FechaInicio && FechaFin) {
                const resultadoHoras = await Asistencia.getTotalHorasTrabajadasRango(IdEmpleado, FechaInicio, FechaFin);
                req.body.HorasTrabajadas = resultadoHoras.TotalHoras || 0;
                
                // Log para debugging
                console.log(`Horas recalculadas: ${req.body.HorasTrabajadas} para empleado ${IdEmpleado} del ${FechaInicio} al ${FechaFin}`);
            }
            
            await Pago.update(req.params.id, req.body);
            req.flash('success', 'Pago actualizado correctamente con horas recalculadas desde asistencias');
            res.redirect('/pagos/listar');
        } catch (error) {
            console.error('Error al actualizar pago:', error);
            req.flash('error', 'Error al actualizar el pago: ' + error.message);
            res.redirect(`/pagos/editar/${req.params.id}`);
        }
    },
    eliminar: async (req, res) => {
        try {
            await Pago.delete(req.params.id);
            req.flash('success', 'Pago eliminado correctamente');
        } catch (error) {
            req.flash('error', 'Error al eliminar el pago');
        }
        res.redirect('/pagos/listar');
    },
    calcularPagoSemanal: async (req, res) => {
        try {
            const { IdEmpleado, Semana, Anio, FechaInicio, FechaFin, Bonificaciones, Descuentos } = req.body;
            
            // Usar el procedimiento almacenado que ya integra las asistencias
            const query = 'CALL CalcularPagoSemanal(?, ?, ?, ?, ?, ?, ?)';
            const [resultado] = await db.query(query, [
                IdEmpleado, 
                Semana, 
                Anio, 
                FechaInicio, 
                FechaFin, 
                Bonificaciones || 0, 
                Descuentos || 0
            ]);
            
            req.flash('success', `Pago semanal calculado correctamente. Horas: ${resultado[0]?.HorasCalculadas || 0}h, Sueldo: S/ ${resultado[0]?.SueldoCalculado || 0}`);
            res.redirect('/pagos/listar');
        } catch (error) {
            console.error('Error al calcular pago semanal:', error);
            req.flash('error', 'Error al calcular el pago semanal: ' + error.message);
            res.redirect('/pagos/listar');
        }
    },

    // Función AJAX para obtener horas trabajadas desde asistencias
    obtenerHorasTrabajadas: async (req, res) => {
        try {
            const { IdEmpleado, FechaInicio, FechaFin } = req.query;
            
            if (!IdEmpleado || !FechaInicio || !FechaFin) {
                return res.status(400).json({
                    success: false,
                    error: 'Se requieren IdEmpleado, FechaInicio y FechaFin'
                });
            }
            
            // Usar el modelo de Asistencia para obtener las horas
            const resultado = await Asistencia.getTotalHorasTrabajadasRango(IdEmpleado, FechaInicio, FechaFin);
            
            res.json({
                success: true,
                horasReales: resultado.TotalHoras || 0,
                diasTrabajados: resultado.TotalDias || 0,
                diasPresente: resultado.DiasPresente || 0,
                diasTardanza: resultado.DiasTardanza || 0,
                diasAusente: resultado.DiasAusente || 0
            });
            
        } catch (error) {
            console.error('Error al obtener horas trabajadas:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener las horas trabajadas desde asistencias',
                details: error.message
            });
        }
    },

    // Función para registrar asistencias diarias rápidamente desde el módulo de pagos
    registrarAsistenciaDiaria: async (req, res) => {
        try {
            const { IdEmpleado, Fecha, HoraEntrada, HoraSalida, TipoAsistencia, Observaciones } = req.body;
            
            // Usar el procedimiento almacenado para registrar asistencia
            const query = 'CALL RegistrarAsistencia(?, ?, ?, ?, ?, ?)';
            await db.query(query, [
                IdEmpleado, 
                Fecha, 
                HoraEntrada || null,
                HoraSalida || null,
                TipoAsistencia || 'REGULAR',
                Observaciones || null
            ]);
            
            req.flash('success', 'Asistencia registrada correctamente');
            res.redirect('/pagos/crear');
        } catch (error) {
            console.error('Error al registrar asistencia:', error);
            req.flash('error', 'Error al registrar asistencia: ' + error.message);
            res.redirect('/pagos/crear');
        }
    },

    // Función para obtener resumen de asistencias por empleado y período
    obtenerResumenAsistencias: async (req, res) => {
        try {
            const { IdEmpleado, FechaInicio, FechaFin } = req.query;
            
            if (!IdEmpleado || !FechaInicio || !FechaFin) {
                return res.status(400).json({
                    success: false,
                    error: 'Se requieren IdEmpleado, FechaInicio y FechaFin'
                });
            }
            
            // Consultar asistencias detalladas del período
            const queryAsistencias = `
                SELECT 
                    a.Fecha,
                    a.HoraEntrada,
                    a.HoraSalida,
                    a.HorasTrabajadas,
                    a.Estado,
                    a.TipoAsistencia,
                    a.Observaciones
                FROM ASISTENCIA a
                WHERE a.IdEmpleado = ? 
                AND a.Fecha BETWEEN ? AND ?
                ORDER BY a.Fecha ASC
            `;
            
            const [asistencias] = await db.query(queryAsistencias, [IdEmpleado, FechaInicio, FechaFin]);
            
            // Obtener resumen usando la función del modelo
            const resumen = await Asistencia.getTotalHorasTrabajadasRango(IdEmpleado, FechaInicio, FechaFin);
            
            res.json({
                success: true,
                asistenciasDetalle: asistencias,
                resumen: resumen,
                periodo: { FechaInicio, FechaFin }
            });
            
        } catch (error) {
            console.error('Error al obtener resumen de asistencias:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener el resumen de asistencias',
                details: error.message
            });
        }
    },

    // Función para calcular horas trabajadas automáticamente desde asistencias
    calcularHorasTrabajadas: async (req, res) => {
        try {
            const { idEmpleado, fechaInicio, fechaFin } = req.query;
            
            if (!idEmpleado || !fechaInicio || !fechaFin) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requieren idEmpleado, fechaInicio y fechaFin'
                });
            }
            
            // Consultar asistencias del empleado en el período especificado
            const queryAsistencias = `
                SELECT 
                    a.Fecha,
                    a.JornadaLaboral,
                    a.HoraEntrada,
                    a.HoraSalida,
                    a.HorasTrabajadas,
                    a.Estado,
                    a.TipoAsistencia,
                    DAYNAME(a.Fecha) as DiaSemana
                FROM ASISTENCIA a
                WHERE a.IdEmpleado = ? 
                AND a.Fecha BETWEEN ? AND ?
                AND a.Estado IN ('PRESENTE', 'TARDANZA')
                ORDER BY a.Fecha ASC
            `;
            
            const [asistencias] = await db.query(queryAsistencias, [idEmpleado, fechaInicio, fechaFin]);
            
            if (asistencias.length === 0) {
                return res.json({
                    success: false,
                    message: 'No se encontraron asistencias registradas para el período seleccionado',
                    horasTrabajadas: 0,
                    desglose: []
                });
            }
            
            let totalHoras = 0;
            const desglose = [];
            
            // Calcular el total de horas y preparar desglose
            asistencias.forEach(asistencia => {
                const horas = parseFloat(asistencia.HorasTrabajadas) || 0;
                totalHoras += horas;
                
                // Formatear fecha para mostrar
                const fechaFormateada = new Date(asistencia.Fecha).toLocaleDateString('es-PE', {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit'
                });
                
                desglose.push({
                    fecha: fechaFormateada,
                    fechaCompleta: asistencia.Fecha,
                    jornada: asistencia.JornadaLaboral,
                    horaEntrada: asistencia.HoraEntrada,
                    horaSalida: asistencia.HoraSalida,
                    horas: horas,
                    estado: asistencia.Estado,
                    tipo: asistencia.TipoAsistencia
                });
            });
            
            // Calcular estadísticas adicionales
            const diasTrabajados = asistencias.length;
            const promedioHorasPorDia = totalHoras / diasTrabajados;
            
            // Verificar si es una semana completa aproximada
            const fechaInicioObj = new Date(fechaInicio);
            const fechaFinObj = new Date(fechaFin);
            const diasEnPeriodo = Math.ceil((fechaFinObj - fechaInicioObj) / (1000 * 60 * 60 * 24)) + 1;
            
            let mensaje = `Se encontraron ${diasTrabajados} día(s) de asistencia en el período.`;
            if (totalHoras > 0) {
                mensaje += ` Promedio: ${promedioHorasPorDia.toFixed(1)}h/día.`;
            }
            
            res.json({
                success: true,
                message: mensaje,
                horasTrabajadas: totalHoras,
                desglose: desglose,
                estadisticas: {
                    diasTrabajados: diasTrabajados,
                    diasEnPeriodo: diasEnPeriodo,
                    promedioHorasPorDia: promedioHorasPorDia,
                    eficiencia: diasEnPeriodo > 0 ? (diasTrabajados / diasEnPeriodo * 100).toFixed(1) : 0
                }
            });
            
        } catch (error) {
            console.error('Error al calcular horas trabajadas:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al calcular las horas',
                error: error.message,
                horasTrabajadas: 0
            });
        }
    },

    // Función para calcular horas trabajadas desde la API
    calcularHorasTrabajadas: async (req, res) => {
        const { idEmpleado, fechaInicio, fechaFin } = req.query;

        // 1. Validación de parámetros
        if (!idEmpleado || !fechaInicio || !fechaFin) {
            return res.status(400).json({ 
                success: false, 
                message: 'Parámetros incompletos. Se requiere idEmpleado, fechaInicio y fechaFin.' 
            });
        }

        try {
            // 2. Consulta a la base de datos
            const [asistencias] = await db.query(
                `SELECT Fecha, JornadaLaboral, HorasTrabajadas
                 FROM ASISTENCIA
                 WHERE IdEmpleado = ? AND Fecha BETWEEN ? AND ?
                 AND Estado IN ('PRESENTE', 'TARDANZA')
                 ORDER BY Fecha ASC`,
                [idEmpleado, fechaInicio, fechaFin]
            );
            
            // 3. Cálculo de horas totales
            const horasTotales = asistencias.reduce((acc, r) => acc + Number(r.HorasTrabajadas || 0), 0);
            
            // 4. Respuesta exitosa
            res.json({ 
                success: true, 
                horasTrabajadas: horasTotales.toFixed(2), // Enviar con 2 decimales
                desglose: asistencias 
            });

        } catch (error) {
            // 5. Manejo de errores
            console.error('ERROR AL CALCULAR HORAS TRABAJADAS:', error); // Log detallado en la consola del servidor
            res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor. Revise la consola para más detalles.' 
            });
        }
    },
};

module.exports = pagoController;
