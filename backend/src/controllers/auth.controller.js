import User from '../models/usuario.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


export const register = async (req, res) => {
    try {
    const { nombre, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'Usuario ya existe' });


    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    const user = new User({ nombre, email, password: hashed });
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

    const payload = { id: user._id, email: user.email, nombre: user.nombre };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

    res.json({ token, user: { id: user._id, nombre: user.nombre, email: user.email } });
    } catch (error) {
    res.status(500).json({ msg: 'Error en servidor', error });
    }
};

export const validate = async (req, res) => {
    try {
        // El middleware auth ya verifica el token, así que req.user está disponible
        res.json({ user: { id: req.user.id, nombre: req.user.nombre, email: req.user.email } });
    } catch (error) {
        res.status(500).json({ msg: 'Error en servidor', error });
    }
};
