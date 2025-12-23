import Evento from '../models/evento.model.js';

// Obtener todos los eventos
export const getEventos = async (req, res) => {
    try {
        const eventos = await Evento.find({}).populate('user', 'nombre');
        res.json(eventos);
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener eventos', error: error.message });
    }
};

// Crear un nuevo evento
export const crearEvento = async (req, res) => {
    try {
        const { title, start, end, allDay, description, color } = req.body;
        const nuevoEvento = new Evento({
            title,
            start,
            end,
            allDay,
            description,
            color,
            user: req.user.id // El usuario logueado crea el evento
        });
        await nuevoEvento.save();
        const eventoPoblado = await Evento.findById(nuevoEvento._id).populate('user', 'nombre');
        res.status(201).json(eventoPoblado);
    } catch (error) {
        res.status(500).json({ msg: 'Error al crear evento', error: error.message });
    }
};

// Actualizar un evento
export const actualizarEvento = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, start, end, allDay, description, color } = req.body;

        const evento = await Evento.findById(id);
        if (!evento) return res.status(404).json({ msg: 'Evento no encontrado' });

        // Solo el creador o un admin pueden editar
        if (evento.user.toString() !== req.user.id && req.user.rol !== 'admin' && req.user.rol !== 'superadmin') {
            return res.status(403).json({ msg: 'No tienes permiso para editar este evento' });
        }

        const eventoActualizado = await Evento.findByIdAndUpdate(id, 
            { title, start, end, allDay, description, color }, 
            { new: true }
        ).populate('user', 'nombre');

        res.json(eventoActualizado);
    } catch (error) {
        res.status(500).json({ msg: 'Error al actualizar evento', error: error.message });
    }
};

// Eliminar un evento
export const eliminarEvento = async (req, res) => {
    try {
        const { id } = req.params;
        const evento = await Evento.findById(id);
        if (!evento) return res.status(404).json({ msg: 'Evento no encontrado' });

        // Solo el creador o un admin pueden eliminar
        if (evento.user.toString() !== req.user.id && req.user.rol !== 'admin' && req.user.rol !== 'superadmin') {
            return res.status(403).json({ msg: 'No tienes permiso para eliminar este evento' });
        }

        await Evento.findByIdAndDelete(id);
        res.json({ msg: 'Evento eliminado' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al eliminar evento', error: error.message });
    }
};
