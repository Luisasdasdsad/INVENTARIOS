import Factura from '../models/factura.model.js';
import Cotizacion from '../models/cotización.model.js';
import axios from 'axios';


// --- Helper para obtener el siguiente número de factura (ej: F001-0001) ---
const getNextFacturaNumber = async () => {
  const serie = process.env.NUBEFACT_SERIE_FACTURA || 'F001'; // Unificamos el nombre

  // Busca la última factura creada para obtener el número más alto
  // Filtramos por la serie actual para obtener el correlativo correcto para esa serie
  const lastFactura = await Factura.findOne({ numeroFactura: new RegExp(`^${serie}-`) }).sort({ createdAt: -1 });

  let nextNumber = 1;
  if (lastFactura && lastFactura.numeroFactura) {
    // Extrae el número de la secuencia (ej: de "F001-0001" extrae "0001")
    const lastNumberStr = lastFactura.numeroFactura.split('-')[1];
    if (lastNumberStr) {
      nextNumber = parseInt(lastNumberStr) + 1;
    }
  }

  // Formatea el número con ceros a la izquierda y el prefijo
  const nextFacturaNumber = `${serie}-${nextNumber.toString().padStart(4, '0')}`;
  return nextFacturaNumber;
};


// --- Crear una nueva factura a partir de una cotización ---
export const createFactura = async (req, res) => {
  const { cotizacionId } = req.body;

  if (!cotizacionId) {
    return res.status(400).json({ msg: "Se requiere el ID de la cotización." });
  }

  try {
    // 1. Buscar la cotización y verificar su estado
    const cotizacion = await Cotizacion.findById(cotizacionId);

    if (!cotizacion) {
      return res.status(404).json({ msg: "La cotización no fue encontrada." });
    }
    if (cotizacion.estado !== 'Aceptada') {
      return res.status(400).json({ msg: `No se puede facturar una cotización en estado "${cotizacion.estado}".` });
    }

    // 2. Generar el número de factura único y correlativo
    const numeroFactura = await getNextFacturaNumber();

    // 2.5. Calcular totales a partir de la cotización
    const items = cotizacion.productos;
    const totalGeneral = cotizacion.totalGeneral;
    
    // Suponiendo que el 'total' de cada item en la cotización INCLUYE IGV
    const subtotal = items.reduce((acc, item) => acc + (item.total / 1.18), 0);
    const igv = totalGeneral - subtotal;

    // 3. Crear la nueva factura copiando los datos
    const nuevaFactura = new Factura({
      numeroFactura,
      cliente: cotizacion.cliente,
      usuario: req.user._id, // El usuario que genera la factura
      cotizacion: cotizacion._id,
      items: cotizacion.productos.map(p => ({
        descripcion: p.descripcion,
        cantidad: p.cantidad,
        precioUnitario: p.precioUnitario,
        total: p.total,
      })),
      subtotal: parseFloat(subtotal.toFixed(2)),
      descuento: cotizacion.descuento,
      igv: parseFloat(igv.toFixed(2)),
      totalGeneral: cotizacion.totalGeneral,
      moneda: cotizacion.moneda || 'SOLES', // Asegura un valor por defecto
      fechaEmision: new Date(),
      // Opcional: Calcular fecha de vencimiento (ej: 30 días)
      fechaVencimiento: new Date(new Date().setDate(new Date().getDate() + 30)),
    });

    // 4. Guardar la nueva factura
    await nuevaFactura.save();

    // 5. Actualizar el estado de la cotización a 'Facturada'
    cotizacion.estado = 'Facturada';
    await cotizacion.save();

    // 6. Devolver la factura recién creada
    res.status(201).json(nuevaFactura);

  } catch (error) {
    console.error("Error al crear la factura:", error);
    res.status(500).json({ msg: "Error en el servidor al crear la factura.", error: error.message });
  }
};

// --- Obtener todas las facturas ---
export const getFacturas = async (req, res) => {
  try {
    const facturas = await Factura.find()
      .populate('cliente', 'nombre')
      .populate('usuario', 'nombre')
      .sort({ createdAt: -1 });
    res.json(facturas);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener las facturas." });
  }
};

// --- Obtener una factura por ID ---
export const getFacturaById = async (req, res) => {
  try {
    const factura = await Factura.findById(req.params.id)
      .populate('cliente')
      .populate('usuario', 'nombre email');
    
    if (!factura) {
      return res.status(404).json({ msg: "Factura no encontrada." });
    }
    res.json(factura);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener la factura." });
  }
};

