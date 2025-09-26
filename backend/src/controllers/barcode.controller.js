import JsBarcode from 'jsbarcode';
import { createCanvas } from 'canvas';
import Herramienta from '../models/herramienta.model.js';
import crypto from 'crypto';

const generateShortHash = (data, length = 8) => {
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  return hash.substring(0, length).toUpperCase();
};

// Generar código de barras para una herramienta
export const generarCodigoBarras = async (req, res) => {
  try {
    const { id } = req.params;
    const herramienta = await Herramienta.findById(id);
    
    if (!herramienta) {
      return res.status(404).json({ error: 'Herramienta no encontrada' });
    }
    // Generar un valor base para el hash SIN el prefijo "TOOL-"
    const baseValue = `${herramienta.codigo}-${Date.now()}`;
    // Generar un código de barras corto usando un hash
    const barcodeValue = generateShortHash(baseValue, 8); // Código de 8 caracteres
    // Verificar que el código de barras no exista (aunque con hash es muy improbable)
    const existingBarcode = await Herramienta.findOne({ barcode: barcodeValue });
    if (existingBarcode) {
      // Si por alguna razón el hash ya existe (colisión extremadamente rara),
      // puedes intentar generar uno nuevo o devolver un error.
      // Para simplificar, aquí devolvemos un error.
      return res.status(400).json({ error: 'Código de barras generado ya existe (colisión). Intente de nuevo.' });
    }
    // Actualizar herramienta con el código de barras
    herramienta.barcode = barcodeValue;
    await herramienta.save();
    res.json({
      message: 'Código de barras generado exitosamente',
      barcode: barcodeValue,
      herramienta: herramienta
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Generar imagen del código de barras
export const generarImagenCodigoBarras = async (req, res) => {
  try {
    const { barcode } = req.params;
    
    if (!barcode) {
      return res.status(400).json({ error: 'Código de barras requerido' });
    }

    // Crear canvas para generar la imagen
    const canvas = createCanvas(200, 100);
    
    // Generar código de barras en el canvas
    JsBarcode(canvas, barcode, {
      format: "CODE128",
      width: 2,
      height: 60,
      displayValue: true,
      fontSize: 12,
      textMargin: 5
    });

    // Convertir canvas a buffer
    const buffer = canvas.toBuffer('image/png');
    
    // Enviar imagen como respuesta
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': buffer.length
    });
    
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Buscar herramienta por código de barras
export const buscarPorCodigoBarras = async (req, res) => {
  try {
    const { barcode } = req.params;
    
    const herramienta = await Herramienta.findOne({ barcode });
    
    if (!herramienta) {
      return res.status(404).json({ error: 'Herramienta no encontrada con este código de barras' });
    }

    res.json(herramienta);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Generar códigos de barras para todas las herramientas sin código
export const generarCodigosBarrasMasivo = async (req, res) => {
  try {
    const herramientasSinCodigo = await Herramienta.find({ 
      $or: [
        { barcode: { $exists: false } },
        { barcode: null },
        { barcode: '' }
      ]
    });
    const resultados = [];
    
    for (const herramienta of herramientasSinCodigo) {
      // Generar un valor base para el hash SIN el prefijo "TOOL-"
      const baseValue = `${herramienta.codigo}-${Date.now()}-${Math.random()}`; // Añadir Math.random para mayor unicidad en masivo
      // Generar un código de barras corto usando un hash
      const barcodeValue = generateShortHash(baseValue, 8); // Código de 8 caracteres
      
      // Verificar unicidad (aunque con hash es muy improbable)
      const existingBarcode = await Herramienta.findOne({ barcode: barcodeValue });
      if (!existingBarcode) {
        herramienta.barcode = barcodeValue;
        await herramienta.save();
        resultados.push({
          id: herramienta._id,
          nombre: herramienta.nombre,
          codigo: herramienta.codigo,
          barcode: barcodeValue
        });
      }
    }
    res.json({
      message: `Códigos de barras generados para ${resultados.length} herramientas`,
      herramientas: resultados
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Verificar duplicados de herramientas
export const verificarDuplicados = async (req, res) => {
  try {
    // Buscar herramientas con nombres similares o códigos duplicados
    const herramientas = await Herramienta.find();
    const duplicados = [];
    
    for (let i = 0; i < herramientas.length; i++) {
      for (let j = i + 1; j < herramientas.length; j++) {
        const h1 = herramientas[i];
        const h2 = herramientas[j];
        
        // Verificar nombres similares (ignorando mayúsculas/minúsculas y espacios)
        const nombre1 = h1.nombre.toLowerCase().trim();
        const nombre2 = h2.nombre.toLowerCase().trim();
        
        if (nombre1 === nombre2 || h1.codigo === h2.codigo) {
          duplicados.push({
            herramienta1: {
              id: h1._id,
              nombre: h1.nombre,
              codigo: h1.codigo
            },
            herramienta2: {
              id: h2._id,
              nombre: h2.nombre,
              codigo: h2.codigo
            },
            tipo: nombre1 === nombre2 ? 'nombre_duplicado' : 'codigo_duplicado'
          });
        }
      }
    }

    res.json({
      duplicados: duplicados,
      total: duplicados.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
