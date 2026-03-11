// Mockear el modelo antes de requerir el controlador
jest.mock('../../src/modelos/Cliente');

const Cliente = require('../../src/modelos/Cliente');
const {
    listarClientes,
    crearCliente,
    eliminarCliente,
    actualizarCliente
} = require('../../src/controladores/clienteController');

beforeEach(() => {
    jest.clearAllMocks();
});

// ─────────────────────────────────────────────
// listarClientes
// ─────────────────────────────────────────────
describe('listarClientes', () => {
    let req, res;

    beforeEach(() => {
        req = { query: {}, user: { IdRol: 1, Nombre: 'Admin' } };
        res = { render: jest.fn() };
    });

    test('renderiza la vista con los clientes obtenidos', async () => {
        const clientesMock = [{ IdCliente: 1, RazonSocial: 'Empresa SA' }];
        Cliente.listar.mockResolvedValue(clientesMock);

        await listarClientes(req, res);

        expect(res.render).toHaveBeenCalledWith('clientes/lista', expect.objectContaining({
            title: 'Lista de Clientes',
            clientes: clientesMock,
            terminoBusqueda: ''
        }));
    });

    test('usa el término de búsqueda de req.query.termino', async () => {
        req.query.termino = 'ACME';
        Cliente.listar.mockResolvedValue([]);

        await listarClientes(req, res);

        expect(Cliente.listar).toHaveBeenCalledWith('ACME');
        expect(res.render).toHaveBeenCalledWith('clientes/lista', expect.objectContaining({
            terminoBusqueda: 'ACME'
        }));
    });

    test('renderiza lista vacía y mensaje de error si falla la BD', async () => {
        Cliente.listar.mockRejectedValue(new Error('DB error'));

        await listarClientes(req, res);

        expect(res.render).toHaveBeenCalledWith('clientes/lista', expect.objectContaining({
            clientes: [],
            error: 'Error al cargar la lista de clientes.'
        }));
    });
});

// ─────────────────────────────────────────────
// crearCliente
// ─────────────────────────────────────────────
describe('crearCliente', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {
                Documento: '12345678',
                RazonSocial: 'Nueva Empresa',
                Direccion: 'Av. Principal 1',
                Telefono: '0991234567',
                Celular: '',
                Email: 'test@mail.com',
                Contacto: 'Pedro López'
            },
            user: { IdRol: 1 }
        };
        res = { redirect: jest.fn() };
    });

    test('crea el cliente y redirige con mensaje de éxito', async () => {
        Cliente.crear.mockResolvedValue();

        await crearCliente(req, res);

        expect(Cliente.crear).toHaveBeenCalledTimes(1);
        expect(res.redirect).toHaveBeenCalledWith(
            expect.stringContaining('/clientes?success=')
        );
    });

    test('redirige con mensaje de error si falla la creación', async () => {
        Cliente.crear.mockRejectedValue(new Error('Error de BD'));

        await crearCliente(req, res);

        expect(res.redirect).toHaveBeenCalledWith(
            expect.stringContaining('/clientes?error=')
        );
    });
});

// ─────────────────────────────────────────────
// eliminarCliente
// ─────────────────────────────────────────────
describe('eliminarCliente', () => {
    let req, res;

    beforeEach(() => {
        req = { params: { id: '7' } };
        res = { redirect: jest.fn() };
    });

    test('elimina el cliente y redirige a /clientes', async () => {
        Cliente.eliminar.mockResolvedValue();

        await eliminarCliente(req, res);

        expect(Cliente.eliminar).toHaveBeenCalledWith('7');
        expect(res.redirect).toHaveBeenCalledWith('/clientes');
    });

    test('redirige igualmente si falla la eliminación', async () => {
        Cliente.eliminar.mockRejectedValue(new Error('Error al eliminar'));

        await eliminarCliente(req, res);

        expect(res.redirect).toHaveBeenCalledWith('/clientes');
    });
});

// ─────────────────────────────────────────────
// actualizarCliente
// ─────────────────────────────────────────────
describe('actualizarCliente', () => {
    let req, res;

    beforeEach(() => {
        req = {
            params: { id: '3' },
            body: {
                Documento: '99887766',
                RazonSocial: 'Empresa Editada',
                Direccion: 'Nueva Dirección',
                Telefono: '0990000000',
                Celular: '0991111111',
                Email: 'editado@mail.com',
                Contacto: 'Ana Gómez'
            }
        };
        res = { redirect: jest.fn(), render: jest.fn() };
    });

    test('actualiza el cliente y redirige a /clientes', async () => {
        Cliente.actualizar.mockResolvedValue();

        await actualizarCliente(req, res);

        expect(Cliente.actualizar).toHaveBeenCalledWith('3', expect.objectContaining({
            Documento: '99887766',
            RazonSocial: 'Empresa Editada'
        }));
        expect(res.redirect).toHaveBeenCalledWith('/clientes');
    });

    test('renderiza el formulario de edición con error si falla', async () => {
        Cliente.actualizar.mockRejectedValue(new Error('Error al actualizar'));

        await actualizarCliente(req, res);

        expect(res.render).toHaveBeenCalledWith(
            'clientes/editar',
            expect.objectContaining({ error: 'Error al actualizar cliente.' })
        );
    });
});
