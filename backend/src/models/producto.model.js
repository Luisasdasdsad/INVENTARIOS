import mongoose from 'mongoose';

const productoSchema = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, trim: true },
    sku: { type: String, unique: true, sparse: true, trim: true }, // Stock Keeping Unit (código único)
    
    cantidad: { type: Number, required: true, min: 0, default: 0 },
    precioUnitario: { type: Number, min: 0, default: 0 },
    proveedor: { type: String, trim: true },
    fechaUltimaEntrada: { type: Date },
    fechaUltimaSalida: { type: Date },
    barcode: { type: String, unique: true, sparse: true, trim: true }, // Código de barras generado
    }, { timestamps: true });

export default mongoose.model('Producto', productoSchema);
