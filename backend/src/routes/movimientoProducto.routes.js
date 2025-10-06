import express from 'express';
import {registrarMovimientoProducto, listarMovimientosProducto } from '../controllers/movimientoProducto.controller.js';
import { body } from 'express-validator'; // Si usas express-validator

const router = express.Router();

// Validadores para movimientos de productos (similar a los de herramientas)
const movimientoProductoCreateValidator = [
  body('productoId')
    .optional({ nullable: true })
    .isMongoId()
    .withMessage('ID de producto debe ser un ObjectId válido.'),
  body('barcode')
    .optional({ nullable: true })
    .isString().trim().isLength({ min: 8, max: 8 }).matches(/^[A-Fa-f0-9]{8}$/i)
    .withMessage('Código de barras debe ser 8 caracteres hexadecimales.'),
  body('tipo')
    .notEmpty().withMessage('Tipo es requerido.')
    .isIn(['entrada', 'salida', 'ajuste']).withMessage('Tipo debe ser "entrada", "salida" o "ajuste".'),
  body('cantidad')
    .notEmpty().withMessage('Cantidad es requerida.')
    .isInt({ min: 1 }).withMessage('Cantidad debe ser un número entero positivo.'),
  body('nombreUsuario')
    .notEmpty().withMessage('Nombre de usuario es requerido.')
    .isString().trim().isLength({ min: 1 }).withMessage('Nombre de usuario debe tener al menos 1 carácter.'),
  body('nota').optional().isString().trim().isLength({ max: 500 }).withMessage('Nota no puede exceder 500 caracteres.'),
  body('referencia').optional().isString().trim().isLength({ max: 100 }).withMessage('Referencia no puede exceder 100 caracteres.'),
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