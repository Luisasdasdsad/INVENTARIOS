import Producto from '../models/producto.model.js';
import { validationResult } from 'express-validator'; // Si usas validación

// Crear un nuevo producto (POST /)
export const crearProducto = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { nombre, sku, descripcion, cantidad = 0, unidadMedida, barcode, precio = 0, categoria } = req.body;

  try {
    // Validaciones básicas
    if (!nombre || !sku) {
      return res.status(400).json({ msg: 'Nombre y SKU son requeridos' });
    }
    if (cantidad < 0) {
      return res.status(400).json({ msg: 'La cantidad inicial no puede ser negativa' });
    }

    // Verificar si ya existe por SKU o barcode (para evitar duplicados)
    const productoExistente = await Producto.findOne({ $or: [{ sku }, { barcode }] });
    if (productoExistente) {
      return res.status(400).json({ msg: 'Ya existe un producto con este SKU o código de barras' });
    }

    const nuevoProducto = new Producto({
      nombre,
      sku,
      descripcion,
      cantidad,
      unidadMedida,
      barcode,
      precio,
      categoria, // Si es un ID de categoría
    });

    await nuevoProducto.save();

    // Popular categoría si existe
    const productoCreado = await Producto.findById(nuevoProducto._id)
      .populate('categoria', 'nombre');

    res.status(201).json({ msg: 'Producto creado exitosamente', producto: productoCreado });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ msg: 'Error en servidor', error: error.message });
  }
};

// Listar todos los productos (GET /)
export const listarProductos = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // Paginación básica
    const skip = (page - 1) * limit;

    const productos = await Producto.find()
      .populate('categoria', 'nombre') // Opcional: si tienes categorías
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Producto.countDocuments();

    res.json({
      msg: 'Productos listados',
      productos,
      paginacion: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error al listar productos:', error);
    res.status(500).json({ msg: 'Error en servidor', error: error.message });
  }
};

// Obtener un producto por ID (GET /:id)
export const obtenerProducto = async (req, res) => {
  const { id } = req.params;

  try {
    const producto = await Producto.findById(id)
      .populate('categoria', 'nombre');

    if (!producto) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }

    res.json({ msg: 'Producto encontrado', producto });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ msg: 'Error en servidor', error: error.message });
  }
};

// Actualizar un producto existente por ID (PUT /:id)
export const actualizarProducto = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { id } = req.params;
  const { nombre, sku, descripcion, cantidad, unidadMedida, barcode, precio, categoria } = req.body;

  try {
    const producto = await Producto.findById(id);
    if (!producto) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }

    // Actualizar solo campos proporcionados
    if (nombre !== undefined) producto.nombre = nombre;
    if (sku !== undefined) producto.sku = sku;
    if (descripcion !== undefined) producto.descripcion = descripcion;
    if (cantidad !== undefined) {
      if (cantidad < 0) {
        return res.status(400).json({ msg: 'La cantidad no puede ser negativa' });
      }
      producto.cantidad = cantidad;
    }
    if (unidadMedida !== undefined) producto.unidadMedida = unidadMedida;
    if (barcode !== undefined) producto.barcode = barcode;
    if (precio !== undefined) producto.precio = precio;
    if (categoria !== undefined) producto.categoria = categoria;

    // Verificar duplicados si se cambia SKU o barcode
    if (sku && sku !== producto.sku) {
      const skuExistente = await Producto.findOne({ sku, _id: { $ne: id } });
      if (skuExistente) return res.status(400).json({ msg: 'SKU ya existe' });
    }
    if (barcode && barcode !== producto.barcode) {
      const barcodeExistente = await Producto.findOne({ barcode, _id: { $ne: id } });
      if (barcodeExistente) return res.status(400).json({ msg: 'Código de barras ya existe' });
    }

    producto.updatedAt = new Date();
    await producto.save();

    const productoActualizado = await Producto.findById(id)
      .populate('categoria', 'nombre');

    res.json({ msg: 'Producto actualizado exitosamente', producto: productoActualizado });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ msg: 'Error en servidor', error: error.message });
  }
};

