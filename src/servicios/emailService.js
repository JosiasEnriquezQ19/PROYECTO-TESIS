const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
require('dotenv').config();

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || '',
                pass: process.env.EMAIL_PASS || '',
            }
        });
    }

    estaConfigurado() {
        return !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    }

    // ── Genera un PDF de factura o proforma en memoria (Buffer) ──
    _generarPDF(tipo, documento, detalles, cliente, empresa) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
                const chunks = [];
                doc.on('data', c => chunks.push(c));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                const azul = '#2c3e50';
                const gris = '#64748b';
                const verde = '#10b981';
                const pageW = doc.page.width - 80; // margen 40+40

                // ── ENCABEZADO ──
                doc.fontSize(18).font('Helvetica-Bold').fillColor(azul)
                   .text(empresa.Nombre || 'CARSIL EQUIPOS Y SERVICIOS S.A.C.', 40, 40, { width: pageW * 0.6 });
                doc.fontSize(8).font('Helvetica').fillColor(gris)
                   .text(empresa.Direccion || '', 40, doc.y + 2, { width: pageW * 0.6 })
                   .text(`RUC: ${empresa.RUC || '20606030451'}`, 40, doc.y + 1)
                   .text(`Tel: ${empresa.Telefono || '---'}  |  Email: ${empresa.Email || process.env.EMAIL_USER}`, 40, doc.y + 1);

                const tipoDoc = tipo === 'factura' ? 'FACTURA ELECTRÓNICA' : 'PROFORMA COMERCIAL';
                const boxX = 40 + pageW * 0.62;
                const boxW = pageW * 0.38;
                doc.save().rect(boxX, 40, boxW, 52).fill('#f0f4f8').restore();
                doc.fontSize(11).font('Helvetica-Bold').fillColor(azul)
                   .text(tipoDoc, boxX + 8, 46, { width: boxW - 16, align: 'center' });
                doc.fontSize(10).font('Helvetica').fillColor('#333')
                   .text(`N° ${documento.Codigo}`, boxX + 8, 62, { width: boxW - 16, align: 'center' });
                doc.fontSize(8).fillColor(gris)
                   .text(`Estado: ${documento.Estado || 'PENDIENTE'}`, boxX + 8, 76, { width: boxW - 16, align: 'center' });

                // Línea separadora
                const lineY = 100;
                doc.moveTo(40, lineY).lineTo(40 + pageW, lineY).strokeColor(azul).lineWidth(2).stroke();

                // ── FECHA ──
                const fechaEmision = documento.FechaEmision
                    ? new Date(documento.FechaEmision).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })
                    : new Date().toLocaleDateString('es-PE');
                doc.fontSize(9).font('Helvetica').fillColor('#333')
                   .text(`Fecha de emisión: ${fechaEmision}`, 40, lineY + 10);
                if (documento.FechaVencimiento) {
                    const fv = new Date(documento.FechaVencimiento).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
                    doc.text(`Fecha de vencimiento: ${fv}`, 40, doc.y + 2);
                }

                // ── DATOS DEL CLIENTE ──
                let cy = doc.y + 14;
                doc.save().rect(40, cy, pageW, 18).fill(azul).restore();
                doc.fontSize(9).font('Helvetica-Bold').fillColor('#fff')
                   .text('DATOS DEL CLIENTE', 48, cy + 4);
                cy += 22;
                doc.fillColor('#333').font('Helvetica').fontSize(9);
                const clienteRows = [
                    ['Razón Social', cliente.RazonSocial || 'N/A'],
                    ['RUC/DNI', cliente.Documento || '-'],
                    ['Dirección', cliente.Direccion || '-'],
                    ['Contacto', cliente.Contacto || '-'],
                    ['Email', cliente.Email || '-']
                ];
                clienteRows.forEach(([label, val]) => {
                    doc.font('Helvetica-Bold').text(`${label}: `, 48, cy, { continued: true, width: pageW - 16 });
                    doc.font('Helvetica').text(val);
                    cy = doc.y + 2;
                });

                // ── TABLA DE PRODUCTOS ──
                let ty = cy + 10;
                const colW = [30, 40, 45, pageW - 230, 55, 60];
                const headers = ['#', 'CANT', 'UNID', 'DESCRIPCIÓN', 'P. UNIT.', 'TOTAL'];

                // Header
                doc.save().rect(40, ty, pageW, 18).fill(azul).restore();
                doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#fff');
                let hx = 44;
                headers.forEach((h, i) => {
                    const align = i >= 4 ? 'right' : (i <= 2 ? 'center' : 'left');
                    doc.text(h, hx, ty + 5, { width: colW[i], align });
                    hx += colW[i];
                });
                ty += 20;

                // Rows
                doc.fillColor('#333').font('Helvetica').fontSize(8);
                if (detalles && detalles.length > 0) {
                    detalles.forEach((item, idx) => {
                        if (ty > 720) { doc.addPage(); ty = 40; }
                        const bg = idx % 2 === 0 ? '#ffffff' : '#f8f9fa';
                        doc.save().rect(40, ty, pageW, 16).fill(bg).restore();
                        doc.fillColor('#333');
                        let rx = 44;
                        const vals = [
                            String(idx + 1),
                            String(item.Cantidad || 1),
                            item.UnidadMedida || item.Unidad || 'UND',
                            item.ProductoNombre || item.Nombre || 'Producto',
                            parseFloat(item.PrecioUnitario || 0).toFixed(2),
                            parseFloat(item.Total || 0).toFixed(2)
                        ];
                        vals.forEach((v, i) => {
                            const align = i >= 4 ? 'right' : (i <= 2 ? 'center' : 'left');
                            doc.text(v, rx, ty + 4, { width: colW[i], align });
                            rx += colW[i];
                        });
                        ty += 16;
                    });
                } else {
                    doc.text('No hay productos registrados.', 48, ty + 4);
                    ty += 20;
                }

                // ── TOTALES ──
                ty += 6;
                const totX = 40 + pageW - 180;
                const totW = 180;
                const sub = parseFloat(documento.SubTotal || 0).toFixed(2);
                const igv = parseFloat(documento.TotalIGV || 0).toFixed(2);
                const total = parseFloat(documento.Total || 0).toFixed(2);

                [[' SUB TOTAL', sub], [' IGV (18%)', igv], [' TOTAL S/', total]].forEach(([lbl, val], i) => {
                    const isLast = i === 2;
                    doc.save().rect(totX, ty, totW / 2, 18).fill(isLast ? azul : '#e9ecef').restore();
                    doc.save().rect(totX + totW / 2, ty, totW / 2, 18).fill(isLast ? '#d4edda' : '#f8f9fa').restore();
                    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(isLast ? '#fff' : azul)
                       .text(lbl, totX + 4, ty + 5, { width: totW / 2 - 8 });
                    doc.fillColor(isLast ? verde : '#333')
                       .text(`S/ ${val}`, totX + totW / 2 + 4, ty + 5, { width: totW / 2 - 8, align: 'right' });
                    ty += 18;
                });

                // ── CONDICIONES ──
                ty += 14;
                if (ty > 700) { doc.addPage(); ty = 40; }
                doc.save().moveTo(40, ty).lineTo(43, ty).lineTo(43, ty + 50).lineTo(40, ty + 50)
                   .fill(azul).restore();
                doc.fontSize(9).font('Helvetica-Bold').fillColor(azul)
                   .text('CONDICIONES', 50, ty + 2);
                doc.fontSize(8).font('Helvetica').fillColor('#333');
                if (tipo === 'factura') {
                    doc.text(`Forma de pago: ${documento.FormaPago || 'Según acuerdo comercial'}`, 50, doc.y + 4);
                } else {
                    doc.text(`Validez de la oferta: ${documento.ValidezOferta || 10} días`, 50, doc.y + 4);
                }
                if (documento.Observaciones && documento.Observaciones.trim()) {
                    doc.text(`Observaciones: ${documento.Observaciones}`, 50, doc.y + 2, { width: pageW - 20 });
                }

                // ── FIRMA ──
                ty = doc.y + 30;
                if (ty > 730) { doc.addPage(); ty = 40; }
                doc.moveTo(40, ty).lineTo(200, ty).strokeColor('#ccc').lineWidth(0.5).stroke();
                doc.fontSize(8).font('Helvetica').fillColor('#333')
                   .text('Atentamente,', 40, ty + 6);
                doc.font('Helvetica-Bold').fillColor(azul)
                   .text(empresa.Nombre || 'CARSIL EQUIPOS Y SERVICIOS S.A.C.', 40, doc.y + 3);

                // ── PIE ──
                doc.fontSize(7).font('Helvetica').fillColor(gris)
                   .text(`© ${new Date().getFullYear()} ${empresa.Nombre || 'CARSIL'} - Documento generado electrónicamente`, 40, 780, { width: pageW, align: 'center' });

                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Envía una factura por correo electrónico con PDF adjunto
     */
    async enviarFactura(factura, detalles, cliente, empresa) {
        if (!this.estaConfigurado()) {
            throw new Error('El servicio de correo no está configurado (faltan credenciales en .env).');
        }
        if (!cliente || !cliente.Email) {
            throw new Error('El cliente no tiene una dirección de correo electrónico registrada.');
        }

        const correoDestino = cliente.Email;
        const asunto = `Factura ${factura.Codigo} - ${empresa.Nombre || 'CARSIL'}`;
        const fechaFormat = new Date(factura.FechaEmision).toLocaleDateString('es-PE', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        // Generar PDF
        const pdfBuffer = await this._generarPDF('factura', factura, detalles, cliente, empresa);

        const htmlTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #2c3e50; padding: 20px; text-align: center; color: white;">
                <h2 style="margin: 0; font-size: 22px;">Factura ${factura.Codigo}</h2>
                <p style="margin: 5px 0 0; opacity: 0.85;">${empresa.Nombre || 'CARSIL EQUIPOS Y SERVICIOS S.A.C.'}</p>
            </div>
            <div style="padding: 25px;">
                <p style="font-size: 15px; color: #334155;">Estimado(a) <strong>${cliente.RazonSocial}</strong>,</p>
                <p style="font-size: 14px; color: #334155; line-height: 1.6;">
                    Le remitimos adjunta su factura emitida el <strong>${fechaFormat}</strong> por un monto de 
                    <strong style="color: #10b981;">S/ ${parseFloat(factura.Total).toFixed(2)}</strong>.
                </p>
                <p style="font-size: 13px; color: #64748b;">Encontrará el documento completo en el <strong>archivo PDF adjunto</strong>.</p>
                <p style="font-size: 13px; color: #64748b; margin-top: 20px;">Si tiene alguna consulta, responda directamente a este correo.</p>
            </div>
            <div style="background: #f1f5f9; padding: 12px; text-align: center; font-size: 11px; color: #94a3b8;">
                © ${new Date().getFullYear()} ${empresa.Nombre || 'CARSIL'} — ${empresa.Direccion || ''}
            </div>
        </div>`;

        const mailOptions = {
            from: `"${empresa.Nombre || 'CARSIL'}" <${process.env.EMAIL_USER}>`,
            to: correoDestino,
            subject: asunto,
            html: htmlTemplate,
            attachments: [{
                filename: `Factura_${factura.Codigo}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }]
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            return { exito: true, mensaje: `Factura enviada con PDF a ${correoDestino}`, info };
        } catch (error) {
            console.error('Error enviando email factura:', error);
            throw new Error(`Error al enviar correo: ${error.message}`);
        }
    }

    /**
     * Envía una proforma por correo electrónico con PDF adjunto
     */
    async enviarProforma(proforma, detalles, cliente, empresa) {
        if (!this.estaConfigurado()) {
            throw new Error('El servicio de correo no está configurado (faltan credenciales en .env).');
        }
        if (!cliente || !cliente.Email) {
            throw new Error('El cliente no tiene una dirección de correo electrónico registrada.');
        }

        const correoDestino = cliente.Email;
        const asunto = `Proforma ${proforma.Codigo} - ${empresa.Nombre || 'CARSIL'}`;
        const fechaFormat = new Date(proforma.FechaEmision).toLocaleDateString('es-PE', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        // Generar PDF
        const pdfBuffer = await this._generarPDF('proforma', proforma, detalles, cliente, empresa);

        const htmlTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #2c3e50; padding: 20px; text-align: center; color: white;">
                <h2 style="margin: 0; font-size: 22px;">Proforma ${proforma.Codigo}</h2>
                <p style="margin: 5px 0 0; opacity: 0.85;">${empresa.Nombre || 'CARSIL EQUIPOS Y SERVICIOS S.A.C.'}</p>
            </div>
            <div style="padding: 25px;">
                <p style="font-size: 15px; color: #334155;">Estimado(a) <strong>${cliente.RazonSocial}</strong>,</p>
                <p style="font-size: 14px; color: #334155; line-height: 1.6;">
                    Le remitimos adjunta nuestra propuesta comercial emitida el <strong>${fechaFormat}</strong> por un monto estimado de 
                    <strong style="color: #10b981;">S/ ${parseFloat(proforma.Total).toFixed(2)}</strong>.
                </p>
                <p style="font-size: 13px; color: #64748b;">Encontrará el documento completo en el <strong>archivo PDF adjunto</strong>.</p>
                <p style="font-size: 13px; color: #64748b;">Validez de la oferta: <strong>${proforma.ValidezOferta || 10} días</strong>.</p>
                <p style="font-size: 13px; color: #64748b; margin-top: 20px;">Para aprobar o consultar detalles, responda directamente a este correo.</p>
            </div>
            <div style="background: #f1f5f9; padding: 12px; text-align: center; font-size: 11px; color: #94a3b8;">
                © ${new Date().getFullYear()} ${empresa.Nombre || 'CARSIL'} — ${empresa.Direccion || ''}
            </div>
        </div>`;

        const mailOptions = {
            from: `"${empresa.Nombre || 'CARSIL'}" <${process.env.EMAIL_USER}>`,
            to: correoDestino,
            subject: asunto,
            html: htmlTemplate,
            attachments: [{
                filename: `Proforma_${proforma.Codigo}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }]
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            return { exito: true, mensaje: `Proforma enviada con PDF a ${correoDestino}`, info };
        } catch (error) {
            console.error('Error enviando email proforma:', error);
            throw new Error(`Error al enviar correo: ${error.message}`);
        }
    }
}

module.exports = new EmailService();
