import mongoose from 'mongoose';

const notificacionSchema = new mongoose.Schema({
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    tipo : { type: String, enum: ['asignacion_ot', 'cambio_estado', 'mensaje', 'compra'], default: 'asignacion_ot' },
    mensaje: { type: String, required: true },
    referenciaId: { type: mongoose.Schema.Types.ObjectId, refPath: 'referenciaModelo' },
    referenciaModelo: { type: String, enum: ['OrdenTrabajo', 'Compra'], default: 'OrdenTrabajo' },
    leido: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Notificacion', notificacionSchema);