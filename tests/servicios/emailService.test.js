const emailService = require('../../src/servicios/emailService');
const nodemailer = require('nodemailer');

// Mockear nodemailer
jest.mock('nodemailer');

describe('EmailService', () => {
    let sendMailMock;

    beforeEach(() => {
        // Limpiar mocks y variables de entorno antes de cada prueba
        jest.clearAllMocks();
        
        // Simular que el transporter de nodemailer fue creado correctamente
        sendMailMock = jest.fn().mockResolvedValue({ messageId: '12345' });
        nodemailer.createTransport.mockReturnValue({
            sendMail: sendMailMock
        });
        
        // Re-inicializar manualmente el transporter mockeado en la instancia (ya que el constructor se llamó al hacer require)
        emailService.transporter = nodemailer.createTransport();
        
        // Variables de entorno por defecto para pruebas exitosas
        process.env.EMAIL_USER = 'test@carsil.com';
        process.env.EMAIL_PASS = 'password123';
    });

    describe('estaConfigurado', () => {
        it('debe retornar true si las credenciales están configuradas', () => {
            expect(emailService.estaConfigurado()).toBe(true);
        });

        it('debe retornar false si falta EMAIL_USER', () => {
            delete process.env.EMAIL_USER;
            expect(emailService.estaConfigurado()).toBe(false);
        });

        it('debe retornar false si falta EMAIL_PASS', () => {
            delete process.env.EMAIL_PASS;
            expect(emailService.estaConfigurado()).toBe(false);
        });
    });

    // Datos compartidos para factura y proforma
    const clienteMock = { Email: 'cliente@ejemplo.com', RazonSocial: 'Cliente S.A.', Documento: '20123456789', Direccion: 'Av. Lima 123', Contacto: '999888777' };
    const empresaMock = { Nombre: 'CARSIL', RUC: '20606030451', Direccion: 'Av. Prueba 456', Telefono: '01-1234567', Email: 'info@carsil.com' };
    const detallesMock = [{ Cantidad: 2, UnidadMedida: 'UND', ProductoNombre: 'Servicio A', PrecioUnitario: 50.25, Total: 100.50 }];

    describe('enviarFactura', () => {
        const facturaMock = { Codigo: 'F001-0000001', FechaEmision: '2023-10-25', Total: 100.50, SubTotal: 85.17, TotalIGV: 15.33 };

        it('debe lanzar error si el email no está configurado', async () => {
            delete process.env.EMAIL_USER;
            
            await expect(emailService.enviarFactura(facturaMock, detallesMock, clienteMock, empresaMock))
                .rejects
                .toThrow('El servicio de correo no está configurado');
        });

        it('debe lanzar error si el cliente no tiene email', async () => {
            const clienteSinEmail = { RazonSocial: 'Cliente S.A.' };
            
            await expect(emailService.enviarFactura(facturaMock, detallesMock, clienteSinEmail, empresaMock))
                .rejects
                .toThrow('El cliente no tiene una dirección de correo electrónico registrada.');
        });

        it('debe lanzar error si el cliente es null', async () => {
            await expect(emailService.enviarFactura(facturaMock, detallesMock, null, empresaMock))
                .rejects
                .toThrow('El cliente no tiene una dirección de correo electrónico registrada.');
        });

        it('debe llamar a sendMail con los parámetros correctos cuando es exitoso', async () => {
            const resultado = await emailService.enviarFactura(facturaMock, detallesMock, clienteMock, empresaMock);
            
            expect(resultado.exito).toBe(true);
            expect(resultado.mensaje).toContain(clienteMock.Email);
            
            expect(sendMailMock).toHaveBeenCalledTimes(1);
            
            const mailOptions = sendMailMock.mock.calls[0][0];
            expect(mailOptions.to).toBe(clienteMock.Email);
            expect(mailOptions.subject).toContain(facturaMock.Codigo);
            expect(mailOptions.html).toContain(clienteMock.RazonSocial);
            expect(mailOptions.attachments).toHaveLength(1);
            expect(mailOptions.attachments[0].contentType).toBe('application/pdf');
            expect(mailOptions.attachments[0].filename).toBe(`Factura_${facturaMock.Codigo}.pdf`);
        });

        it('debe generar PDF con FechaVencimiento y Observaciones', async () => {
            const facturaCompleta = {
                ...facturaMock,
                FechaVencimiento: '2023-11-25',
                Observaciones: 'Pago a 30 días',
                FormaPago: 'Crédito 30 días',
                Estado: 'EMITIDA'
            };
            const resultado = await emailService.enviarFactura(facturaCompleta, detallesMock, clienteMock, empresaMock);
            expect(resultado.exito).toBe(true);
        });

        it('debe generar PDF sin detalles (lista vacía)', async () => {
            const resultado = await emailService.enviarFactura(facturaMock, [], clienteMock, empresaMock);
            expect(resultado.exito).toBe(true);
        });

        it('debe generar PDF con detalles null', async () => {
            const resultado = await emailService.enviarFactura(facturaMock, null, clienteMock, empresaMock);
            expect(resultado.exito).toBe(true);
        });

        it('debe lanzar error cuando sendMail falla', async () => {
            sendMailMock.mockRejectedValue(new Error('SMTP connection refused'));
            
            await expect(emailService.enviarFactura(facturaMock, detallesMock, clienteMock, empresaMock))
                .rejects
                .toThrow('Error al enviar correo: SMTP connection refused');
        });
    });

    describe('enviarProforma', () => {
        const proformaMock = { Codigo: 'PRO-0000001', FechaEmision: '2023-10-25', Total: 200.00, SubTotal: 169.49, TotalIGV: 30.51, ValidezOferta: 15 };

        it('debe lanzar error si el email no está configurado', async () => {
            delete process.env.EMAIL_USER;
            
            await expect(emailService.enviarProforma(proformaMock, detallesMock, clienteMock, empresaMock))
                .rejects
                .toThrow('El servicio de correo no está configurado');
        });

        it('debe lanzar error si el cliente no tiene email', async () => {
            const clienteSinEmail = { RazonSocial: 'Cliente S.A.' };
            
            await expect(emailService.enviarProforma(proformaMock, detallesMock, clienteSinEmail, empresaMock))
                .rejects
                .toThrow('El cliente no tiene una dirección de correo electrónico registrada.');
        });

        it('debe lanzar error si el cliente es null', async () => {
            await expect(emailService.enviarProforma(proformaMock, detallesMock, null, empresaMock))
                .rejects
                .toThrow('El cliente no tiene una dirección de correo electrónico registrada.');
        });

        it('debe enviar proforma exitosamente con PDF adjunto', async () => {
            const resultado = await emailService.enviarProforma(proformaMock, detallesMock, clienteMock, empresaMock);
            
            expect(resultado.exito).toBe(true);
            expect(resultado.mensaje).toContain(clienteMock.Email);
            
            expect(sendMailMock).toHaveBeenCalledTimes(1);
            
            const mailOptions = sendMailMock.mock.calls[0][0];
            expect(mailOptions.to).toBe(clienteMock.Email);
            expect(mailOptions.subject).toContain(proformaMock.Codigo);
            expect(mailOptions.html).toContain(clienteMock.RazonSocial);
            expect(mailOptions.html).toContain('15 días');
            expect(mailOptions.attachments).toHaveLength(1);
            expect(mailOptions.attachments[0].contentType).toBe('application/pdf');
            expect(mailOptions.attachments[0].filename).toBe(`Proforma_${proformaMock.Codigo}.pdf`);
        });

        it('debe usar ValidezOferta por defecto (10) si no se especifica', async () => {
            const proformaSinValidez = { ...proformaMock };
            delete proformaSinValidez.ValidezOferta;
            
            const resultado = await emailService.enviarProforma(proformaSinValidez, detallesMock, clienteMock, empresaMock);
            expect(resultado.exito).toBe(true);
            
            const mailOptions = sendMailMock.mock.calls[0][0];
            expect(mailOptions.html).toContain('10 días');
        });

        it('debe generar PDF con Observaciones', async () => {
            const proformaConObs = { ...proformaMock, Observaciones: 'Incluye instalación' };
            const resultado = await emailService.enviarProforma(proformaConObs, detallesMock, clienteMock, empresaMock);
            expect(resultado.exito).toBe(true);
        });

        it('debe generar PDF sin detalles (lista vacía)', async () => {
            const resultado = await emailService.enviarProforma(proformaMock, [], clienteMock, empresaMock);
            expect(resultado.exito).toBe(true);
        });

        it('debe lanzar error cuando sendMail falla', async () => {
            sendMailMock.mockRejectedValue(new Error('Network error'));
            
            await expect(emailService.enviarProforma(proformaMock, detallesMock, clienteMock, empresaMock))
                .rejects
                .toThrow('Error al enviar correo: Network error');
        });
    });

    describe('_generarPDF', () => {
        it('debe generar un Buffer PDF válido para factura', async () => {
            const doc = { Codigo: 'F001', FechaEmision: '2023-01-01', Total: 100, SubTotal: 84.75, TotalIGV: 15.25 };
            const buffer = await emailService._generarPDF('factura', doc, detallesMock, clienteMock, empresaMock);
            expect(Buffer.isBuffer(buffer)).toBe(true);
            expect(buffer.length).toBeGreaterThan(0);
        });

        it('debe generar un Buffer PDF válido para proforma', async () => {
            const doc = { Codigo: 'PRO-001', FechaEmision: '2023-01-01', Total: 200, SubTotal: 169.49, TotalIGV: 30.51, ValidezOferta: 15 };
            const buffer = await emailService._generarPDF('proforma', doc, detallesMock, clienteMock, empresaMock);
            expect(Buffer.isBuffer(buffer)).toBe(true);
            expect(buffer.length).toBeGreaterThan(0);
        });

        it('debe manejar documento sin FechaEmision', async () => {
            const doc = { Codigo: 'F002', Total: 50 };
            const buffer = await emailService._generarPDF('factura', doc, detallesMock, clienteMock, empresaMock);
            expect(Buffer.isBuffer(buffer)).toBe(true);
        });

        it('debe manejar documento con FechaVencimiento', async () => {
            const doc = { Codigo: 'F003', FechaEmision: '2023-01-01', FechaVencimiento: '2023-02-01', Total: 100 };
            const buffer = await emailService._generarPDF('factura', doc, detallesMock, clienteMock, empresaMock);
            expect(Buffer.isBuffer(buffer)).toBe(true);
        });

        it('debe manejar detalles vacíos', async () => {
            const doc = { Codigo: 'F004', FechaEmision: '2023-01-01', Total: 0 };
            const buffer = await emailService._generarPDF('factura', doc, [], clienteMock, empresaMock);
            expect(Buffer.isBuffer(buffer)).toBe(true);
        });

        it('debe manejar detalles null', async () => {
            const doc = { Codigo: 'F005', FechaEmision: '2023-01-01', Total: 0 };
            const buffer = await emailService._generarPDF('factura', doc, null, clienteMock, empresaMock);
            expect(Buffer.isBuffer(buffer)).toBe(true);
        });

        it('debe manejar Observaciones en factura', async () => {
            const doc = { Codigo: 'F006', FechaEmision: '2023-01-01', Total: 100, Observaciones: 'Nota importante', FormaPago: 'Contado' };
            const buffer = await emailService._generarPDF('factura', doc, detallesMock, clienteMock, empresaMock);
            expect(Buffer.isBuffer(buffer)).toBe(true);
        });

        it('debe manejar Observaciones en proforma', async () => {
            const doc = { Codigo: 'PRO-006', FechaEmision: '2023-01-01', Total: 100, Observaciones: 'Incluye envío', ValidezOferta: 20 };
            const buffer = await emailService._generarPDF('proforma', doc, detallesMock, clienteMock, empresaMock);
            expect(Buffer.isBuffer(buffer)).toBe(true);
        });

        it('debe manejar cliente con datos mínimos', async () => {
            const clienteMinimo = { Email: 'min@test.com' };
            const doc = { Codigo: 'F007', FechaEmision: '2023-01-01', Total: 50 };
            const buffer = await emailService._generarPDF('factura', doc, detallesMock, clienteMinimo, empresaMock);
            expect(Buffer.isBuffer(buffer)).toBe(true);
        });

        it('debe manejar empresa con datos mínimos', async () => {
            const empresaMinima = {};
            const doc = { Codigo: 'F008', FechaEmision: '2023-01-01', Total: 50 };
            const buffer = await emailService._generarPDF('factura', doc, detallesMock, clienteMock, empresaMinima);
            expect(Buffer.isBuffer(buffer)).toBe(true);
        });

        it('debe manejar múltiples productos', async () => {
            const muchos = Array.from({ length: 5 }, (_, i) => ({
                Cantidad: i + 1, Unidad: 'PZA', Nombre: `Producto ${i + 1}`, PrecioUnitario: 10 * (i + 1), Total: 10 * (i + 1)
            }));
            const doc = { Codigo: 'F009', FechaEmision: '2023-01-01', Total: 150, SubTotal: 127.12, TotalIGV: 22.88 };
            const buffer = await emailService._generarPDF('factura', doc, muchos, clienteMock, empresaMock);
            expect(Buffer.isBuffer(buffer)).toBe(true);
        });
    });
});
