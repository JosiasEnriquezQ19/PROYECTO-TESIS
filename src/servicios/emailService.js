const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
    constructor() {
        // Configuramos el transportador SMTP usando Gmail
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || '', // El correo de la empresa
                pass: process.env.EMAIL_PASS || '', // La contraseña de aplicación de 16 dígitos
            }
        });
    }

    // Método para comprobar si las credenciales están configuradas
    estaConfigurado() {
        return !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    }

    /**
     * Envía una factura por correo electrónico
     * @param {Object} factura Datos de la factura
     * @param {Array} detalles Array de productos
     * @param {Object} cliente Datos del cliente
     * @param {Object} empresa Datos de la empresa emisora
     */
    async enviarFactura(factura, detalles, cliente, empresa) {
        if (!this.estaConfigurado()) {
            throw new Error('El servicio de correo no está configurado (faltan credenciales en .env).');
        }

        if (!cliente || !cliente.Email) {
            throw new Error('El cliente no tiene una dirección de correo electrónico registrada.');
        }

        const correoDestino = cliente.Email;
        const asunto = `Envío de Factura ${factura.Codigo} - ${empresa.Nombre}`;

        const fechaFormat = new Date(factura.FechaEmision).toLocaleDateString('es-PE', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        const htmlTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="background-color: #3b4bc9; padding: 20px; text-align: center; color: white;">
                <h2 style="margin: 0; font-size: 24px;">Confirmación de Factura</h2>
                <p style="margin: 5px 0 0; opacity: 0.9;">${empresa.Nombre}</p>
            </div>
            
            <div style="padding: 30px;">
                <p style="font-size: 16px; color: #334155;">Estimado(a) <strong>${cliente.RazonSocial}</strong>,</p>
                
                <p style="font-size: 16px; color: #334155; line-height: 1.5;">
                    Adjuntamos los detalles de su factura emitida el ${fechaFormat}. Gracias por confiar en nuestros servicios.
                </p>

                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin: 25px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Código de Factura:</td>
                            <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #0f172a;">${factura.Codigo}</td>
                        </tr>
                        <tr style="border-top: 1px solid #e2e8f0;">
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Estado:</td>
                            <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #0f172a;">${factura.Estado}</td>
                        </tr>
                        <tr style="border-top: 1px solid #e2e8f0;">
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Total a Pagar:</td>
                            <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #10b981; font-size: 18px;">
                                S/ ${parseFloat(factura.Total).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    </table>
                </div>

                <p style="font-size: 14px; color: #64748b; margin-top: 30px; text-align: center;">
                    Si tiene alguna duda sobre esta factura, puede responder a este correo o contactarnos al ${empresa.Telefono || 'teléfono de atención'}.
                </p>
            </div>
            
            <div style="background-color: #f1f5f9; padding: 15px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0;">© ${new Date().getFullYear()} ${empresa.Nombre} - Todos los derechos reservados.</p>
                <p style="margin: 5px 0 0;">${empresa.Direccion || ''}</p>
            </div>
        </div>
        `;

        const mailOptions = {
            from: `"${empresa.Nombre}" <${process.env.EMAIL_USER}>`,
            to: correoDestino,
            subject: asunto,
            html: htmlTemplate
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            return {
                exito: true,
                mensaje: `Correo enviado a ${correoDestino}`,
                info: info
            };
        } catch (error) {
            console.error('Error enviando email:', error);
            throw new Error(`Error al enviar correo SMTP: ${error.message}`);
        }
    }

    /**
     * Envía una proforma por correo electrónico
     * @param {Object} proforma Datos de la proforma
     * @param {Array} detalles Array de productos
     * @param {Object} cliente Datos del cliente
     * @param {Object} empresa Datos de la empresa emisora
     */
    async enviarProforma(proforma, detalles, cliente, empresa) {
        if (!this.estaConfigurado()) {
            throw new Error('El servicio de correo no está configurado (faltan credenciales en .env).');
        }

        if (!cliente || !cliente.Email) {
            throw new Error('El cliente no tiene una dirección de correo electrónico registrada.');
        }

        const correoDestino = cliente.Email;
        const asunto = `Propuesta Comercial (Proforma ${proforma.Codigo}) - ${empresa.Nombre}`;

        const fechaFormat = new Date(proforma.FechaEmision).toLocaleDateString('es-PE', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        const htmlTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="background-color: #3b4bc9; padding: 20px; text-align: center; color: white;">
                <h2 style="margin: 0; font-size: 24px;">Propuesta Comercial</h2>
                <p style="margin: 5px 0 0; opacity: 0.9;">${empresa.Nombre}</p>
            </div>
            
            <div style="padding: 30px;">
                <p style="font-size: 16px; color: #334155;">Estimado(a) <strong>${cliente.RazonSocial}</strong>,</p>
                
                <p style="font-size: 16px; color: #334155; line-height: 1.5;">
                    En atención a su solicitud, le enviamos los detalles de la proforma emitida el ${fechaFormat}.
                </p>

                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin: 25px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Código de Proforma:</td>
                            <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #0f172a;">${proforma.Codigo}</td>
                        </tr>
                        <tr style="border-top: 1px solid #e2e8f0;">
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Validez Oferta:</td>
                            <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #0f172a;">${proforma.ValidezOferta || 10} días</td>
                        </tr>
                        <tr style="border-top: 1px solid #e2e8f0;">
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Monto Total Estimado:</td>
                            <td style="padding: 8px 0; font-weight: bold; text-align: right; color: #10b981; font-size: 18px;">
                                S/ ${parseFloat(proforma.Total).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    </table>
                </div>

                <p style="font-size: 14px; color: #64748b; margin-top: 30px; text-align: center;">
                    Para aprobar esta propuesta o consultar mayores detalles, puede responder directamente a este correo.
                </p>
            </div>
            
            <div style="background-color: #f1f5f9; padding: 15px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0;">© ${new Date().getFullYear()} ${empresa.Nombre} - Todos los derechos reservados.</p>
                <p style="margin: 5px 0 0;">${empresa.Direccion || ''}</p>
            </div>
        </div>
        `;

        const mailOptions = {
            from: `"${empresa.Nombre}" <${process.env.EMAIL_USER}>`,
            to: correoDestino,
            subject: asunto,
            html: htmlTemplate
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            return {
                exito: true,
                mensaje: `Proforma enviada a ${correoDestino}`,
                info: info
            };
        } catch (error) {
            console.error('Error enviando email:', error);
            throw new Error(`Error al enviar correo SMTP: ${error.message}`);
        }
    }
}

module.exports = new EmailService();
