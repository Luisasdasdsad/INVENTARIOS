import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({

    nombre: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    rol: {type: String, required: true, enum: ['superadmin', 'admin', 'jefe_inventario', 'administracion', 'tecnico', 'ingeniero', 'trabajador'], default: 'trabajador'},
    telefono: { type: String, trim: true },
    celular: { type: String, trim: true },
    direccion: { type: String, trim: true },
    estadoLaboral: { type: String, enum: ['disponible', 'poco_atareado', 'muy_atareado', 'no_disponible'], default: 'disponible' },
}, { timestamps: true });

const User = mongoose.model('Usuario', userSchema);

export default User;
