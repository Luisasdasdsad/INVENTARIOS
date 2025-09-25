import { body } from 'express-validator';

export const movimientoCreateValidator = [
  body('herramienta').isMongoId().withMessage('ID de herramienta inválido'),
  body('tipo').isIn(['entrada', 'salida']).withMessage('Tipo debe ser entrada o salida'),
  body('cantidad').isInt({ min: 1 }).withMessage('Cantidad debe ser al menos 1'),
];