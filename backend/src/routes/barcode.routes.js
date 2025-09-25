import express from 'express';
import {
  generarCodigoBarras,
  generarImagenCodigoBarras,
  buscarPorCodigoBarras,
  generarCodigosBarrasMasivo,
  verificarDuplicados
} from '../controllers/barcode.controller.js';

const router = express.Router();

// Generar código de barras para una herramienta específica
router.post('/generar/:id', generarCodigoBarras);

// Generar imagen del código de barras
router.get('/imagen/:barcode', generarImagenCodigoBarras);

// Buscar herramienta por código de barras
router.get('/buscar/:barcode', buscarPorCodigoBarras);

// Generar códigos de barras masivamente
router.post('/generar-masivo', generarCodigosBarrasMasivo);

// Verificar duplicados
router.get('/verificar-duplicados', verificarDuplicados);

export default router;
