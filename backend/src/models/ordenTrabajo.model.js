// models/OrdenTrabajo.js
import mongoose from "mongoose";

const ordenTrabajoSchema = new mongoose.Schema({
    numeroOT: { type: String, required: true, unique: true },

    // Referencia a Cotización
    cotizacion: { type: mongoose.Schema.Types.ObjectId, ref: "Cotizacion" },

    cliente: { type: String, required: true },

    productos: [{
        producto: { type: mongoose.Schema.Types.ObjectId, ref: "Producto", required: true },
        cantidad: { type: Number, required: true, min: 1 }
    }],

    estado: { 
        type: String, 
        enum: ["pendiente", "en_proceso", "completado"], 
        default: "pendiente" 
    },

    tecnicoAsignado: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Usuario" 
    },

    fechaInicio: { type: Date },
    fechaFin: { type: Date },

    observaciones: { type: String }
}, { timestamps: true });

export default mongoose.model("OrdenTrabajo", ordenTrabajoSchema);
