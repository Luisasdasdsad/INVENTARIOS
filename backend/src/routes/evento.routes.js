import express from 'express';
import { getEventos, crearEvento, actualizarEvento, eliminarEvento, getUsuariosAgenda } from '../controllers/evento.controller.js';
import { auth } from '../middlewares/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(auth);

router.get('/usuarios', getUsuariosAgenda); // Nueva ruta para cargar el equipo en la agenda
router.get('/', getEventos);
router.post('/', crearEvento);
router.put('/:id', actualizarEvento);
router.delete('/:id', eliminarEvento);

export default router;
