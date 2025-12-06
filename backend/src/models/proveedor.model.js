import mongoose from "mongoose";

const proveedorSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, "El nombre o razón social es obligatorio."],
        trim: true,
    },
    ruc: {
        type: String,
        trim: true,
        validate: {
            validator: function(v) {
                // Permite que el campo esté vacío o nulo, pero si tiene un valor, debe ser de 11 dígitos.
                return v == null || v.trim() === '' || /^\d{11}$/.test(v);
            },
            message: "El RUC debe tener 11 dígitos numéricos."
        }
    },
    direccion: {
        type: String,
        trim: true,
    },
    telefono: {
        type: [String],
        default: []
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
    },
    categoria: {
        type: String,
        trim: true,
        enum: ['Ferretería', 'Textil', 'Eléctrico', 'Sanitario', 'Oficina', 'Varios'],
        default: 'Varios'
    },
    descripcion: {
        type: String,
        trim: true,
    },
    // Puedes añadir más campos si los necesitas
    // contacto: { type: String, trim: true },
    // observaciones: { type: String, trim: true },
}, { timestamps: true });

// --- INICIO DE LA CORRECCIÓN ---
// Definimos los índices explícitamente para asegurar su correcta creación.
proveedorSchema.index({ nombre: 1 }, { unique: true });

export default mongoose.model("Proveedor", proveedorSchema);