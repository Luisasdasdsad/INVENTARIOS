import User from '../models/usuario.model.js';

export const getUsuarios = async (req, res) => {
    try {
        const usuarios = await User.find({}, '-password'); // Excluye la contraseña
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener usuarios', error });
    }
};

export const updateUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email, rol } = req.body;

        // Solo admin puede actualizar usuarios
        if (req.user.rol !== 'admin') {
            return res.status(403).json({ msg: 'Solo administradores pueden actualizar usuarios' });
        }

        const usuario = await User.findByIdAndUpdate(
            id,
            { nombre, email, rol },
            { new: true, select: '-password' }
        );

        if (!usuario) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        res.json(usuario);
    } catch (error) {
        res.status(500).json({ msg: 'Error al actualizar usuario', error });
    }
};

export const deleteUsuario = async (req, res) => {
    try {
        const { id } = req.params;

        // Solo admin puede eliminar usuarios
        if (req.user.rol !== 'admin') {
            return res.status(403).json({ msg: 'Solo administradores pueden eliminar usuarios' });
        }

        // No permitir eliminar al propio usuario
        if (req.user.id === id) {
            return res.status(400).json({ msg: 'No puedes eliminar tu propio usuario' });
        }

        const usuario = await User.findByIdAndDelete(id);

        if (!usuario) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        res.json({ msg: 'Usuario eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al eliminar usuario', error });
    }
};
