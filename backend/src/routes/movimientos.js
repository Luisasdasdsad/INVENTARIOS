import express from 'express';
import { movimientoCreateValidator } from '../validators/movimientoValidator.js';
import { registrarMovimiento, listarMovimientos } from '../controllers/movimiento.controller.js';
import { validationResult } from 'express-validator';
import { auth } from '../middlewares/auth.js';

const router = express.Router();

router.use(auth);

router.get('/', listarMovimientos);
router.post(
  '/',
  movimientoCreateValidator,
  (req, res, next) => {
    // Validación de errores centralizada
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
  registrarMovimiento
);

export default router;