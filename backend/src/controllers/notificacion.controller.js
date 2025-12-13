import Notificacion from '../models/notificacion.model.js';

export const getMisNotificaciones = async (req, res) => {
    try {
        const notificaciones = await Notificacion.find({ usuario: req.user.id })
            .sort({ createdAt: -1 })
            .limit(20);
        
        const noLeidas = await Notificacion.countDocuments({ usuario: req.user.id, leido: false });

        res.json({ notificaciones, noLeidas });
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener notificaciones' });
    }
};

export const marcarComoLeida = async (req, res) => {
    try {
        const { id } = req.params;
        await Notificacion.findByIdAndUpdate(id, { leido: true });
        res.json({ msg: 'Notificación marcada como leída' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al actualizar notificación' });
    }
};

export const marcarTodasLeidas = async (req, res) => {
    try {
        await Notificacion.updateMany({ usuario: req.user.id, leido: false }, { leido: true });
        res.json({ msg: 'Todas marcadas como leídas' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al actualizar notificaciones' });
    }
};