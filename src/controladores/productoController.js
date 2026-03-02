const Producto = require('../modelos/Producto');

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
            PrecioUnitario: req.body.PrecioUnitario || 0
        };
        await Producto.crear(productoData);
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
            PrecioUnitario: req.body.PrecioUnitario || 0
        };
        await Producto.actualizar(req.params.id, productoData);
        res.redirect('/productos?success=Producto actualizado exitosamente');
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.redirect('/productos?error=Error al actualizar el producto');
    }
};

// Eliminar producto
exports.eliminarProducto = async (req, res) => {
    try {
        await Producto.eliminar(req.params.id);
        res.redirect('/productos?success=Producto eliminado exitosamente');
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.redirect('/productos?error=Error al eliminar el producto');
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
