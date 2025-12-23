import mongoose from 'mongoose';

const eventoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    allDay: { type: Boolean, default: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    description: { type: String },
    color: { type: String }, // Para codificar eventos por color
}, { timestamps: true });

export default mongoose.model('Evento', eventoSchema);
