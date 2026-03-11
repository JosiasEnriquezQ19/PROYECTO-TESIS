jest.mock('../../src/bd/conexion');

const db = require('../../src/bd/conexion');
const Rol = require('../../src/modelos/Rol');

beforeEach(() => jest.clearAllMocks());

describe('Rol.getAll()', () => {
    test('retorna todos los roles', async () => {
        const rolesMock = [{ IdRol: 1, Descripcion: 'Administrador' }, { IdRol: 2, Descripcion: 'Empleado' }];
        db.query.mockResolvedValue([rolesMock]);

        const resultado = await Rol.getAll();
        expect(resultado).toEqual(rolesMock);
        expect(db.query).toHaveBeenCalledWith('SELECT * FROM ROL');
    });
});

describe('Rol.getById()', () => {
    test('retorna el rol correcto', async () => {
        const rolMock = { IdRol: 1, Descripcion: 'Administrador' };
        db.query.mockResolvedValue([[rolMock]]);

        const resultado = await Rol.getById(1);
        expect(resultado).toEqual(rolMock);
        expect(db.query).toHaveBeenCalledWith('SELECT * FROM ROL WHERE IdRol = ?', [1]);
    });

    test('retorna undefined si no existe', async () => {
        db.query.mockResolvedValue([[]]);
        const resultado = await Rol.getById(999);
        expect(resultado).toBeUndefined();
    });
});

describe('Rol.create()', () => {
    test('inserta el rol y retorna su ID', async () => {
        db.query.mockResolvedValue([{ insertId: 5 }]);

        const id = await Rol.create({ Descripcion: 'Supervisor' });
        expect(id).toBe(5);
        expect(db.query).toHaveBeenCalledWith('INSERT INTO ROL (Descripcion) VALUES (?)', ['Supervisor']);
    });

    test('acepta el campo "descripcion" en minúscula', async () => {
        db.query.mockResolvedValue([{ insertId: 6 }]);
        await Rol.create({ descripcion: 'Vendedor' });
        expect(db.query).toHaveBeenCalledWith('INSERT INTO ROL (Descripcion) VALUES (?)', ['Vendedor']);
    });
});

describe('Rol.update()', () => {
    test('actualiza la descripción del rol', async () => {
        db.query.mockResolvedValue([{ affectedRows: 1 }]);

        const filas = await Rol.update(2, { Descripcion: 'Empleado Actualizado' });
        expect(filas).toBe(1);
        expect(db.query).toHaveBeenCalledWith('UPDATE ROL SET Descripcion = ? WHERE IdRol = ?', ['Empleado Actualizado', 2]);
    });
});

describe('Rol.delete()', () => {
    test('elimina el rol y retorna filas afectadas', async () => {
        db.query.mockResolvedValue([{ affectedRows: 1 }]);

        const filas = await Rol.delete(3);
        expect(filas).toBe(1);
        expect(db.query).toHaveBeenCalledWith('DELETE FROM ROL WHERE IdRol = ?', [3]);
    });
});
