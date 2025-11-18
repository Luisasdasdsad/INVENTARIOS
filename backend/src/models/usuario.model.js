import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({

    nombre: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    rol: { type: String, enum: ['admin', 'responsable_inventario', 'tecnico'], default: 'tecnico' }

}, { timestamps: true });

const User = mongoose.model('Usuario', userSchema);

export default User;