// Eliminar un producto por ID (DELETE /:id)
export const eliminarProducto = async (req, res) => {
  const { id } = req.params;

  try {
    const producto = await Producto.findById(id);
    if (!producto) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }

    // Validación: No eliminar si hay stock
    if (producto.cantidad > 0) {
      return res.status(400).json({ msg: 'No se puede eliminar un producto con stock disponible' });
    }

    await Producto.findByIdAndDelete(id);
    res.json({ msg: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ msg: 'Error en servidor', error: error.message });
  }
};

// Buscar un producto por código de barras (GET /buscar-barcode/:barcode)
export const buscarProductoPorCodigoBarras = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { barcode } = req.params; // De la URL: /buscar-barcode/:barcode

  if (!barcode) {
    return res.status(400).json({ msg: 'Debe proporcionar el código de barras' });
  }

  try {
    const producto = await Producto.findOne({ barcode })
      .populate('categoria', 'nombre');

    if (!producto) {
      return res.status(404).json({ msg: 'Producto no encontrado con el código de barras proporcionado' });
    }

    res.json({
      msg: 'Producto encontrado',
      producto: {
        id: producto._id,
        nombre: producto.nombre,
        sku: producto.sku,
        descripcion: producto.descripcion,
        cantidad: producto.cantidad,
        unidadMedida: producto.unidadMedida,
        barcode: producto.barcode,
        precio: producto.precio,
        categoria: producto.categoria ? producto.categoria.nombre : null
      }
    });
  } catch (error) {
    console.error('Error al buscar producto por código de barras:', error);
    res.status(500).json({ msg: 'Error en servidor', error: error.message });
  }
};

// Generar código de barras para un producto específico (POST /generar-barcode/:id)
export const generarCodigoBarrasProducto = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { id } = req.params;

  try {
    const producto = await Producto.findById(id);
    if (!producto) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }

    // Generar código único simple (personaliza si necesitas EAN-13 u otro formato)
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    let codigoBarras = `PROD-${timestamp}-${id.toString().slice(-6)}`; // Ej: PROD-20231015-abcdef

    // Verificar y ajustar unicidad
    let intentos = 0;
    while (await Producto.findOne({ barcode: codigoBarras }) && intentos < 10) {
      codigoBarras = `PROD-${timestamp}-${id.toString().slice(-6)}-${intentos}`;
      intentos++;
    }

    producto.barcode = codigoBarras;
    producto.updatedAt = new Date();
    await producto.save();

    res.json({
      msg: 'Código de barras generado exitosamente',
      producto: {
        id: producto._id,
        nombre: producto.nombre,
        sku: producto.sku,
        nuevoBarcode: producto.barcode
      }
    });
  } catch (error) {
    console.error('Error al generar código de barras:', error);
    res.status(500).json({ msg: 'Error en servidor', error: error.message });
  }
};

// Generar códigos de barras masivos (POST /generar-barcode-masivo)
export const generarCodigosBarrasMasivoProductos = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { ids } = req.body; // Array de IDs: { "ids": ["id1", "id2"] }

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ msg: 'Debe proporcionar un array de IDs de productos' });
  }

  if (ids.length > 50) { // Límite para evitar sobrecarga
    return res.status(400).json({ msg: 'Máximo 50 productos por solicitud masiva' });
  }

  try {
    const productos = await Producto.find({ _id: { $in: ids } });
    if (productos.length !== ids.length) {
      return res.status(400).json({ msg: 'Algunos productos no encontrados' });
    }

    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const resultados = [];

    for (const producto of productos) {
      let codigoBarras = `PROD-${timestamp}-${producto._id.toString().slice(-6)}`;
      let intentos = 0;
      while (await Producto.findOne({ barcode: codigoBarras }) && intentos < 10) {
        codigoBarras = `PROD-${timestamp}-${producto._id.toString().slice(-6)}-${intentos}`;
        intentos++;
      }

      producto.barcode = codigoBarras;
      producto.updatedAt = new Date();
      await producto.save();

      resultados.push({
        id: producto._id,
        nombre: producto.nombre,
        nuevoBarcode: producto.barcode
      });
    }

    res.json({
      msg: `Códigos de barras generados para ${resultados.length} productos`,
      resultados
    });
  } catch (error) {
    console.error('Error al generar códigos masivos:', error);
    res.status(500).json({ msg: 'Error en servidor', error: error.message });
  }
};