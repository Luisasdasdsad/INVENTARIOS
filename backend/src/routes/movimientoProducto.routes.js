import express from 'express';
import {registrarMovimientoProducto, listarMovimientosProducto } from '../controllers/movimientoProducto.controller.js';
import { body, validationResult } from 'express-validator';
import { auth } from '../middlewares/auth.js';

const router = express.Router();

// Proteger rutas con autenticación
router.use(auth);

// Validadores para movimientos de productos (similar a los de herramientas)
const movimientoProductoCreateValidator = [
  body('productos')
    .isArray({ min: 1 })
    .withMessage('Debe proporcionar al menos un producto.'),
  body('tipo')
    .notEmpty().withMessage('Tipo es requerido.')
    .isIn(['entrada', 'salida', 'ajuste']).withMessage('Tipo debe ser "entrada", "salida" o "ajuste".'),
  body('nota').optional().isString().trim().isLength({ max: 500 }).withMessage('Nota no puede exceder 500 caracteres.'),
  // El frontend envía 'obra', que mapearemos a 'referencia' en el controlador
  body('obra').optional().isString().trim().isLength({ max: 100 }).withMessage('Obra no puede exceder 100 caracteres.'),
];

router.post(
  '/',
  movimientoProductoCreateValidator,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
  registrarMovimientoProducto
);
router.get('/', listarMovimientosProducto);
//router.get('/pdf', generarReportePDFMovimientosProducto);

export default router;