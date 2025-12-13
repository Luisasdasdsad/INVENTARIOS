import express from 'express';
import { getMisNotificaciones, marcarComoLeida, marcarTodasLeidas } from '../controllers/notificacion.controller.js';
import { auth } from '../middlewares/auth.js';

const router = express.Router();

router.use(auth);

router.get('/', getMisNotificaciones);
router.put('/:id/leer', marcarComoLeida);
router.put('/leer-todas', marcarTodasLeidas);

export default router;