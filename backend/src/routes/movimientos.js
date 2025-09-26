import express from 'express';
import { movimientoCreateValidator } from '../validators/movimientoValidator.js';
import { registrarMovimiento, listarMovimientos, generarReportePDF } from '../controllers/movimiento.controller.js';
import { validationResult } from 'express-validator';

const router = express.Router();

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
router.get('/pdf', generarReportePDF);

export default router;