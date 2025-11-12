import User from '../models/usuario.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


export const register = async (req, res) => {
    try {
    const { nombre, email, password, rol } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'Usuario ya existe' });

    // Si no hay usuario autenticado (primer registro), permitir crear admin
    if (!req.user) {
        if (rol !== 'admin') {
            return res.status(400).json({ msg: 'El primer usuario debe ser administrador' });
        }
    } else {
        // Solo admin puede crear usuarios con rol admin
        if (rol === 'admin' && req.user.rol !== 'admin') {
            return res.status(403).json({ msg: 'Solo administradores pueden crear usuarios administradores' });
        }
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    const user = new User({ nombre, email, password: hashed, rol: rol || 'trabajador' });
    await user.save();
    res.status(201).json({ msg: 'Usuario creado' });
    } catch (error) {
        res.status(500).json({ msg: 'Error en servidor', error });
    }
};

export const login = async (req, res) => {
    try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Credenciales inválidas' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Credenciales inválidas' });

    const payload = { id: user._id, email: user.email, nombre: user.nombre, rol: user.rol };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

    res.json({ token, user: { id: user._id, nombre: user.nombre, email: user.email, rol: user.rol } });
    } catch (error) {
    console.error("❌ Error en /login:", error); // imprime en Railway Logs
    res.status(500).json({
        msg: "Error en servidor",
        error: error.message || error
        });
    }
};

export const validate = async (req, res) => {
    try {
        // El middleware auth ya verifica el token, así que req.user está disponible
        res.json({ user: { id: req.user.id, nombre: req.user.nombre, email: req.user.email, rol: req.user.rol } });
    } catch (error) {
        res.status(500).json({ msg: 'Error en servidor', error });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });

        // Verificar contraseña actual
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Contraseña actual incorrecta' });

        // Validar nueva contraseña
        if (newPassword.length < 6) {
            return res.status(400).json({ msg: 'La nueva contraseña debe tener al menos 6 caracteres' });
        }

        // Encriptar nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(newPassword, salt);

        // Actualizar contraseña
        user.password = hashed;
        await user.save();

        res.json({ msg: 'Contraseña actualizada exitosamente' });
    } catch (error) {
        res.status(500).json({ msg: 'Error en servidor', error });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { nombre, email } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });

        // Verificar si el email ya existe en otro usuario
        if (email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) return res.status(400).json({ msg: 'El email ya está en uso' });
        }

        user.nombre = nombre;
        user.email = email;
        await user.save();

        res.json({
            msg: 'Perfil actualizado exitosamente',
            user: { id: user._id, nombre: user.nombre, email: user.email, rol: user.rol }
        });
    } catch (error) {
        res.status(500).json({ msg: 'Error en servidor', error });
    }
};
