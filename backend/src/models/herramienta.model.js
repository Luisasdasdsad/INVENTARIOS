import mongoose from "mongoose";

const herramientaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  marca: { type: String, required: true },
  modelo: { type: String, required: true },
  serie: { type: String, unique: true, sparse: true },
  cantidad: { type: Number, required: true, min: 0 },
  unidad: { type: String, default: "unidad" }, 
  estado: { type: String, enum: ["disponible", "prestado"], default: "disponible" },
  barcode: { type: String, unique: true, sparse: true }, // Código de barras generado
  qrCode: {type: String, unique: true, sparse:true }, //Código QR 
}, { timestamps: true });

export default mongoose.model("Herramienta", herramientaSchema);
