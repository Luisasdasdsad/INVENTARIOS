import Herramienta from '../models/herramienta.model.js';
import Producto from '../models/producto.model.js';
import QRCode from 'qrcode';
import { createCanvas } from 'canvas';
import crypto from 'crypto';

const generateQRHash = (data, length = 12) => {
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  return `QR-${hash.substring(0, length).toUpperCase()}`;
};

// Generar QR para herramienta
export const generarQRHerramienta = async (req, res) => {
  try {
    const { id } = req.params;
    const herramienta = await Herramienta.findById(id);

    if (!herramienta) {
      return res.status(404).json({ error: 'Herramienta no encontrada' });
    }

    if (herramienta.qrCode) {
      return res.json({
        message: 'QR generado',
        qrCode: herramienta.qrCode,
        herramienta
      });
    }

    const baseValue = `${herramienta.marca}-${herramienta.modelo}-${herramienta.serie || ''}-${Date.now()}`;
    const qrValue = generateQRHash(baseValue, 12);

    const existingQR = await Herramienta.findOne({ qrCode: qrValue });
    if (existingQR) {
      return res.status(400).json({ error: 'Código QR generado ya existe (colisión). Intente de nuevo.' });
    }

    herramienta.qrCode = qrValue;
    await herramienta.save();

    res.json({
      message: 'Código QR generado exitosamente',
      qrCode: qrValue,
      herramienta: herramienta
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Generar QR para producto
export const generarQRProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await Producto.findById(id);

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    if (producto.qrCode) {
      return res.json({
        message: 'QR generado',
        qrCode: producto.qrCode,
        producto
      });
    }

    const baseValue = `${producto.nombre}-${producto.categoria}-${Date.now()}`;
    const qrValue = generateQRHash(baseValue, 12);

    const existingQR = await Producto.findOne({ qrCode: qrValue });
    if (existingQR) {
      return res.status(400).json({ error: 'Código QR generado ya existe (colisión). Intente de nuevo.' });
    }

    producto.qrCode = qrValue;
    await producto.save();

    res.json({
      message: 'Código QR generado exitosamente',
      qrCode: qrValue,
      producto
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Buscar por QR (puede ser herramienta o producto)
export const buscarPorQR = async (req, res) => {
  try {
    const { qrCode } = req.params;
    console.log('Backend: Recibido param:', qrCode);
    if (!qrCode || qrCode.trim() === '') {
      console.log('Backend: Param vacío/undefined');
      return res.status(400).json({ error: 'Código QR requerido' });
    }

    // Buscar en herramientas primero
    let item = await Herramienta.findOne({ qrCode: qrCode.toUpperCase() });
    let tipo = 'herramienta';

    if (!item) {
      // Si no en herramientas, buscar en productos
      item = await Producto.findOne({ qrCode: qrCode.toUpperCase() });
      tipo = 'producto';
    }

    if (!item) {
      console.log('❌ Backend QR: No encontrada para', qrCode);
      return res.status(404).json({ error: `Item no encontrado con QR "${qrCode}"` });
    }

    console.log('✅ Backend QR: Encontrada', item.nombre || item.nombre, 'Tipo:', tipo);
    res.json({ ...item.toObject(), tipo });  // Agregar tipo para distinguir
  } catch (error) {
    console.error('💥 Backend QR Error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Generar QR masivo para herramientas
export const generarQRMasivoHerramientas = async (req, res) => {
  try {
    const herramientasSinQR = await Herramienta.find({
      $or: [
        { qrCode: { $exists: false } },
        { qrCode: null },
        { qrCode: '' }
      ]
    });
    const resultados = [];

    for (const herramienta of herramientasSinQR) {
      const baseValue = `${herramienta.marca}-${herramienta.modelo}-${herramienta.serie || ''}-${Date.now()}-${Math.random()}`;
      const qrValue = generateQRHash(baseValue, 12);

      const existingQR = await Herramienta.findOne({ qrCode: qrValue });
      if (!existingQR) {
        herramienta.qrCode = qrValue;
        await herramienta.save();
        resultados.push({
          id: herramienta._id,
          nombre: herramienta.nombre,
          marca: herramienta.marca,
          modelo: herramienta.modelo,
          serie: herramienta.serie,
          qrCode: qrValue
        });
      }
    }
    res.json({
      message: `QR codes generados para ${resultados.length} herramientas`,
      herramientas: resultados
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Generar QR masivo para productos
export const generarQRMasivoProductos = async (req, res) => {
  try {
    const productosSinQR = await Producto.find({
      $or: [
        { qrCode: { $exists: false } },
        { qrCode: null },
        { qrCode: '' }
      ]
    });
    const resultados = [];

    for (const producto of productosSinQR) {
      const baseValue = `${producto.nombre}-${producto.categoria}-${Date.now()}-${Math.random()}`;
      const qrValue = generateQRHash(baseValue, 12);

      const existingQR = await Producto.findOne({ qrCode: qrValue });
      if (!existingQR) {
        producto.qrCode = qrValue;
        await producto.save();
        resultados.push({
          id: producto._id,
          nombre: producto.nombre,
          qrCode: qrValue
        });
      }
    }
    res.json({
      message: `Códigos QR generados para ${resultados.length} productos`,
      productos: resultados
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Generar imagen QR (pública, busca en ambos modelos)
export const generarImagenQR = async (req, res) => {
  try {
    const { qrCode } = req.params;

    if (!qrCode) {
      return res.status(400).json({ error: 'QR code requerido' });
    }

    // Buscar en herramientas o productos
    let item = await Herramienta.findOne({ qrCode });
    if (!item) {
      item = await Producto.findOne({ qrCode });
    }

    if (!item) {
      return res.status(404).json({ error: 'Item con QR no encontrado' });
    }

    const canvas = createCanvas(512, 512);

    await QRCode.toCanvas(canvas, qrCode, {
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    const buffer = canvas.toBuffer('image/png');

    res.set({
      'Content-Type': 'image/png',
      'Content-Length': buffer.length
    });

    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
