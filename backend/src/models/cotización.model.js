import mongoose from "mongoose";

const cotizacionSchema = new mongoose.Schema({
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: "Cliente", required: true },
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  productos: [
    {
      descripcion: String,
      cantidad: Number,
      unidad: String,
      precioUnitario: Number,
      igv: Number,
      vUnit: Number,
      total: Number,
      producto: { type: mongoose.Schema.Types.ObjectId, ref: "Producto" },
      herramienta: { type: mongoose.Schema.Types.ObjectId, ref: "Herramienta" }
    },
  ],
  fecha: { type: Date, default: Date.now },
  totalGeneral: Number,
  descuento: { type: Number, default: 0 },
  moneda: { type: String, default: "SOLES" },
  tipoCambio: { type: Number, default: 1 },
  observaciones: String,
  descripcionServicio: String,
  numeroCotizacion: { type: String, required: true, unique: true },
  validez: { type: String, default: "15 días" },
  estado: {
    type: String,
    required: true,
    enum: ['Pendiente', 'Aceptada', 'Rechazada', 'Facturada'],
    default: 'Pendiente'
  },

}, { timestamps: true });

// Virtual property to link to the Factura
cotizacionSchema.virtual('factura', {
  ref: 'Factura', // The model to use
  localField: '_id', // Find documents in the 'Factura' model where...
  foreignField: 'cotizacion', // ...the 'cotizacion' field...
  justOne: true // We expect only one invoice per quotation
});

// Virtual property to link to Compras (Requerimientos)
cotizacionSchema.virtual('compras', {
  ref: 'Compra',
  localField: '_id',
  foreignField: 'cotizacion'
});

// To include virtuals in res.json(), you need to set this schema option
cotizacionSchema.set('toJSON', { virtuals: true });
cotizacionSchema.set('toObject', { virtuals: true });

export default mongoose.model("Cotizacion", cotizacionSchema);
