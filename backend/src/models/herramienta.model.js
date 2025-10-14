import mongoose from "mongoose";

const herramientaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  marca: { type: String, required: true },
  modelo: { type: String, required: true },
  tipo: { type: String, enum: ["herramientas","útiles de escritorio","equipos de computo","muebles","útiles de aseo","materiales","equipos de protección personal (EPPS)"], required: true },
  cantidad: { type: Number, required: true, min: 0 },
  unidad: { type: String, default: "unidad" }, 
  estado: { type: String, enum: ["disponible", "prestado"], default: "disponible" },
  descripcion: { type: String, default: "" },
  precio: { type: Number, min: 0, default: 0 },
  barcode: { type: String, unique: true, sparse: true }, // Código de barras generado
  qrCode: {type: String, unique: true, sparse:true }, //Código QR
  foto: {type: String},

}, { timestamps: true });

export default mongoose.model("Herramienta", herramientaSchema);
