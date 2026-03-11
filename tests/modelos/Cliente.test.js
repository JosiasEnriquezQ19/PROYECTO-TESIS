// Mockear la conexión a la BD antes de requerir el modelo
jest.mock('../../src/bd/conexion');

const conexion = require('../../src/bd/conexion');
const Cliente = require('../../src/modelos/Cliente');

// Limpiar mocks entre pruebas
beforeEach(() => {
    jest.clearAllMocks();
});

// ─────────────────────────────────────────────
// Cliente.listar()
// ─────────────────────────────────────────────
describe('Cliente.listar()', () => {
    test('retorna todos los clientes activos sin filtro', async () => {
        const clientesFalsos = [
            { IdCliente: 1, RazonSocial: 'Empresa SA', Estado: 1 },
            { IdCliente: 2, RazonSocial: 'Comercial XYZ', Estado: 1 }
        ];
        conexion.query.mockResolvedValue([clientesFalsos]);

        const resultado = await Cliente.listar('');

        expect(resultado).toEqual(clientesFalsos);
        expect(conexion.query).toHaveBeenCalledWith(
            'SELECT * FROM CLIENTE WHERE Estado = 1',
            []
        );
    });

    test('filtra por término de búsqueda', async () => {
        const clientesFiltrados = [{ IdCliente: 1, RazonSocial: 'ACME Corp', Estado: 1 }];
        conexion.query.mockResolvedValue([clientesFiltrados]);

        const resultado = await Cliente.listar('ACME');

        expect(resultado).toEqual(clientesFiltrados);
        expect(conexion.query).toHaveBeenCalledWith(
            expect.stringContaining('LIKE ?'),
            ['%ACME%', '%ACME%']
        );
    });

    test('retorna array vacío si no hay clientes', async () => {
        conexion.query.mockResolvedValue([[]]);
        const resultado = await Cliente.listar('');
        expect(resultado).toEqual([]);
    });
});

// ─────────────────────────────────────────────
// Cliente.obtenerPorId()
// ─────────────────────────────────────────────
describe('Cliente.obtenerPorId()', () => {
    test('retorna el cliente correcto por ID', async () => {
        const cliente = { IdCliente: 5, RazonSocial: 'Mi Empresa', Documento: '12345678' };
        conexion.query.mockResolvedValue([[cliente]]);

        const resultado = await Cliente.obtenerPorId(5);

        expect(resultado).toEqual(cliente);
        expect(conexion.query).toHaveBeenCalledWith(
            'SELECT * FROM CLIENTE WHERE IdCliente = ?',
            [5]
        );
    });

    test('retorna undefined si el cliente no existe', async () => {
        conexion.query.mockResolvedValue([[]]);
        const resultado = await Cliente.obtenerPorId(999);
        expect(resultado).toBeUndefined();
    });
});

// ─────────────────────────────────────────────
// Cliente.crear()
// ─────────────────────────────────────────────
describe('Cliente.crear()', () => {
    test('inserta el cliente con los datos correctos', async () => {
        conexion.query.mockResolvedValue([{ affectedRows: 1 }]);

        const datos = {
            Documento: '99887766',
            RazonSocial: 'Nueva Empresa',
            Direccion: 'Calle 123',
            Telefono: '0991234567',
            Celular: '0998765432',
            Email: 'empresa@mail.com',
            Contacto: 'Juan Pérez'
        };

        await Cliente.crear(datos);

        expect(conexion.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO CLIENTE'),
            expect.arrayContaining(['99887766', 'Nueva Empresa'])
        );
    });

    test('usa el teléfono como celular si Celular está vacío', async () => {
        conexion.query.mockResolvedValue([{ affectedRows: 1 }]);

        const datos = {
            Documento: '11223344',
            RazonSocial: 'Empresa Sin Celular',
            Direccion: null,
            Telefono: '0991111111',
            Celular: '',   // vacío → debe usar Telefono
            Email: null,
            Contacto: null
        };

        await Cliente.crear(datos);

        // El celular final debe ser igual al teléfono
        expect(conexion.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO CLIENTE'),
            expect.arrayContaining(['0991111111', '0991111111'])
        );
    });
});

// ─────────────────────────────────────────────
// Cliente.eliminar()
// ─────────────────────────────────────────────
describe('Cliente.eliminar()', () => {
    test('realiza soft-delete cambiando Estado a 0', async () => {
        conexion.query.mockResolvedValue([{ affectedRows: 1 }]);

        await Cliente.eliminar(10);

        expect(conexion.query).toHaveBeenCalledWith(
            'UPDATE CLIENTE SET Estado = 0 WHERE IdCliente = ?',
            [10]
        );
    });
});

// ─────────────────────────────────────────────
// Cliente.contarActivos()
// ─────────────────────────────────────────────
describe('Cliente.contarActivos()', () => {
    test('retorna el total de clientes activos', async () => {
        conexion.query.mockResolvedValue([[{ total: 42 }]]);

        const total = await Cliente.contarActivos();

        expect(total).toBe(42);
    });
});
