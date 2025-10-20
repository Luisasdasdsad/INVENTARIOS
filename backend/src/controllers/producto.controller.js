import Producto from '../models/producto.model.js';
import cloudinary from '../config/cloudinary.js';

// Crear producto
export const crearProducto = async (req, res) => {
  try {
    let foto = '';

    if (req.file) {
      console.log('Subiendo foto para nuevo producto...');
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: 'inventario/productos',
            public_id: `producto-${Date.now()}`,
            transformation: [
              { width: 800, height: 600, crop: 'limit', quality: 'auto' },
              { fetch_format: 'auto' },
            ],
            upload_preset: process.env.UPLOAD_PRESET,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });
      foto = result.secure_url;
    }

    const nuevoProducto = new Producto({
      ...req.body,
      foto,
    });

    const guardado = await nuevoProducto.save();
    res.status(201).json(guardado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Listar productos
export const listarProductos = async (req, res) => {
  try {
    const productos = await Producto.find();
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener producto por ID
export const obtenerProducto = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) return res.status(404).json({ msg: 'Producto no encontrado' });
    res.json(producto);
  } catch (error) {
    res.status(500).json({ msg: 'Error en servidor', error });
  }
};

// Actualizar producto
export const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    let dataActualizada = { ...req.body };

    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: 'inventario/productos',
            public_id: `producto-${Date.now()}`,
            transformation: [
              { width: 800, height: 600, crop: 'limit', quality: 'auto' },
              { fetch_format: 'auto' },
            ],
            upload_preset: process.env.UPLOAD_PRESET,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });
      dataActualizada.foto = result.secure_url;
    }

    const actualizado = await Producto.findByIdAndUpdate(id, dataActualizada, {
      new: true,
      runValidators: true,
    });

    if (!actualizado) return res.status(404).json({ msg: 'Producto no encontrado' });
    res.json(actualizado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Eliminar producto
export const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await Producto.findByIdAndDelete(id);
    if (!eliminado) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ msg: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Generar código de barras
export const generarCodigoBarrasProducto = async (req, res) => {
  const { id } = req.params;
  try {
    const producto = await Producto.findById(id);
    if (!producto) return res.status(404).json({ msg: 'Producto no encontrado' });

    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const codigo = `PROD-${timestamp}-${producto._id.toString().slice(-6)}`;

    producto.barcode = codigo;
    await producto.save();

    res.json({ msg: 'Código de barras generado', producto });
  } catch (error) {
    res.status(500).json({ msg: 'Error en servidor', error });
  }
};
