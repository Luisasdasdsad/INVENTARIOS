import mongoose from "mongoose";

const herramientaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  codigo: { type: String, required: true, unique: true },
  cantidad: { type: Number, required: true, min: 0 },
  unidad: { type: String, default: "unidad" }, 
  estado: { type: String, enum: ["disponible", "prestado"], default: "disponible" },
  barcode: { type: String, unique: true, sparse: true }, // Código de barras generado
}, { timestamps: true });

export default mongoose.model("Herramienta", herramientaSchema);
