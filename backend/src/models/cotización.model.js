import mongoose from "mongoose";

const cotizacionSchema = new mongoose.Schema({
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: "Cliente", required: true },
  productos: [
    {
      descripcion: String,
      cantidad: Number,
      precioUnitario: Number,
      total: Number,
    },
  ],
  fecha: { type: Date, default: Date.now },
  totalGeneral: Number,
  observaciones: String,
  numeroCotizacion: { type: String, required: true },
  
}, { timestamps: true });

export default mongoose.model("Cotizacion", cotizacionSchema);
