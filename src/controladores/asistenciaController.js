const Asistencia = require('../modelos/Asistencia');
const Empleado = require('../modelos/Empleado');

// Función auxiliar para cerrar registros pendientes de días anteriores
async function cerrarRegistrosPendientes(idEmpleado, fechaActual) {
    try {
        // Buscar registros sin HoraSalida de fechas anteriores a hoy
        const hace30Dias = new Date();
        hace30Dias.setDate(hace30Dias.getDate() - 30);
        const fecha30Dias = hace30Dias.toISOString().split('T')[0];
        
        const registrosPendientes = await Asistencia.getByEmpleadoAndDateRange(
            idEmpleado,
            fecha30Dias,
            fechaActual
        );
        
        // Filtrar solo los que no tienen salida y son de días anteriores
        const registrosSinSalida = registrosPendientes.filter(reg => 
            !reg.HoraSalida && reg.Fecha < fechaActual
        );
        
        // Cerrar cada registro pendiente
        for (const registro of registrosSinSalida) {
            const fechaRegistro = registro.Fecha;
            const horaEntrada = registro.HoraEntrada || '08:00:00';
            
            // Calcular horas desde entrada hasta medianoche (23:59:59)
            const horaEntradaDate = new Date(`${fechaRegistro} ${horaEntrada}`);
            const medianoche = new Date(`${fechaRegistro} 23:59:59`);
            const diferenciaMs = medianoche - horaEntradaDate;
            const horasTrabajadas = diferenciaMs / (1000 * 60 * 60);
            
            // Clasificar jornada
            let jornadaLaboral;
            let observaciones;
            
            if (horasTrabajadas < 4) {
                jornadaLaboral = 'MEDIO_TIEMPO';
                observaciones = `AUTO-CERRADO: ${horasTrabajadas.toFixed(2)}h (no marcó salida)`;
            } else if (horasTrabajadas <= 8) {
                jornadaLaboral = 'COMPLETA';
                observaciones = `AUTO-CERRADO: ${horasTrabajadas.toFixed(2)}h (no marcó salida)`;
            } else {
                jornadaLaboral = 'COMPLETA';
                const horasExtras = horasTrabajadas - 8;
                observaciones = `AUTO-CERRADO: ${horasTrabajadas.toFixed(2)}h con ${horasExtras.toFixed(2)}h extras (no marcó salida)`;
            }
            
            // Actualizar el registro
            await Asistencia.update(registro.IdAsistencia, {
                HoraSalida: '23:59:59',
                JornadaLaboral: jornadaLaboral,
                Observaciones: observaciones
            });
            
            console.log(`✅ Registro auto-cerrado: Empleado ${idEmpleado}, Fecha ${fechaRegistro}`);
        }
        
        if (registrosSinSalida.length > 0) {
            console.log(`📌 Total registros auto-cerrados: ${registrosSinSalida.length}`);
        }
        
    } catch (error) {
        console.error('Error al cerrar registros pendientes:', error);
        // No lanzar error para no bloquear el flujo principal
    }
}


