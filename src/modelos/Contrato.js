const conexion = require('../bd/conexion');

class Contrato {
    constructor() {
        this.conexion = conexion;
    }

    // Obtener todos los contratos con información relacionada
    async listar() {
        try {
            const query = `
                SELECT 
                    co.IdContrato,
                    co.Codigo,
                    co.IdCliente,
                    co.IdFactura,
                    co.NumeroCuentaBanco,
                    co.FechaInicio,
                    co.FechaFin,
                    co.PagoSemanal,
                    co.Estado,
                    co.Terminos,
                    co.FechaRegistro,
                    c.RazonSocial as ClienteNombre,
                    c.Documento as ClienteDocumento,
                    c.Email as ClienteEmail,
                    c.Telefono as ClienteTelefono,
                    c.Direccion as ClienteDireccion,
                    f.Codigo as FacturaCodigo,
                    f.Total as FacturaTotal,
                    f.FechaEmision as FacturaFecha,
                    f.Estado as FacturaEstado
                FROM CONTRATO co
                INNER JOIN CLIENTE c ON co.IdCliente = c.IdCliente
                LEFT JOIN FACTURA f ON co.IdFactura = f.IdFactura
                ORDER BY co.FechaRegistro DESC
            `;
            
            const [rows] = await this.conexion.execute(query);
            return rows;
        } catch (error) {
            console.error('Error al listar contratos:', error);
            throw error;
        }
    }

