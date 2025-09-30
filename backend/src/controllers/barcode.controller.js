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
    // Generar un valor base para el hash usando marca, modelo y serie
    const baseValue = `${herramienta.marca}-${herramienta.modelo}-${herramienta.serie || ''}-${Date.now()}`;
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
// --- AJUSTES PARA HACER EL CÓDIGO DE BARRAS MÁS PEQUEÑO ---
    // Puedes pasar estos valores como query parameters (ej. /imagen/:barcode?w=1&h=30)
    // o definirlos aquí directamente. Para empezar, los definimos aquí.
    const barWidth = 1; // Ancho de cada barra (1px es bastante pequeño)
    const barHeight = 30; // Altura de las barras (30px es un buen tamaño para etiquetas)
    const textFontSize = 10; // Tamaño de la fuente del texto debajo del código
    const barcodeMargin = 2; // Margen alrededor del código de barras
    // Calcular el tamaño del canvas. JsBarcode calculará el ancho total
    // basado en el 'width' y la longitud del código.
    // Un estimado: (longitud_codigo * barWidth * factor_formato) + (margen_horizontal)
    // Para CODE128, es aproximadamente 11 módulos por carácter + 13 módulos de inicio/fin.
    // Un canvas de 150x50px suele ser un buen punto de partida para un código de 8 caracteres.
    const canvasWidth = 150; // Ajusta según el resultado, 150px es un buen inicio
    const canvasHeight = 50; // Ajusta según el resultado, 50px es un buen inicio
    const canvas = createCanvas(canvasWidth, canvasHeight);
    
    // Generar código de barras en el canvas
    JsBarcode(canvas, barcode, {
      format: "CODE128",
      width: barWidth,
      height: barHeight,
      displayValue: true,
      fontSize: textFontSize,
      textMargin: barcodeMargin,
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
      // Generar un valor base para el hash usando marca, modelo y serie
      const baseValue = `${herramienta.marca}-${herramienta.modelo}-${herramienta.serie || ''}-${Date.now()}-${Math.random()}`;
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
          marca: herramienta.marca,
          modelo: herramienta.modelo,
          serie: herramienta.serie,
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

        // Ahora verificamos duplicados por combinación de marca, modelo y serie
        const marca1 = h1.marca.toLowerCase().trim();
        const modelo1 = h1.modelo.toLowerCase().trim();
        const serie1 = (h1.serie || '').toLowerCase().trim();

        const marca2 = h2.marca.toLowerCase().trim();
        const modelo2 = h2.modelo.toLowerCase().trim();
        const serie2 = (h2.serie || '').toLowerCase().trim();
        
        if (nombre1 === nombre2 || (marca1 === marca2 && modelo1 === modelo2 && serie1 === serie2)) {
          duplicados.push({
            herramienta1: {
              id: h1._id,
              nombre: h1.nombre,
              marca: h1.marca,
              modelo: h1.modelo,
              serie: h1.serie
            },
            herramienta2: {
              id: h2._id,
              nombre: h2.nombre,
              marca: h2.marca,
              modelo: h2.modelo,
              serie: h2.serie
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
