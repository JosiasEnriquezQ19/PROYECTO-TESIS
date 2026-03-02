const fs = require('fs');
const targetPath = 'e:/6 CICLO/CURSO JUEVES/PROYECTO-TESIS-NUEVO/PROYECTO-TESIS/src/vistas/asistencia/marcar.ejs';

const template = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title><%= title %> - CARSIL</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
    <style>
        :root {
            --bg-color: #f4f4f5;
            --text-main: #18181b;
            --text-muted: #71717a;
            --accent: #2563eb;
            --success: #16a34a;
            --danger: #dc2626;
            --glass-bg: rgba(255, 255, 255, 0.75);
            --glass-border: rgba(255, 255, 255, 0.5);
        }

        body {
            margin: 0;
            padding: 0;
            min-height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif;
            background-color: var(--bg-color);
            background-image: 
                radial-gradient(circle at 15% 50%, rgba(37, 99, 235, 0.08), transparent 25%),
                radial-gradient(circle at 85% 30%, rgba(22, 163, 74, 0.06), transparent 25%);
            color: var(--text-main);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow-x: hidden;
        }

        .kiosk-wrapper {
            display: flex;
            flex-direction: row;
            width: 100%;
            max-width: 1200px;
            height: 90vh;
            max-height: 800px;
            gap: 2rem;
            padding: 2rem;
            align-items: center;
        }

        /* LEFT PANEL: HERO TIME */
        .kiosk-time-panel {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 2rem;
        }

        .brand {
            margin-bottom: auto;
            font-size: 1.5rem;
            font-weight: 700;
            letter-spacing: -0.5px;
            color: var(--text-muted);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .brand i {
            color: var(--accent);
        }

        .time-hero {
            font-size: 8rem;
            font-weight: 200;
            line-height: 1;
            letter-spacing: -4px;
            font-variant-numeric: tabular-nums;
            margin-bottom: 0.5rem;
            background: linear-gradient(180deg, #18181b 0%, #52525b 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .date-hero {
            font-size: 1.75rem;
            font-weight: 500;
            color: var(--text-muted);
            letter-spacing: -0.5px;
            margin-left: 0.5rem;
        }

        /* RIGHT PANEL: INTERACTION */
        .kiosk-interaction-panel {
            flex: 0 0 450px;
            background: var(--glass-bg);
            backdrop-filter: blur(40px);
            -webkit-backdrop-filter: blur(40px);
            border: 1px solid var(--glass-border);
            border-radius: 2rem;
            padding: 2.5rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
            display: flex;
            flex-direction: column;
            height: 100%;
            overflow-y: auto;
        }

        .kiosk-interaction-panel::-webkit-scrollbar { width: 0px; }

        .employee-badge {
            display: flex;
            align-items: center;
            gap: 1.25rem;
            margin-bottom: 2.5rem;
            padding-bottom: 1.5rem;
            border-bottom: 1px solid rgba(0,0,0,0.05);
        }

        .avatar {
            width: 65px;
            height: 65px;
            background: linear-gradient(135deg, #e4e4e7, #f4f4f5);
            border-radius: 1.25rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.75rem;
            color: var(--text-muted);
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
        }

        .info h2 {
            font-size: 1.25rem;
            font-weight: 700;
            margin: 0 0 0.2rem 0;
            letter-spacing: -0.3px;
        }

        .info p {
            margin: 0;
            font-size: 0.95rem;
            color: var(--text-muted);
            font-weight: 500;
        }

        /* Controls */
        .punch-controls {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-bottom: 2.5rem;
        }

        .btn-punch {
            width: 100%;
            border: none;
            padding: 1.25rem 1.5rem;
            border-radius: 1.25rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 1.15rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-punch-in {
            background-color: var(--text-main);
            color: white;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.25);
        }
        
        .btn-punch-in:hover:not(:disabled) {
            transform: translateY(-2px);
            background-color: #000;
            box-shadow: 0 15px 30px -5px rgba(0,0,0,0.3);
        }

        .btn-punch-out {
            background-color: white;
            color: var(--text-main);
            border: 1px solid rgba(0,0,0,0.1);
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }

        .btn-punch-out:hover:not(:disabled) {
            transform: translateY(-2px);
            border-color: rgba(0,0,0,0.2);
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
        }

        .btn-punch:disabled {
            opacity: 0.4;
            cursor: not-allowed;
            transform: none !important;
            box-shadow: none !important;
            border-color: transparent !important;
            background-color: #e4e4e7;
            color: #a1a1aa;
        }

        .punch-time {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-weight: 500;
            font-size: 1rem;
            opacity: 0.8;
            background: rgba(0,0,0,0.05);
            padding: 0.25rem 0.75rem;
            border-radius: 0.5rem;
        }
        
        .btn-punch-in .punch-time {
            background: rgba(255,255,255,0.15);
        }

        /* Status & History */
        .section-title {
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: var(--text-muted);
            font-weight: 700;
            margin-bottom: 1.25rem;
        }

        .history-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .history-item {
            background: rgba(255,255,255,0.6);
            padding: 1.25rem;
            border-radius: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border: 1px solid rgba(0,0,0,0.02);
            font-size: 0.95rem;
        }

        .h-date {
            font-weight: 600;
            color: var(--text-main);
        }

        .h-times {
            display: flex;
            gap: 1.25rem;
            font-family: ui-monospace, monospace;
            color: var(--text-muted);
            font-weight: 500;
        }

        .dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 6px;
            vertical-align: middle;
        }

        .dot-in { background-color: var(--success); }
        .dot-out { background-color: var(--danger); }

        .btn-logout {
            margin-top: auto;
            text-align: center;
            display: block;
            padding: 1rem;
            color: var(--text-muted);
            text-decoration: none;
            font-size: 0.95rem;
            font-weight: 600;
            transition: color 0.2s;
        }

        .btn-logout:hover {
            color: var(--danger);
        }

        .alert-domingo {
            background: #fef3c7;
            color: #92400e;
            padding: 1.5rem;
            border-radius: 1.25rem;
            text-align: center;
            font-weight: 600;
            margin-bottom: 2rem;
            border: 1px solid #fde68a;
        }

        @media (max-width: 900px) {
            .kiosk-wrapper {
                flex-direction: column;
                height: auto;
                max-height: none;
                padding: 1.5rem;
            }
            .time-hero { font-size: 5rem; }
            .kiosk-interaction-panel { flex: none; width: 100%; height: auto; padding: 2rem; }
            .kiosk-time-panel { padding: 1rem 0; align-items: center; text-align: center; }
            .brand { justify-content: center; margin-bottom: 2rem; }
            .date-hero { margin-left: 0; }
        }
    </style>
</head>
<body>

    <div class="kiosk-wrapper">
        <!-- Panel Izquierdo: Hora Dinámica -->
        <div class="kiosk-time-panel">
            <div class="brand">
                <i class="bi bi-fingerprint"></i> CARSIL 
            </div>
            <div style="margin-top: auto; margin-bottom: auto;">
                <div class="time-hero" id="horaDisplay">00:00</div>
                <div class="date-hero" id="fechaDisplay">Cargando...</div>
            </div>
        </div>

        <!-- Panel Derecho: Interacción -->
        <div class="kiosk-interaction-panel">
            
            <div class="employee-badge">
                <div class="avatar">
                    <i class="bi bi-person-fill"></i>
                </div>
                <div class="info">
                    <h2><%= empleado.NombreCompleto %></h2>
                    <p><%= empleado.Cargo %> • <%= empleado.Area || 'Sin área' %></p>
                </div>
            </div>

            <div class="punch-controls">
                <% if (messages.success && messages.success.length > 0) { %>
                    <div style="color: var(--success); background: #dcfce7; padding: 1rem; border-radius: 1rem; font-size: 0.95rem; font-weight: 500; margin-bottom: 1rem; border: 1px solid #bbf7d0;">
                        <i class="bi bi-check-circle-fill me-2"></i> <%= messages.success[0] %>
                    </div>
                <% } %>
                <% if (messages.error && messages.error.length > 0) { %>
                    <div style="color: var(--danger); background: #fee2e2; padding: 1rem; border-radius: 1rem; font-size: 0.95rem; font-weight: 500; margin-bottom: 1rem; border: 1px solid #fecaca;">
                        <i class="bi bi-exclamation-circle-fill me-2"></i> <%= messages.error[0] %>
                    </div>
                <% } %>

                <% if (esDomingo) { %>
                    <div class="alert-domingo">
                        <i class="bi bi-calendar-x me-2"></i>
                        No hay marcado de asistencia los domingos.
                    </div>
                <% } else { %>
                    <form action="/asistencia/marcar-entrada" method="POST" style="margin: 0;">
                        <button type="submit" class="btn-punch btn-punch-in" <%= registroHoy ? 'disabled' : '' %>>
                            <span>Registrar Entrada</span>
                            <span class="punch-time">
                                <%= registroHoy && registroHoy.HoraEntrada ? registroHoy.HoraEntrada.slice(0,5) : '--:--' %>
                            </span>
                        </button>
                    </form>

                    <form action="/asistencia/marcar-salida" method="POST" style="margin: 0;">
                        <button type="submit" class="btn-punch btn-punch-out" <%= !registroHoy || registroHoy.HoraSalida ? 'disabled' : '' %>>
                            <span>Registrar Salida</span>
                            <span class="punch-time">
                                <%= registroHoy && registroHoy.HoraSalida ? registroHoy.HoraSalida.slice(0,5) : '--:--' %>
                            </span>
                        </button>
                    </form>
                <% } %>
            </div>

            <% if (historialReciente && historialReciente.length > 0) { %>
            <div class="section-title">Últimos Registros</div>
            <div class="history-list">
                <% historialReciente.slice(0, 5).forEach(registro => { 
                    const fecha = new Date(registro.Fecha);
                    const fechaFormat = fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
                %>
                <div class="history-item">
                    <span class="h-date"><%= fechaFormat %></span>
                    <div class="h-times">
                        <span title="Entrada"><span class="dot dot-in"></span><%= registro.HoraEntrada ? registro.HoraEntrada.slice(0,5) : '--:--' %></span>
                        <span title="Salida"><span class="dot dot-out"></span><%= registro.HoraSalida ? registro.HoraSalida.slice(0,5) : '--:--' %></span>
                    </div>
                </div>
                <% }); %>
            </div>
            <% } %>

            <a href="/logout" class="btn-logout">
                Cerrar sesión silenciosamente
            </a>
        </div>
    </div>

    <!-- Script de reloj -->
    <script>
        function actualizarReloj() {
            const ahora = new Date();
            
            const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            
            document.getElementById('fechaDisplay').textContent = 
                dias[ahora.getDay()] + ', ' + ahora.getDate() + ' de ' + meses[ahora.getMonth()];

            const horas = String(ahora.getHours()).padStart(2, '0');
            const minutos = String(ahora.getMinutes()).padStart(2, '0');
            // Removemos los segundos para un aspecto más limpio y premium
            
            document.getElementById('horaDisplay').textContent = 
                horas + ':' + minutos;
        }

        actualizarReloj();
        setInterval(actualizarReloj, 10000); // Solo actualiza cada minuto ya que no mostramos segundos
    </script>
</body>
</html>`;

fs.writeFileSync(targetPath, template);
console.log('Premium attendance redesign injected successfully');
