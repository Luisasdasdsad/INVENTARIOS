import Producto from '../models/producto.model.js';
import cloudinary from '../config/cloudinary.js';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { createCanvas } from 'canvas';

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

import crypto from 'crypto';

const generateShortHash = (data, length = 8) => {
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  return hash.substring(0, length).toUpperCase();
};

const generateQRHash = (data, length = 12) => {
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  return `QR-${hash.substring(0, length).toUpperCase()}`;
};

// Generar código de barras
export const generarCodigoBarrasProducto = async (req, res) => {
  const { id } = req.params;
  try {
    const producto = await Producto.findById(id);
    if (!producto) return res.status(404).json({ msg: 'Producto no encontrado' });

    // Generar un valor base para el hash usando nombre, categoria y timestamp
    const baseValue = `${producto.nombre}-${producto.categoria}-${Date.now()}`;
    // Generar un código de barras corto usando un hash (8 caracteres)
    const barcodeValue = generateShortHash(baseValue, 8);

    // Verificar unicidad
    const existingBarcode = await Producto.findOne({ barcode: barcodeValue });
    if (existingBarcode) {
      return res.status(400).json({ error: 'Código de barras generado ya existe (colisión). Intente de nuevo.' });
    }

    producto.barcode = barcodeValue;
    await producto.save();

    res.json({
      message: 'Código de barras generado exitosamente',
      barcode: barcodeValue,
      producto
    });
  } catch (error) {
    res.status(500).json({ msg: 'Error en servidor', error });
  }
};

// Generar códigos de barras masivos para productos
export const generarCodigosBarrasMasivoProducto = async (req, res) => {
  try {
    const productosSinCodigo = await Producto.find({
      $or: [
        { barcode: { $exists: false } },
        { barcode: null },
        { barcode: '' }
      ]
    });

    const resultados = [];

    for (const producto of productosSinCodigo) {
      // Generar un valor base para el hash usando nombre, categoria y timestamp
      const baseValue = `${producto.nombre}-${producto.categoria}-${Date.now()}-${Math.random()}`;
      // Generar un código de barras corto usando un hash (8 caracteres)
      const barcodeValue = generateShortHash(baseValue, 8);

      // Verificar unicidad
      const existingBarcode = await Producto.findOne({ barcode: barcodeValue });
      if (!existingBarcode) {
        producto.barcode = barcodeValue;
        await producto.save();

        resultados.push({
          id: producto._id,
          nombre: producto.nombre,
          barcode: barcodeValue
        });
      }
    }

    res.json({
      message: `Códigos de barras generados para ${resultados.length} productos`,
      productos: resultados
    });
  } catch (error) {
    res.status(500).json({ msg: 'Error en servidor', error });
  }
};

// Generar imagen del código de barras para productos
export const generarImagenCodigoBarrasProducto = async (req, res) => {
  try {
    const { barcode } = req.params;

    if (!barcode) {
      return res.status(400).json({ error: 'Código de barras requerido' });
    }

    // Verificar que existe en DB
    const producto = await Producto.findOne({ barcode });
    if (!producto) {
      return res.status(404).json({ error: 'Producto con código de barras no encontrado' });
    }

    // Crear canvas para barcode
    const canvas = createCanvas(150, 50);
    const ctx = canvas.getContext('2d');

    // Limpiar canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 150, 50);

    // Generar código de barras en el canvas
    JsBarcode(canvas, barcode, {
      format: "CODE128",
      width: 1,
      height: 30,
      displayValue: true,
      fontSize: 10,
      textMargin: 2,
    });

    // Convertir a buffer PNG
    const buffer = canvas.toBuffer('image/png');

    // Enviar imagen
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': buffer.length
    });

    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Generar imagen del código QR para productos
export const generarImagenQRProducto = async (req, res) => {
  try {
    const { qrCode } = req.params;

    if (!qrCode) {
      return res.status(400).json({ error: 'Código QR requerido' });
    }

    // Verificar que existe en DB
    const producto = await Producto.findOne({ qrCode });
    if (!producto) {
      return res.status(404).json({ error: 'Producto con QR no encontrado' });
    }

    // Crear canvas para QR (512x512 estándar para impresión)
    const canvas = createCanvas(512, 512);

    // Generar QR en canvas
    await QRCode.toCanvas(canvas, qrCode, {
      width: 512,
      margin: 2,  // Margen blanco
      color: {
        dark: '#000000',  // Negro
        light: '#FFFFFF'  // Blanco
      }
    });

    // Convertir a buffer PNG
    const buffer = canvas.toBuffer('image/png');

    // Enviar imagen
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': buffer.length
    });

    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
