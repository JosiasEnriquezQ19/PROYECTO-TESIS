const fs = require('fs');
const loginPath = 'src/vistas/login/recuperar.ejs';
const targetPath = 'src/vistas/login/nuevaClave.ejs';

let template = fs.readFileSync(loginPath, 'utf8');

template = template.replace('<title>Recuperar Contraseña | CARSIL Equipos y Servicios</title>', '<title>Nueva Contraseña | CARSIL Equipos y Servicios</title>');

const formStart = template.indexOf('<div class="form-area">');
const footerStart = template.indexOf('<!-- Footer -->', formStart);

const newFormArea = `<div class="form-area">
                    <div class="icon-circle">
                        <i class="fas fa-key"></i>
                    </div>

                    <h1>Nueva Contraseña</h1>
                    <p class="subtitle">
                        Ingresa una nueva contraseña segura para tu cuenta.
                    </p>

                    <% if (typeof error !=='undefined' && error) { %>
                        <div class="alert-error" role="alert">
                            <i class="fas fa-exclamation-circle"></i>
                            <%= error %>
                        </div>
                    <% } %>

                    <form method="POST" action="/nueva-clave" autocomplete="off">
                        <input type="hidden" name="correo" value="<%= correo %>">
                        <input type="hidden" name="usuarioId" value="<%= usuarioId %>">

                        <div class="field-group">
                            <label class="field-label" for="nuevaClave">Nueva Contraseña</label>
                            <div class="input-wrapper">
                                <i class="fas fa-lock field-icon"></i>
                                <input type="password" class="form-input" id="nuevaClave" name="nuevaClave" required
                                    autofocus placeholder="••••••••">
                            </div>
                        </div>

                        <button type="submit" class="btn-submit" id="btn-submit">
                            <i class="fas fa-save"></i> Guardar nueva contraseña
                        </button>
                    </form>

                    <a href="/login" class="back-link">
                        <i class="fas fa-arrow-left"></i> Volver al inicio de sesión
                    </a>
                </div>
            </div>

            `;

template = template.substring(0, formStart) + newFormArea + template.substring(footerStart);

fs.writeFileSync(targetPath, template);
console.log('Successfully wrote nuevaClave.ejs!');
