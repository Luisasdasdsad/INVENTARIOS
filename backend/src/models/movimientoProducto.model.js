import mongoose from 'mongoose';

const movimientoProductoSchema = new mongoose.Schema({
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
    tipo: { type: String, enum: ['entrada', 'salida', 'ajuste'], required: true }, // 'ajuste' para correcciones de inventario
    cantidad: { type: Number, required: true, min: 1 },
    fecha: { type: Date, default: Date.now },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }, // Usuario que realizó el movimiento
    nota: { type: String },
    referencia: { type: String }, // Ej: "Factura #123", "Guía de Remisión #456"
    obra: { type: String }, // Ej: "Grifo Pucara", "Residencial Los Andes"
    foto: { type: String } // URL de la foto de evidencia
    }, { timestamps: true });

export default mongoose.model('MovimientoProducto', movimientoProductoSchema);