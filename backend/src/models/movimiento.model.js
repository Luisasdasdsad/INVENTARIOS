import mongoose from 'mongoose';

const movimientoSchema = new mongoose.Schema({
    herramienta: { type: mongoose.Schema.Types.ObjectId, ref: 'Herramienta', required: true },
    tipo: { type: String, enum: ['entrada', 'salida'], required: true },
    cantidad: { type: Number, required: true, min: 1 },
    fecha: { type: Date, default: Date.now },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    nota: { type: String },
<<<<<<< HEAD
    obra: { type: String, trim:true, maxlenght: 200, required: function() {return this.tipo ==='salida';} },
    foto: { type: String, required: function() {return this.tipo ==='entrada' || this.tipo === 'salida';} }

=======
    obra: { type: String},
    foto: { type: String }
>>>>>>> 9a5119de10d4f228053212b90cdb27f36c2c2b9e
}, { timestamps: true });

export default mongoose.model('Movimiento', movimientoSchema);