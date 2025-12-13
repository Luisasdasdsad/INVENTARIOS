import mongoose from 'mongoose';

const productoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String },
  unidad: { type: String, default: 'unidad' },
  stock: { type: Number, required: true, default: 0 },
  precioUnitario: { type: Number, default: 0 },
  categoria: { type: String, required: true },
  marca: { type: String },
  modelo: { type: String },
  moneda: { type: String, default: 'SOLES' },
  foto: { type: String },
  barcode: { type: String, unique: true, sparse: true },
  qrCode: { type: String, unique: true, sparse: true }
}, { timestamps: true });

export default mongoose.model('Producto', productoSchema);