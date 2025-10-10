import express from 'express';
import {
  generarCodigoBarras,
  generarImagenCodigoBarras,
  buscarPorCodigoBarras,
  generarCodigosBarrasMasivo,
  verificarDuplicados,
  generarImagenQRCode,
  generarQRCode,
  buscarPorQRCode,
  generarQRCodesMasivo
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

// Rutas para códigos QR
router.post('/generar-qr/:id', generarQRCode);
router.get('/imagen-qr/:qrCode', generarImagenQRCode);
router.get('/buscar-qr/:qrCode', buscarPorQRCode);
router.post('/generar-qr-masivo', generarQRCodesMasivo);

export default router;
