const Producto = require('../modelos/Producto');
const { log } = require('../middleware/auditoria');

// Listar todos los productos
exports.listarProductos = async (req, res) => {
    try {
        const terminoBusqueda = req.query.termino || '';
        const codigo = req.query.codigo || '';

        // Obtener productos según los filtros aplicados
        let productos;
        if (codigo) {
            // Si hay un código específico, filtrar por ese código
            productos = await Producto.listarPorFiltro('Codigo', codigo);
        } else if (terminoBusqueda) {
            // Si hay un término de búsqueda, usar la búsqueda general
            productos = await Producto.listar(terminoBusqueda);
        } else {
            // Sin filtros, mostrar todos
            productos = await Producto.listar();
        }

        res.render('productos/lista', {
            productos,
            title: 'Lista de Productos',
            terminoBusqueda,
            codigo,
            success: req.query.success || null,
            error: req.query.error || null,
            user: req.user
        });
    } catch (error) {
        console.error('Error al listar productos:', error);
        res.render('productos/lista', {
            productos: [],
            title: 'Lista de Productos',
            terminoBusqueda: '',
            codigo: '',
            success: null,
            error: 'Error al cargar productos: ' + error.message,
            user: req.user
        });
    }
};

// Mostrar formulario de creación
exports.mostrarFormularioCrear = (req, res) => {
    res.render('productos/crear', {
        title: 'Crear Producto',
        user: req.user
    });
};

// Crear nuevo producto
exports.crearProducto = async (req, res) => {
    try {
        const productoData = {
            Codigo: req.body.Codigo,
            Nombre: req.body.Nombre,
            Descripcion: req.body.Descripcion || null,
            Marca: req.body.Marca || null,
            Modelo: req.body.Modelo || null,
            Tipo: req.body.Tipo || null,
            UnidadMedida: req.body.UnidadMedida || 'UNID',
            PrecioUnitario: req.body.PrecioUnitario || 0,
            Stock: parseInt(req.body.Stock) || 0,
            StockMinimo: parseInt(req.body.StockMinimo) || 5
        };
        await Producto.crear(productoData);
        await log(req, 'PRODUCTOS', 'CREAR', `Creo el producto: ${productoData.Nombre} (Cod: ${productoData.Codigo}, Precio: S/ ${productoData.PrecioUnitario})`);
        res.redirect('/productos?success=Producto creado exitosamente');
    } catch (error) {
        console.error('Error al crear producto:', error);
        // Si es error de código duplicado
        if (error.code === 'ER_DUP_ENTRY') {
            return res.render('productos/crear', {
                title: 'Crear Producto',
                user: req.user,
                messages: { error: 'El código de producto ya existe. Por favor, ingrese uno diferente.' }
            });
        }
        res.render('productos/crear', {
            title: 'Crear Producto',
            user: req.user,
            messages: { error: 'Error al crear el producto.' }
        });
    }
};

// Mostrar formulario de edición
exports.mostrarFormularioEditar = async (req, res) => {
    try {
        const producto = await Producto.obtenerPorId(req.params.id);
        res.render('productos/editar', {
            producto,
            title: 'Editar Producto',
            user: req.user
        });
    } catch (error) {
        console.error('Error al cargar producto:', error);
        res.redirect('/productos');
    }
};

// Actualizar producto
exports.actualizarProducto = async (req, res) => {
    try {
        const productoData = {
            Codigo: req.body.Codigo,
            Nombre: req.body.Nombre,
            Descripcion: req.body.Descripcion || null,
            Marca: req.body.Marca || null,
            Modelo: req.body.Modelo || null,
            Tipo: req.body.Tipo || null,
            UnidadMedida: req.body.UnidadMedida || 'UNID',
            PrecioUnitario: req.body.PrecioUnitario || 0,
            Stock: parseInt(req.body.Stock) || 0,
            StockMinimo: parseInt(req.body.StockMinimo) || 5
        };
        await Producto.actualizar(req.params.id, productoData);
        await log(req, 'PRODUCTOS', 'ACTUALIZAR', `Actualizo el producto ID ${req.params.id}: ${productoData.Nombre} (Precio: S/ ${productoData.PrecioUnitario})`);
        res.redirect('/productos?success=Producto actualizado exitosamente');
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.redirect('/productos?error=Error al actualizar el producto');
    }
};

// Eliminar producto (Inactivar)
exports.eliminarProducto = async (req, res) => {
    try {
        await Producto.eliminar(req.params.id);
        await log(req, 'PRODUCTOS', 'ELIMINAR', `Inactivo el producto ID ${req.params.id}`);
        res.redirect('/productos?success=Producto inactivado exitosamente');
    } catch (error) {
        console.error('Error al inactivar producto:', error);
        res.redirect('/productos?error=Error al inactivar el producto');
    }
};

// Listar alertas de stock mínimo
exports.listarAlertas = async (req, res) => {
    try {
        const productos = await Producto.listarStockBajo();
        res.render('productos/stock-alertas', {
            productos,
            title: 'Alertas de Stock',
            user: req.user,
            success: req.query.success || null,
            error: req.query.error || null
        });
    } catch (error) {
        console.error('Error al listar alertas de stock:', error);
        res.render('productos/stock-alertas', {
            productos: [],
            title: 'Alertas de Stock',
            user: req.user,
            success: null,
            error: 'Error al cargar alertas: ' + error.message
        });
    }
};

// API: Contar productos con stock bajo
exports.contarAlertasAPI = async (req, res) => {
    try {
        const count = await Producto.contarStockBajo();
        res.json({ success: true, count });
    } catch (error) {
        res.json({ success: false, count: 0 });
    }
};

// API: Listar productos para AJAX
exports.listarProductosAPI = async (req, res) => {
    try {
        const productos = await Producto.listar();
        res.json({
            success: true,
            productos: productos.filter(p => p.Estado === 1) // Solo productos activos
        });
    } catch (error) {
        console.error('Error al listar productos API:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cargar productos',
            error: error.message
        });
    }
};