// Mostrar lista de asistencias
exports.list = async (req, res) => {
    try {
        const asistencias = await Asistencia.getAll();
        console.log('Asistencias obtenidas:', asistencias.length);
        console.log('Primera asistencia:', asistencias[0] || 'No hay asistencias');
        
        // Asegurarse de que asistencias es un array antes de mapear
        const asistenciasFormateadas = Array.isArray(asistencias) ? asistencias.map(asistencia => ({
            ...asistencia,
            FechaFormateada: new Date(asistencia.Fecha).toLocaleDateString('es-PE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }),
            HoraEntradaFormateada: asistencia.HoraEntrada ? 
                asistencia.HoraEntrada.slice(0, 5) : '--:--',
            HoraSalidaFormateada: asistencia.HoraSalida ? 
                asistencia.HoraSalida.slice(0, 5) : '--:--'
        })) : [];

        res.render('asistencia/list', { 
            title: 'Registro de Asistencias',
            asistencias: asistenciasFormateadas,
            messages: {
                success: req.flash('success'),
                error: req.flash('error')
            }
        });
        
    } catch (error) {
        console.error('Error en asistenciaController.list:', error);
        
        // Verificar si el error es específico de la base de datos
        if (error.code === 'ER_NO_SUCH_TABLE') {
            req.flash('error', 'La tabla de asistencias no existe en la base de datos');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            req.flash('error', 'Error de conexión a la base de datos');
        } else {
            req.flash('error', 'Error al obtener los registros de asistencia');
        }
        
        res.render('asistencia/list', { 
            title: 'Registro de Asistencias',
            asistencias: [],
            messages: {
                success: req.flash('success'),
                error: req.flash('error')
            }
        });
    }
};

// Mostrar formulario para crear nueva asistencia
exports.createForm = async (req, res) => {
    try {
        const empleados = await Empleado.getAll();
        
        res.render('asistencia/create', { 
            empleados,
            messages: {
                success: req.flash('success'),
                error: req.flash('error')
            }
        });
    } catch (error) {
        console.error('Error al cargar formulario de asistencia:', error);
        req.flash('error', 'Error al cargar formulario');
        res.redirect('/asistencia');
    }
};

// Procesar creación de nueva asistencia
exports.create = async (req, res) => {
    const { IdEmpleado, Fecha, HoraEntrada, HoraSalida, Estado, TipoAsistencia, JornadaLaboral, Observaciones } = req.body;
    
    // Validación: Si el estado es AUSENTE, requerir observación
    if (Estado === 'AUSENTE' && !Observaciones) {
        req.flash('error', 'Debe ingresar una observación cuando el estado es AUSENTE');
        return res.redirect('/asistencia/create');
    }
    
    // Validación: JornadaLaboral es requerida
    if (!JornadaLaboral) {
        req.flash('error', 'Debe seleccionar un tipo de jornada laboral');
        return res.redirect('/asistencia/create');
    }
    
    try {
        // Verificar duplicados
        const existeDuplicado = await Asistencia.checkDuplicate(IdEmpleado, Fecha);
        if (existeDuplicado) {
            req.flash('error', 'Ya existe un registro de asistencia para este empleado en la fecha seleccionada');
            return res.redirect('/asistencia/create');
        }
        
        const asistenciaData = {
            IdEmpleado,
            Fecha,
            HoraEntrada: HoraEntrada || null,
            HoraSalida: HoraSalida || null,
            Estado: Estado || 'PRESENTE',
            TipoAsistencia: TipoAsistencia || 'REGULAR',
            JornadaLaboral: JornadaLaboral || 'COMPLETA',
            Observaciones: Observaciones || null
        };
        
        // Usar el procedimiento almacenado si está disponible
        try {
            await Asistencia.registrarAsistencia(asistenciaData);
        } catch (procError) {
            // Si falla el procedimiento, usar el método create normal
            await Asistencia.create(asistenciaData);
        }
        
        req.flash('success', 'Asistencia registrada correctamente');
        res.redirect('/asistencia');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error al registrar la asistencia');
        res.redirect('/asistencia/create');
    }
};

// Mostrar formulario para editar asistencia
exports.editForm = async (req, res) => {
    try {
        const asistencia = await Asistencia.getById(req.params.id);
        if (!asistencia) {
            req.flash('error', 'Asistencia no encontrada');
            return res.redirect('/asistencia');
        }
        
        const empleados = await Asistencia.getEmpleados();
        
        res.render('asistencia/edit', { 
            title: 'Editar Asistencia',
            asistencia,
            empleados,
            messages: {
                success: req.flash('success'),
                error: req.flash('error')
            }
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error al cargar el formulario de edición');
        res.redirect('/asistencia');
    }
};

// Procesar actualización de asistencia
exports.update = async (req, res) => {
    const { IdEmpleado, Fecha, HoraEntrada, HoraSalida, Estado, TipoAsistencia, JornadaLaboral, Observaciones } = req.body;
    const id = req.params.id;
    
    // Validación: Si el estado es AUSENTE, requerir observación
    if (Estado === 'AUSENTE' && !Observaciones) {
        req.flash('error', 'Debe ingresar una observación cuando el estado es AUSENTE');
        return res.redirect(`/asistencia/${id}/edit`);
    }
    
    try {
        // Verificar duplicados (excluyendo el registro actual)
        const existeDuplicado = await Asistencia.checkDuplicate(IdEmpleado, Fecha, id);
        if (existeDuplicado) {
            req.flash('error', 'Ya existe otro registro de asistencia para este empleado en la fecha seleccionada');
            return res.redirect(`/asistencia/${id}/edit`);
        }
        
        const asistenciaData = {
            HoraEntrada: HoraEntrada || null,
            HoraSalida: HoraSalida || null,
            Estado: Estado || 'PRESENTE',
            TipoAsistencia: TipoAsistencia || 'REGULAR',
            JornadaLaboral: JornadaLaboral || 'COMPLETA',
            Observaciones: Observaciones || null
        };
        
        const affectedRows = await Asistencia.update(id, asistenciaData);
        if (affectedRows === 0) {
            req.flash('error', 'No se pudo actualizar la asistencia');
        } else {
            req.flash('success', 'Asistencia actualizada correctamente');
        }
        res.redirect('/asistencia');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error al actualizar la asistencia');
        res.redirect(`/asistencia/${id}/edit`);
    }
};

// Eliminar asistencia
exports.delete = async (req, res) => {
    try {
        const affectedRows = await Asistencia.delete(req.params.id);
        if (affectedRows === 0) {
            req.flash('error', 'No se pudo eliminar la asistencia');
        } else {
            req.flash('success', 'Asistencia eliminada correctamente');
        }
        res.redirect('/asistencia');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error al eliminar la asistencia');
        res.redirect('/asistencia');
    }
};

// Obtener horas trabajadas por empleado y rango de fechas (para integración con pagos)
exports.getHorasTrabajadasRango = async (req, res) => {
    try {
        const { IdEmpleado, fechaInicio, fechaFin } = req.query;
        
        if (!IdEmpleado || !fechaInicio || !fechaFin) {
            return res.status(400).json({ 
                error: 'Se requieren IdEmpleado, fechaInicio y fechaFin' 
            });
        }
        
        const resultado = await Asistencia.getTotalHorasTrabajadasRango(IdEmpleado, fechaInicio, fechaFin);
        
        res.json({
            success: true,
            data: resultado
        });
    } catch (error) {
        console.error('Error al obtener horas trabajadas:', error);
        res.status(500).json({ 
            error: 'Error al obtener las horas trabajadas',
            details: error.message 
        });
    }
};

// Obtener resumen semanal de asistencias
exports.getResumenSemanal = async (req, res) => {
    try {
        const { anio, semana } = req.query;
        const resumen = await Asistencia.getResumenSemanal(anio, semana);
        
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            res.json({
                success: true,
                data: resumen
            });
        } else {
            res.render('asistencia/resumen-semanal', {
                title: 'Resumen Semanal de Asistencias',
                resumen,
                anio,
                semana,
                user: req.user
            });
        }
    } catch (error) {
        console.error('Error al obtener resumen semanal:', error);
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            res.status(500).json({ 
                error: 'Error al obtener el resumen semanal' 
            });
        } else {
            req.flash('error', 'Error al obtener el resumen semanal');
            res.redirect('/asistencia');
        }
    }
};

// Función para registrar múltiples asistencias (útil para importaciones)
exports.registrarMultiple = async (req, res) => {
    try {
        const { asistencias } = req.body;
        
        if (!Array.isArray(asistencias)) {
            return res.status(400).json({
                error: 'Se requiere un array de asistencias'
            });
        }
        
        const resultados = [];
        
        for (const asistenciaData of asistencias) {
            try {
                await Asistencia.registrarAsistencia(asistenciaData);
                resultados.push({
                    empleado: asistenciaData.IdEmpleado,
                    fecha: asistenciaData.Fecha,
                    status: 'success'
                });
            } catch (error) {
                resultados.push({
                    empleado: asistenciaData.IdEmpleado,
                    fecha: asistenciaData.Fecha,
                    status: 'error',
                    message: error.message
                });
            }
        }
        
        res.json({
            success: true,
            resultados
        });
        
    } catch (error) {
        console.error('Error en registro múltiple:', error);
        res.status(500).json({
            error: 'Error al registrar las asistencias',
            details: error.message
        });
    }
};
// Mostrar interfaz de marcado para empleados
exports.mostrarMarcado = async (req, res) => {
    try {
        const usuario = req.session.usuario;
        
        // Obtener el empleado asociado al usuario
        const empleados = await Asistencia.getEmpleados();
        const empleado = empleados.find(emp => emp.IdUsuario === usuario.IdUsuario);
        
        if (!empleado) {
            req.flash('error', 'No se encontró información de empleado para este usuario');
            return res.redirect('/login');
        }
        
        // Verificar si es domingo
        const hoy = new Date();
        const diaSemana = hoy.getDay(); // 0 = Domingo
        const esDomingo = diaSemana === 0;
        
        // Obtener asistencia de hoy
        const fechaHoy = hoy.toISOString().split('T')[0];
        
        // CERRAR REGISTROS PENDIENTES DE DÍAS ANTERIORES
        await cerrarRegistrosPendientes(empleado.IdEmpleado, fechaHoy);
        
        const asistenciaHoy = await Asistencia.checkDuplicate(empleado.IdEmpleado, fechaHoy) 
            ? await Asistencia.getByEmpleadoAndDateRange(empleado.IdEmpleado, fechaHoy, fechaHoy)
            : [];
        
        const registroHoy = asistenciaHoy.length > 0 ? asistenciaHoy[0] : null;
        
        // Obtener últimas asistencias (últimos 7 días)
        const hace7Dias = new Date(hoy);
        hace7Dias.setDate(hace7Dias.getDate() - 7);
        const fecha7Dias = hace7Dias.toISOString().split('T')[0];
        
        const historialReciente = await Asistencia.getByEmpleadoAndDateRange(
            empleado.IdEmpleado, 
            fecha7Dias, 
            fechaHoy
        );
        
        res.render('asistencia/marcar', {
            title: 'Marcado de Asistencia',
            empleado,
            registroHoy,
            historialReciente,
            esDomingo
        });
    } catch (error) {
        console.error('Error al mostrar marcado:', error);
        req.flash('error', 'Error al cargar la interfaz de marcado');
        res.redirect('/login');
    }
};

// Procesar marcado de entrada
exports.marcarEntrada = async (req, res) => {
    try {
        const usuario = req.session.usuario;
        
        console.log('Usuario intentando marcar:', usuario);
        
        // Obtener el empleado asociado al usuario
        const empleados = await Asistencia.getEmpleados();
        console.log('Total empleados encontrados:', empleados.length);
        
        const empleado = empleados.find(emp => emp.IdUsuario === usuario.IdUsuario);
        console.log('Empleado encontrado:', empleado);
        
        if (!empleado) {
            req.flash('error', 'No se encontró información de empleado para este usuario. Contacte al administrador.');
            return res.redirect('/asistencia/marcar');
        }
        
        const hoy = new Date();
        const fechaHoy = hoy.toISOString().split('T')[0];
        const horaActual = hoy.toTimeString().split(' ')[0];
        
        // Verificar si es domingo
        if (hoy.getDay() === 0) {
            req.flash('error', 'No se puede marcar asistencia los domingos');
            return res.redirect('/asistencia/marcar');
        }
        
        // Verificar si ya existe un registro hoy
        const existeRegistro = await Asistencia.checkDuplicate(empleado.IdEmpleado, fechaHoy);
        
        if (existeRegistro) {
            req.flash('error', 'Ya has marcado tu entrada hoy');
            return res.redirect('/asistencia/marcar');
        }
        
        // Crear registro de asistencia con hora de entrada
        const asistenciaData = {
            IdEmpleado: empleado.IdEmpleado,
            Fecha: fechaHoy,
            HoraEntrada: horaActual,
            HoraSalida: null,
            Estado: 'PRESENTE',
            TipoAsistencia: 'REGULAR',
            JornadaLaboral: 'PENDIENTE',
            Observaciones: 'Marcado automático por empleado - Jornada en curso'
        };
        
        await Asistencia.create(asistenciaData);
        
        req.flash('success', `Entrada marcada correctamente a las ${horaActual.slice(0,5)}`);
        
        // Guardar la sesión antes de redirigir para asegurar que el flash se guarde
        req.session.save((err) => {
            if (err) {
                console.error('Error al guardar sesión:', err);
            }
            res.redirect('/asistencia/marcar');
        });
        
    } catch (error) {
        console.error('Error al marcar entrada:', error);
        req.flash('error', 'Error al registrar la entrada');
        res.redirect('/asistencia/marcar');
    }
};

// Procesar marcado de salida
exports.marcarSalida = async (req, res) => {
    try {
        const usuario = req.session.usuario;
        
        // Obtener el empleado asociado al usuario
        const empleados = await Asistencia.getEmpleados();
        const empleado = empleados.find(emp => emp.IdUsuario === usuario.IdUsuario);
        
        if (!empleado) {
            req.flash('error', 'No se encontró información de empleado');
            return res.redirect('/asistencia/marcar');
        }
        
        const hoy = new Date();
        const fechaHoy = hoy.toISOString().split('T')[0];
        const horaActual = hoy.toTimeString().split(' ')[0];
        
        // Verificar si existe un registro hoy
        const existeRegistro = await Asistencia.checkDuplicate(empleado.IdEmpleado, fechaHoy);
        
        if (!existeRegistro) {
            req.flash('error', 'Debes marcar tu entrada primero');
            return res.redirect('/asistencia/marcar');
        }
        
        // Obtener el registro de hoy
        const asistenciaHoy = await Asistencia.getByEmpleadoAndDateRange(
            empleado.IdEmpleado, 
            fechaHoy, 
            fechaHoy
        );
        
        const registroHoy = asistenciaHoy[0];
        
        // Verificar si ya marcó salida
        if (registroHoy.HoraSalida) {
            req.flash('error', 'Ya has marcado tu salida hoy');
            return res.redirect('/asistencia/marcar');
        }
        
        // Calcular horas trabajadas entre entrada y salida
        const horaEntrada = new Date(`${fechaHoy} ${registroHoy.HoraEntrada}`);
        const horaSalida = new Date(`${fechaHoy} ${horaActual}`);
        const diferenciaMs = horaSalida - horaEntrada;
        const horasTrabajadas = diferenciaMs / (1000 * 60 * 60); // Convertir a horas
        
        console.log('=== DEBUG MARCADO SALIDA ===');
        console.log('Hora entrada:', registroHoy.HoraEntrada);
        console.log('Hora salida:', horaActual);
        console.log('Horas trabajadas:', horasTrabajadas);
        
        // Validar mínimo 2 horas de trabajo
        if (horasTrabajadas < 2) {
            console.log('VALIDACION: Menos de 2 horas, bloqueando');
            req.flash('error', `Debes trabajar mínimo 2 horas. Has trabajado ${horasTrabajadas.toFixed(2)} horas.`);
            return res.redirect('/asistencia/marcar');
        }
        
        // Clasificar jornada laboral según horas trabajadas
        let jornadaLaboral;
        let observaciones = registroHoy.Observaciones || '';
        
        if (horasTrabajadas < 4) {
            jornadaLaboral = 'MEDIO_TIEMPO';
            observaciones = `Medio tiempo - ${horasTrabajadas.toFixed(2)} horas`;
        } else if (horasTrabajadas <= 8) {
            jornadaLaboral = 'COMPLETA';
            observaciones = `Jornada completa - ${horasTrabajadas.toFixed(2)} horas`;
        } else {
            jornadaLaboral = 'COMPLETA';
            const horasExtras = horasTrabajadas - 8;
            observaciones = `Jornada completa con ${horasExtras.toFixed(2)} horas extras`;
        }
        
        // Actualizar con hora de salida y jornada clasificada
        await Asistencia.update(registroHoy.IdAsistencia, {
            HoraSalida: horaActual,
            JornadaLaboral: jornadaLaboral,
            Observaciones: observaciones
        });
        
        req.flash('success', `Salida marcada a las ${horaActual.slice(0,5)}. Total: ${horasTrabajadas.toFixed(2)} horas (${jornadaLaboral})`);
        
        // Guardar la sesión antes de redirigir para asegurar que el flash se guarde
        req.session.save((err) => {
            if (err) {
                console.error('Error al guardar sesión:', err);
            }
            res.redirect('/asistencia/marcar');
        });
        
    } catch (error) {
        console.error('Error al marcar salida:', error);
        req.flash('error', 'Error al registrar la salida');
        res.redirect('/asistencia/marcar');
    }
};