import { body } from 'express-validator';

export const movimientoCreateValidator = [
  // Herramienta ID: OPCIONAL (usa barcode en su lugar)
  body('herramienta')
    .optional({ nullable: true }) // CAMBIO CLAVE: Permite ausente si usas barcode
    .isString()
    .isMongoId()
    .withMessage('ID de herramienta debe ser un ObjectId válido de MongoDB (ej. 66a1b2c3d4e5f67890abcdef0)'),

  // Barcode: OPCIONAL (alternativa a herramienta)
  body('barcode')
    .optional({ nullable: true })
    .isString()
    .trim()
    .custom((value) => {
         // NUEVO: Si es vacío (después de trim), pasa la validación
         if (!value || value.trim() === '') {
           return true;
         }
         // Si no vacío, valida longitud y formato
         return value.length === 8 && /^[A-Fa-f0-9]{8}$/i.test(value);
    })
    .withMessage('Código de barras debe ser exactamente 8 caracteres hexadecimales (A-F, 0-9), ej. E317FD89'),

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

  // Cantidad: Requerido, permite string pero valida parseo a int
  body('cantidad')
    .notEmpty()
    .withMessage('Cantidad es requerida')
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
    .withMessage('Cantidad debe ser un número entero positivo (ej. 1, 12) - acepta string o number'),

  // Nombre de usuario: Requerido 
  body('nombreUsuario')
    .notEmpty()
    .withMessage('Nombre de usuario es requerido')
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Nombre de usuario debe tener al menos 1 carácter (ej. Luis)'),

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
         // NUEVO: Si es vacío (después de trim), pasa la validación
         if (!value || value.trim() === '') {
           return true;
         }
         // Si no vacío, valida si es URL válida (acepta http/https o rutas locales como /uploads)
         const urlRegex = /^(https?:\/\/|\/uploads\/)/i;
         return urlRegex.test(value);
    })
    .withMessage('Foto debe ser una URL válida')
];