    // Obtener contrato por ID con información relacionada
    async obtenerPorId(idContrato) {
        try {
            const query = `
                SELECT 
                    co.IdContrato,
                    co.Codigo,
                    co.IdCliente,
                    co.IdFactura,
                    co.NumeroCuentaBanco,
                    co.FechaInicio,
                    co.FechaFin,
                    co.PagoSemanal,
                    co.Estado,
                    co.Terminos,
                    co.FechaRegistro,
                    c.RazonSocial as ClienteNombre,
                    c.Documento as ClienteDocumento,
                    c.Email as ClienteEmail,
                    c.Telefono as ClienteTelefono,
                    c.Direccion as ClienteDireccion,
                    c.Contacto as ClienteContacto,
                    f.Codigo as FacturaCodigo,
                    f.Total as FacturaTotal,
                    f.FechaEmision as FacturaFecha,
                    f.Estado as FacturaEstado,
                    f.SubTotal as FacturaSubTotal,
                    f.TotalIGV as FacturaIGV
                FROM CONTRATO co
                INNER JOIN CLIENTE c ON co.IdCliente = c.IdCliente
                LEFT JOIN FACTURA f ON co.IdFactura = f.IdFactura
                WHERE co.IdContrato = ?
            `;
            
            const [rows] = await this.conexion.execute(query, [idContrato]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error al obtener contrato por ID:', error);
            throw error;
        }
    }

    // Crear nuevo contrato
    async crear(datosContrato) {
        try {
            const query = `
                INSERT INTO CONTRATO 
                (Codigo, IdCliente, IdFactura, NumeroCuentaBanco, FechaInicio, 
                 FechaFin, PagoSemanal, Estado, Terminos)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const [result] = await this.conexion.execute(query, [
                datosContrato.Codigo,
                datosContrato.IdCliente,
                datosContrato.IdFactura || null,
                datosContrato.NumeroCuentaBanco || null,
                datosContrato.FechaInicio,
                datosContrato.FechaFin || null,
                datosContrato.PagoSemanal || null,
                datosContrato.Estado || 'ACTIVO',
                datosContrato.Terminos || null
            ]);
            
            return result.insertId;
        } catch (error) {
            console.error('Error al crear contrato:', error);
            throw error;
        }
    }

    // Actualizar contrato existente
    async actualizar(idContrato, datosContrato) {
        try {
            const query = `
                UPDATE CONTRATO SET
                    Codigo = ?,
                    IdCliente = ?,
                    IdFactura = ?,
                    NumeroCuentaBanco = ?,
                    FechaInicio = ?,
                    FechaFin = ?,
                    PagoSemanal = ?,
                    Estado = ?,
                    Terminos = ?
                WHERE IdContrato = ?
            `;
            
            const [result] = await this.conexion.execute(query, [
                datosContrato.Codigo,
                datosContrato.IdCliente,
                datosContrato.IdFactura || null,
                datosContrato.NumeroCuentaBanco || null,
                datosContrato.FechaInicio,
                datosContrato.FechaFin || null,
                datosContrato.PagoSemanal || null,
                datosContrato.Estado || 'ACTIVO',
                datosContrato.Terminos || null,
                idContrato
            ]);
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al actualizar contrato:', error);
            throw error;
        }
    }

    // Eliminar contrato
    async eliminar(idContrato) {
        try {
            const query = 'DELETE FROM CONTRATO WHERE IdContrato = ?';
            const [result] = await this.conexion.execute(query, [idContrato]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al eliminar contrato:', error);
            throw error;
        }
    }

    // Cambiar estado del contrato
    async cambiarEstado(idContrato, nuevoEstado) {
        try {
            const query = 'UPDATE CONTRATO SET Estado = ? WHERE IdContrato = ?';
            const [result] = await this.conexion.execute(query, [nuevoEstado, idContrato]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al cambiar estado del contrato:', error);
            throw error;
        }
    }

    // Obtener contratos por cliente
    async obtenerPorCliente(idCliente) {
        try {
            const query = `
                SELECT 
                    co.IdContrato,
                    co.Codigo,
                    co.FechaInicio,
                    co.FechaFin,
                    co.PagoSemanal,
                    co.Estado,
                    co.FechaRegistro,
                    f.Codigo as FacturaCodigo,
                    f.Total as FacturaTotal
                FROM CONTRATO co
                LEFT JOIN FACTURA f ON co.IdFactura = f.IdFactura
                WHERE co.IdCliente = ?
                ORDER BY co.FechaRegistro DESC
            `;
            
            const [rows] = await this.conexion.execute(query, [idCliente]);
            return rows;
        } catch (error) {
            console.error('Error al obtener contratos por cliente:', error);
            throw error;
        }
    }

    // Obtener contratos activos
    async obtenerActivos() {
        try {
            const query = `
                SELECT 
                    co.IdContrato,
                    co.Codigo,
                    co.FechaInicio,
                    co.FechaFin,
                    co.PagoSemanal,
                    co.FechaRegistro,
                    c.RazonSocial as ClienteNombre,
                    f.Codigo as FacturaCodigo,
                    f.Total as FacturaTotal
                FROM CONTRATO co
                INNER JOIN CLIENTE c ON co.IdCliente = c.IdCliente
                LEFT JOIN FACTURA f ON co.IdFactura = f.IdFactura
                WHERE co.Estado = 'ACTIVO'
                AND (co.FechaFin IS NULL OR co.FechaFin >= CURDATE())
                ORDER BY co.FechaInicio DESC
            `;
            
            const [rows] = await this.conexion.execute(query);
            return rows;
        } catch (error) {
            console.error('Error al obtener contratos activos:', error);
            throw error;
        }
    }

    // Verificar si existe un código de contrato
    async existeCodigo(codigo, idContratoExcluir = null) {
        try {
            let query = 'SELECT COUNT(*) as count FROM CONTRATO WHERE Codigo = ?';
            let params = [codigo];
            
            if (idContratoExcluir) {
                query += ' AND IdContrato != ?';
                params.push(idContratoExcluir);
            }
            
            const [rows] = await this.conexion.execute(query, params);
            return rows[0].count > 0;
        } catch (error) {
            console.error('Error al verificar código de contrato:', error);
            throw error;
        }
    }

    // Generar código de contrato automático
    async generarCodigo() {
        try {
            const year = new Date().getFullYear();
            const query = `
                SELECT COUNT(*) + 1 as siguiente 
                FROM CONTRATO 
                WHERE YEAR(FechaRegistro) = ?
            `;
            
            const [rows] = await this.conexion.execute(query, [year]);
            const numero = rows[0].siguiente.toString().padStart(4, '0');
            
            return `CONT-${year}-${numero}`;
        } catch (error) {
            console.error('Error al generar código de contrato:', error);
            throw error;
        }
    }

    // Obtener estadísticas de contratos
    async obtenerEstadisticas() {
        try {
            const query = `
                SELECT 
                    COUNT(*) as TotalContratos,
                    SUM(CASE WHEN Estado = 'ACTIVO' THEN 1 ELSE 0 END) as ContratosActivos,
                    SUM(CASE WHEN Estado = 'FINALIZADO' THEN 1 ELSE 0 END) as ContratosFinalizados,
                    SUM(CASE WHEN Estado = 'SUSPENDIDO' THEN 1 ELSE 0 END) as ContratosSuspendidos,
                    AVG(PagoSemanal) as PromedioPageSemanal,
                    SUM(PagoSemanal) as TotalPagosSemales
                FROM CONTRATO
                WHERE Estado IN ('ACTIVO', 'FINALIZADO', 'SUSPENDIDO')
            `;
            
            const [rows] = await this.conexion.execute(query);
            return rows[0];
        } catch (error) {
            console.error('Error al obtener estadísticas de contratos:', error);
            throw error;
        }
    }
}

module.exports = Contrato;
