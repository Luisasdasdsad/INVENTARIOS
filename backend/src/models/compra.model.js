import mongoose from 'mongoose';

const compraSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    codigo: { type: String, unique: true },
    estado: { type: String, enum: [ 'pendiente', 'cotizado', 'aprobado', 'rechazado', 'comprado' ], default: 'pendiente' },
    
    solicitante: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    fechaSolicitud: { type: Date, default: Date.now },
    items: [{
        nombre: { type: String, required: true },
        descripcion: { type: String, required: true },
        cantidad: { type: Number, required: true },
        unidad: { type: String, default: 'und' },
        foto: { type: String }, // Foto opcional por ítem

        precioUnitario: { type: Number },
        total: { type: Number }
    }],
    prioridad: { type: String, enum: [ 'baja', 'media', 'alta' ], default: 'media' },
    cotizador: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
    proveedor: { type: mongoose.Schema.Types.ObjectId, ref: "Proveedor" },
    sustentoCotizacionUrl: { type: String },
    montoTotalEstimado: { type: Number },

    aprobador: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
    fechaAprobacion: { type: Date },
    comentariosAprobacion: { type: String },

    comprador: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
    numeroFactura: { type: String },
    facturaUrl: { type: String },
    fechaCompra: { type: Date },
    montoFinal: { type: Number },
}, { timestamps: true });

export default mongoose.model("Compra", compraSchema);