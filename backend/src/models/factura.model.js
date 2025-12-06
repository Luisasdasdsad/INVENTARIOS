import mongoose from "mongoose";

const facturaSchema = new mongoose.Schema({
  numeroFactura: { type: String, required: true, unique: true },
  
  // Referencias a otros modelos
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: "Cliente", required: true },
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  cotizacion: { type: mongoose.Schema.Types.ObjectId, ref: "Cotizacion", required: true },

  // Datos copiados de la cotización en el momento de la creación
  items: [
    {
      descripcion: String,
      cantidad: Number,
      precioUnitario: Number,
      total: Number,
    },
  ],
  
  // Totales
  subtotal: { type: Number, required: true },
  descuento: { type: Number, default: 0 },
  igv: { type: Number, required: true },
  totalGeneral: { type: Number, required: true },
  moneda: { type: String, required: true, enum: ["SOLES", "DOLARES"] },

  // Estado y fechas de la factura
  estado: { type: String, required: true, enum: ['Pendiente de Pago', 'Pagada', 'Vencida', 'Anulada'], default: 'Pendiente de Pago' },
  fechaEmision: { type: Date, default: Date.now },
  fechaVencimiento: { type: Date },

  // --- CAMPOS PARA INTEGRACIÓN CON SUNAT ---
  estadoSunat: {
    type: String,
    enum: ['Pendiente de Envío', 'Enviada', 'Aceptada', 'Rechazada', 'Anulada SUNAT'],
    default: 'Pendiente de Envío',
  },
  respuestaSunat: {
    type: Object, // Para guardar la respuesta completa del PSE/SUNAT (CDR, errores, etc.)
  },
  enlacePdf: {
    type: String, // URL del PDF oficial generado por el PSE
  },
  enlaceXml: {
    type: String, // URL del XML oficial generado por el PSE
  },
  // --- FIN CAMPOS SUNAT ---
  
}, { timestamps: true });

export default mongoose.model("Factura", facturaSchema);