// --- Enviar factura a SUNAT via PSE ---
export const enviarFacturaSunat = async (req, res) => {
  // Verificación de configuración del servidor
  if (!process.env.NUBEFACTURA_API_URL || !process.env.NUBEFACTURA_API_TOKEN) {
    console.error("Error Crítico: Las variables de entorno NUBEFACTURA_API_URL y/o NUBEFACTURA_API_TOKEN no están definidas en el archivo .env");
    return res.status(500).json({ message: "Error de configuración del servidor: Faltan las credenciales del proveedor de facturación." });
  }

  try {
    const { id } = req.params;
    // Usamos .populate('cliente') para traer los datos del cliente (RUC, nombre, etc.)
    const factura = await Factura.findById(id).populate('cliente');

    if (!factura) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }

    if (factura.estadoSunat !== 'Pendiente de Envío') {
      return res.status(400).json({ message: `La factura ya fue procesada (Estado: ${factura.estadoSunat})` });
    }

    // Verificación de seguridad: Asegurarse de que el cliente existe
    if (!factura.cliente) {
      return res.status(400).json({ message: 'La factura está asociada a un cliente que ha sido eliminado. No se puede procesar.' });
    }

    // --- RE-CÁLCULO DE TOTALES PARA CONSISTENCIA ---
    // 1. Filtrar solo los items válidos que se enviarán
    const itemsValidos = factura.items.filter(item => item.descripcion && item.total > 0);

    // 2. Recalcular los totales basados ÚNICAMENTE en los items válidos
    const nuevoSubtotal = itemsValidos.reduce((acc, item) => acc + (item.total / 1.18), 0);
    const nuevoTotalGeneral = itemsValidos.reduce((acc, item) => acc + item.total, 0);
    const nuevoIgv = nuevoTotalGeneral - nuevoSubtotal;

    // Formatear a 2 decimales para evitar problemas de precisión
    const subtotalFinal = parseFloat(nuevoSubtotal.toFixed(2));
    const igvFinal = parseFloat(nuevoIgv.toFixed(2));
    const totalGeneralFinal = parseFloat(nuevoTotalGeneral.toFixed(2));

    // 1. PREPARAMOS EL JSON PARA LA API DEL PSE (Ejemplo Nubefact)
    const dataParaPSE = {
      "operacion": "generar_comprobante",
      "tipo_de_comprobante": 1, // 1 para FACTURA
      "serie": factura.numeroFactura.split('-')[0],
      "numero": parseInt(factura.numeroFactura.split('-')[1]),
      "sunat_transaction": 1,
      "cliente_tipo_de_documento": 6, // 6 para RUC
      "cliente_numero_de_documento": factura.cliente.ruc,
      "cliente_denominacion": factura.cliente.nombre,
      "cliente_direccion": factura.cliente.direccion,
      "cliente_email": factura.cliente.email || "",
      "fecha_de_emision": new Date(factura.fechaEmision).toISOString().split('T')[0],
      "moneda": factura.moneda === 'SOLES' ? 1 : 2, // 1 para SOLES, 2 para DOLARES
      "porcentaje_de_igv": 18.00,
      "subtotal": subtotalFinal,
      "total_igv": igvFinal,
      "total_gravada": subtotalFinal, // La base imponible es el subtotal recalculado
      "total": totalGeneralFinal,
      "enviar_automaticamente_a_la_sunat": true,
      "enviar_automaticamente_al_cliente": false,
      "items": itemsValidos
      .map(item => ({
        "unidad_de_medida": "NIU", // "NIU" para Unidad (Servicio) o ZZ para producto
        "codigo": item._id.toString(),
        "descripcion": item.descripcion,
        "cantidad": item.cantidad,
        "valor_unitario": item.precioUnitario / 1.18, // Precio sin IGV
        "precio_unitario": item.precioUnitario,
        "subtotal": item.total / 1.18,
        "tipo_de_igv": 1, // Gravado - Operación Onerosa
        "igv": item.total - (item.total / 1.18),
        "total": item.total,
      }))
    };

    // 2. ENVIAMOS LA PETICIÓN AL PSE USANDO LAS VARIABLES DE ENTORNO
    const responsePSE = await axios.post(
      process.env.NUBEFACTURA_API_URL, 
      dataParaPSE, 
      {
        headers: {
          'Authorization': `Bearer ${process.env.NUBEFACTURA_API_TOKEN}`, 
          'Content-Type': 'application/json'
        }
      }
    );

    // 3. PROCESAMOS LA RESPUESTA DEL PSE
    if (responsePSE.data.errors) {
      // Si Nubefact devuelve errores
      factura.estadoSunat = 'Rechazada';
      factura.respuestaSunat = { errors: responsePSE.data.errors };
    } else {
      // Si es exitoso
      factura.estadoSunat = 'Aceptada';
      factura.respuestaSunat = responsePSE.data;
      factura.enlacePdf = responsePSE.data.enlace_del_pdf;
      factura.enlaceXml = responsePSE.data.enlace_del_xml;
    }
    
    await factura.save();

    res.status(200).json({ message: 'Factura procesada con éxito', factura });

  } catch (error) {
    console.error("Error al enviar a SUNAT:", error.response?.data || error.message);
    res.status(500).json({ message: 'Error al procesar la factura con el PSE', details: error.response?.data || error.message });
  }
};