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
        // CAMBIO: En lugar de marcar como leída, la eliminamos para no almacenar historial
        await Notificacion.findByIdAndDelete(id);
        res.json({ msg: 'Notificación eliminada (leída)' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al eliminar notificación' });
    }
};

export const marcarTodasLeidas = async (req, res) => {
    try {
        // CAMBIO: Eliminar todas las notificaciones del usuario
        await Notificacion.deleteMany({ usuario: req.user.id });
        res.json({ msg: 'Todas las notificaciones eliminadas' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al eliminar notificaciones' });
    }
};