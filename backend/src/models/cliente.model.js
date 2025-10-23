import mongoose from "mongoose";

const clienteSchema = new mongoose.Schema({
    tipoDoc: { type: String, required: true },
    ruc: { type: String },
    numero: { type: String, required: true },
    nombre: { type: String, required: true },
    nombreComercial: { type: String },
    pais: { type: String, default: "PERU" },
    ubigeo: { type: String },
    direccion: { type: String },
    referencia: { type: String },
    telefono: { type: String },
    email: { type: String },
    contacto: { type: String },
    nombreApellido: { type: String },
    sitioWeb: { type: String },
    observaciones: { type: String },

}, { timestamps: true });

export default mongoose.model("Cliente", clienteSchema);

