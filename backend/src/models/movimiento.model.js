import mongoose from 'mongoose';

const movimientoSchema = new mongoose.Schema({
    herramienta: { type: mongoose.Schema.Types.ObjectId, ref: 'Herramienta', required: true },
    tipo: { type: String, enum: ['entrada', 'salida'], required: true },
    cantidad: { type: Number, required: true, min: 1 },
    fecha: { type: Date, default: Date.now },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    nota: { type: String },
    obra: { type: String},
    foto: { type: String }
}, { timestamps: true });

export default mongoose.model('Movimiento', movimientoSchema);