import mongoose from 'mongoose';

const movimientoSchema = new mongoose.Schema({
    herramientas: [{
        herramienta: { type: mongoose.Schema.Types.ObjectId, ref: 'Herramienta', required: true },
        cantidad: { type: Number, required: true, min: 1 }
    }],
    tipo: { type: String, enum: ['entrada', 'salida'], required: true },
    fecha: { type: Date, default: Date.now },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    nota: { type: String },
    obra: { type: String},
    foto: { type: String }
}, { timestamps: true });

export default mongoose.model('Movimiento', movimientoSchema);