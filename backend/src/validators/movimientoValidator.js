import { body } from 'express-validator';

export const movimientoCreateValidator = [
  // Herramientas: Array requerido con al menos un elemento
  body('herramientas')
    .isArray({ min: 1 })
    .withMessage('Debe proporcionar al menos una herramienta'),

  // Validar cada elemento del array de herramientas
  body('herramientas.*.herramienta')
    .optional({ nullable: true }) // Opcional si hay barcode
    .isString()
    .isMongoId()
    .withMessage('ID de herramienta debe ser un ObjectId válido de MongoDB'),

  // Barcode por herramienta: Opcional (alternativa a herramienta)
  body('herramientas.*.barcode')
    .optional({ nullable: true })
    .isString()
    .trim()
    .custom((value) => {
         // Si es vacío, pasa
         if (!value || value.trim() === '') {
           return true;
         }
         // Si no vacío, valida longitud y formato
         return value.length === 8 && /^[A-Fa-f0-9]{8}$/i.test(value);
    })
    .withMessage('Código de barras debe ser exactamente 8 caracteres hexadecimales (A-F, 0-9), ej. E317FD89'),

  // QR Code por herramienta: Opcional (alternativa a herramienta o barcode)
  body('herramientas.*.qrCode')
    .optional({ nullable: true })
    .isString()
    .trim()
    .custom((value) => {
         // Si es vacío, pasa
         if (!value || value.trim() === '') {
           return true;
         }
         // Si no vacío, valida formato QR (QR- seguido de al menos 12 caracteres hex)
         return /^QR-[A-Fa-f0-9]{12,}$/i.test(value);
    })
    .withMessage('Código QR debe empezar con "QR-" seguido de al menos 12 caracteres hexadecimales (A-F, 0-9), ej. QR-E674899FFC83'),

  // Cantidad por herramienta: Requerida
  body('herramientas.*.cantidad')
    .notEmpty()
    .withMessage('Cantidad es requerida para cada herramienta')
    .custom((value) => {
      // Maneja string o number
      let num;
      if (typeof value === 'string') {
        num = parseInt(value, 10);
      } else if (typeof value === 'number') {
        num = value;
      } else {
        return false; // Ni string ni number
      }
      return !isNaN(num) && num >= 1;
    })
    .withMessage('Cantidad debe ser un número entero positivo'),

  // Validar que cada herramienta tenga al menos herramienta ID, barcode o qrCode
  body('herramientas.*')
    .custom((value) => {
      if (!value.herramienta && !value.barcode && !value.qrCode) {
        throw new Error('Cada herramienta debe tener ID, código de barras o código QR');
      }
      return true;
    }),

  // Tipo: Requerido, flexible con espacios y case
  body('tipo')
    .notEmpty()
    .withMessage('Tipo es requerido')
    .isString()
    .trim()
    .custom((value) => {
      const clean = value.toLowerCase();
      return ['entrada', 'salida'].includes(clean);
    })
    .withMessage('Tipo debe ser "entrada" o "salida" (insensible a mayúsculas)'),

  // Nota: Opcional
  body('nota')
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Nota no puede exceder 500 caracteres'),

  // Obra: Opcional
  body('obra')
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Obra no puede exceder 200 caracteres'),

  //Foto: Opcional
  body('foto')
    .optional({ nullable: true })
    .isString()
    .trim()
    .custom((value) => {
         // Si es vacío, pasa
         if (!value || value.trim() === '') {
           return true;
         }
         // Si no vacío, valida si es URL válida (acepta http/https o rutas locales como /uploads)
         const urlRegex = /^(https?:\/\/|\/uploads\/)/i;
         return urlRegex.test(value);
    })
    .withMessage('Foto debe ser una URL válida')
];
