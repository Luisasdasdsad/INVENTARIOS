import mongoose from "mongoose";

const clienteSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    documento: { type: String },
    telefono: { type: String },
    email: { type: String },
    direccion: { type: String },
    empresa: { type: String },

}, { timestamps: true });

export default mongoose.model("Cliente", clienteSchema);

