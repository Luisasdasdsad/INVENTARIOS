import mongoose from "mongoose";

const cotizacionSchema = new mongoose.Schema({
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: "Cliente", required: true },
  productos: [
    {
      descripcion: String,
      cantidad: Number,
      unidad: String,
      precioUnitario: Number,
      igv: Number,
      vUnit: Number,
      total: Number,
    },
  ],
  fecha: { type: Date, default: Date.now },
  totalGeneral: Number,
  descuento: { type: Number, default: 0 },
  moneda: { type: String, default: "SOLES" },
  observaciones: String,
  numeroCotizacion: { type: String, required: true, unique: true },

}, { timestamps: true });

export default mongoose.model("Cotizacion", cotizacionSchema);
