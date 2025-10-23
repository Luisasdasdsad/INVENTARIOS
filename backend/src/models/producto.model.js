import mongoose from 'mongoose';

const productoSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true },
  unidad: { type: String },
  stock: { type: Number, default: 0 },
  precioUnitario: { type: Number, min: 0, default: 0 },
  categoria: { type: String },
  marca: { type: String, trim: true },
  modelo: { type: String, trim: true },
  moneda: { type: String, enum: ['SOLES', 'DOLARES'], default: 'SOLES' },
  barcode: { type: String, unique: true, sparse: true },
  qrCode: { type: String, unique: true, sparse: true },
  foto: { type: String }, // añadimos campo foto por consistencia
}, { timestamps: true });

export default mongoose.model('Producto', productoSchema);
