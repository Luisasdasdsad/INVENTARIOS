    import mongoose from 'mongoose';

const compraSchema = new mongoose.Schema({
    nombreObra: { type: String, required: true }, // Nombre del proyecto principal
    asunto: { type: String, required: true }, // Título específico de la compra
    archivoSolicitudUrl: { type: String }, // Archivo adjunto con la lista de items (PDF/Excel)
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
    cotizacion: { type: mongoose.Schema.Types.ObjectId, ref: "Cotizacion" }, // Enlace a la cotización de origen
    sustentoCotizacionUrl: { type: String },
    montoTotalEstimado: { type: Number },

    aprobador: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
    fechaAprobacion: { type: Date },
    comentarios: { type: String },

    comprador: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
    numeroFactura: { type: String },
    facturaUrl: { type: String },
    fechaCompra: { type: Date },
    montoFinal: { type: Number },
}, { timestamps: true });

export default mongoose.model("Compra", compraSchema);