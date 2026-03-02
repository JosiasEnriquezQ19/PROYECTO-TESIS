const Cliente = require('../modelos/Cliente');

// Listar todos los clientes
exports.listarClientes = async (req, res) => {
    try {
        const terminoBusqueda = req.query.termino || ''; // Obtener el término de búsqueda desde la URL
        const clientes = await Cliente.listar(terminoBusqueda); // Filtrar clientes si se proporciona un término
        res.render('clientes/lista', { 
            clientes, 
            title: 'Lista de Clientes', 
            terminoBusqueda, 
            success: req.query.success || null, 
            error: req.query.error || null,
            user: req.user
        });
    } catch (error) {
        console.error('Error al listar clientes:', error);
        res.render('clientes/lista', { 
            clientes: [], 
            title: 'Lista de Clientes', 
            terminoBusqueda: '', 
            success: null,
            error: 'Error al cargar la lista de clientes.',
            user: req.user
        });
    }
};

// Buscar clientes
exports.buscarClientes = async (req, res) => {
  try {
    const termino = req.query.termino || '';
    const clientes = await Cliente.search(termino);
    res.render('clientes/listar', {
      title: 'Resultados de Búsqueda',
      clientes,
      terminoBusqueda: termino,
      success: req.flash('success'),
      error: req.flash('error'),
      user: req.user
    });
  } catch (error) {
    console.error('Error al buscar clientes:', error);
    req.flash('error', 'Error al buscar clientes');
    res.redirect('/clientes');
  }
};

// Mostrar formulario de creación
exports.mostrarFormularioCrear = (req, res) => {
    res.render('clientes/crear', { 
        title: 'Crear Cliente',
        user: req.user
    });
};

// Crear nuevo cliente
exports.crearCliente = async (req, res) => {
    try {
        const clienteData = {
            Documento: req.body.Documento,
            RazonSocial: req.body.RazonSocial,
            Direccion: req.body.Direccion || null,
            Telefono: req.body.Telefono || null,
            Celular: req.body.Celular || null,
            Email: req.body.Email || null,
            Contacto: req.body.Contacto || null
        };

        await Cliente.crear(clienteData);
        res.redirect('/clientes?success=Cliente creado exitosamente');
    } catch (error) {
        console.error('Error al crear cliente:', error);
        res.redirect('/clientes?error=Error al crear el cliente');
    }
};

// Mostrar formulario de edición
exports.mostrarFormularioEditar = async (req, res) => {
    try {
        const cliente = await Cliente.obtenerPorId(req.params.id);
        res.render('clientes/editar', { cliente, title: 'Editar Cliente' });
    } catch (error) {
        console.error('Error al cargar cliente:', error);
        res.redirect('/clientes');
    }
};

// Actualizar cliente
exports.actualizarCliente = async (req, res) => {
    const id = req.params.id;
    const { Documento, RazonSocial, Direccion, Telefono, Celular, Email, Contacto } = req.body;
    try {
        await Cliente.actualizar(id, { Documento, RazonSocial, Direccion, Telefono, Celular, Email, Contacto });
        res.redirect('/clientes');
    } catch (error) {
        console.error('Error al actualizar cliente:', error);
        res.render('clientes/editar', { cliente: { IdCliente: id, Documento, RazonSocial, Direccion, Telefono, Celular, Email, Contacto }, error: 'Error al actualizar cliente.' });
    }
};

// Eliminar cliente
exports.eliminarCliente = async (req, res) => {
    try {
        await Cliente.eliminar(req.params.id);
        res.redirect('/clientes');
    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        res.redirect('/clientes');
    }
};