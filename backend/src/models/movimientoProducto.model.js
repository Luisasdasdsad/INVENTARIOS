import mongoose from 'mongoose';

const movimientoProductoSchema = new mongoose.Schema({
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
    tipo: { type: String, enum: ['entrada', 'salida', 'ajuste'], required: true }, // 'ajuste' para correcciones de inventario
    cantidad: { type: Number, required: true, min: 1 },
    fecha: { type: Date, default: Date.now },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Usuario que realizó el movimiento
    nota: { type: String },
    referencia: { type: String } // Ej: "Factura #123", "Guía de Remisión #456", "Ajuste por inventario físico"
    }, { timestamps: true });

export default mongoose.model('MovimientoProducto', movimientoProductoSchema);