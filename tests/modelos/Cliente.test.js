const Cliente = require('../../src/modelos/Cliente');
const conexion = require('../../src/bd/conexion');

jest.mock('../../src/bd/conexion', () => ({
    query: jest.fn()
}));

describe('Cliente Model', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('contarActivos', () => {
        it('debe retornar el total de clientes activos', async () => {
            conexion.query.mockResolvedValue([[{ total: 5 }]]);
            
            const total = await Cliente.contarActivos();
            
            expect(conexion.query).toHaveBeenCalledWith(expect.stringContaining('SELECT COUNT(*)'));
            expect(total).toBe(5);
        });
    });

    describe('listar', () => {
        it('debe listar todos los clientes sin termino de busqueda', async () => {
            const mockClientes = [{ IdCliente: 1, RazonSocial: 'Cliente 1' }];
            conexion.query.mockResolvedValue([mockClientes]);
            
            const result = await Cliente.listar();
            
            expect(conexion.query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY RazonSocial'), []);
            expect(result).toEqual(mockClientes);
        });

        it('debe listar clientes usando el termino de busqueda', async () => {
            const mockClientes = [{ IdCliente: 2, Documento: '123' }];
            conexion.query.mockResolvedValue([mockClientes]);
            
            const result = await Cliente.listar('123');
            
            expect(conexion.query).toHaveBeenCalledWith(expect.stringContaining('WHERE (Documento LIKE ? OR RazonSocial LIKE ?)'), ['%123%', '%123%']);
            expect(result).toEqual(mockClientes);
        });
    });

    describe('crear', () => {
        it('debe crear un cliente correctamente usando Celular si está provisto', async () => {
            conexion.query.mockResolvedValue([{ insertId: 1 }]);
            
            const num = { Documento: '123', RazonSocial: 'Juan', Direccion: 'Lima', Telefono: '111', Celular: '999', Email: 'j@j.com', Contacto: 'Ninguno' };
            await Cliente.crear(num);
            
            expect(conexion.query).toHaveBeenCalledTimes(1);
            expect(conexion.query.mock.calls[0][1]).toEqual(['123', 'Juan', 'Lima', '111', '999', 'j@j.com', 'Ninguno']);
        });

        it('debe usar Telefono como Celular si Celular está vacío o no provisto', async () => {
            conexion.query.mockResolvedValue([{ insertId: 2 }]);
            
            const num = { Documento: '123', RazonSocial: 'Juan', Direccion: 'Lima', Telefono: '111', Celular: '', Email: 'j@j.com', Contacto: 'Ninguno' };
            await Cliente.crear(num);
            
            expect(conexion.query.mock.calls[0][1]).toEqual(['123', 'Juan', 'Lima', '111', '111', 'j@j.com', 'Ninguno']);
        });
    });

    describe('obtenerPorId', () => {
        it('debe retornar un cliente por id', async () => {
            const mockCliente = { IdCliente: 1, RazonSocial: 'Cliente 1' };
            conexion.query.mockResolvedValue([[mockCliente]]);
            
            const result = await Cliente.obtenerPorId(1);
            
            expect(conexion.query).toHaveBeenCalledWith('SELECT * FROM CLIENTE WHERE IdCliente = ?', [1]);
            expect(result).toEqual(mockCliente);
        });
    });

    describe('actualizar', () => {
        it('debe actualizar cliente usando Telefono como Celular si no hay Celular', async () => {
            conexion.query.mockResolvedValue([{ affectedRows: 1 }]);
            
            const num = { Documento: '123', RazonSocial: 'Juan', Direccion: 'Lima', Telefono: '111', Celular: ' ', Email: 'j@j.com', Contacto: 'Ninguno' };
            await Cliente.actualizar(1, num);
            
            expect(conexion.query.mock.calls[0][1]).toEqual(['123', 'Juan', 'Lima', '111', '111', 'j@j.com', 'Ninguno', 1]);
        });
    });

    describe('eliminar', () => {
        it('debe marcar cliente inactivo (Estado = 0)', async () => {
            conexion.query.mockResolvedValue([{ affectedRows: 1 }]);
            
            await Cliente.eliminar(1);
            
            expect(conexion.query).toHaveBeenCalledWith('UPDATE CLIENTE SET Estado = 0 WHERE IdCliente = ?', [1]);
        });
    });

    describe('getAll', () => {
        it('debe retornar todos los clientes', async () => {
            const mockClientes = [{ IdCliente: 1 }, { IdCliente: 2 }];
            conexion.query.mockResolvedValue([mockClientes]);
            
            const result = await Cliente.getAll();
            
            expect(conexion.query).toHaveBeenCalledWith('SELECT * FROM CLIENTE ORDER BY RazonSocial');
            expect(result).toEqual(mockClientes);
        });
    });
});
