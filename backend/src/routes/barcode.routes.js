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
import { auth } from '../middlewares/auth.js';

const router = express.Router();

// 🚫 No proteger estas dos rutas para que el navegador pueda acceder sin token
router.get('/imagen/:barcode', generarImagenCodigoBarras);
router.get('/imagen-qr/:qrCode', generarImagenQRCode);

// 🔒 Todas las demás sí requieren autenticación
router.use(auth);

// Generar código de barras para una herramienta específica
router.post('/generar/:id', generarCodigoBarras);
router.get('/buscar/:barcode', buscarPorCodigoBarras);
router.post('/generar-masivo', generarCodigosBarrasMasivo);
router.get('/verificar-duplicados', verificarDuplicados);

// Rutas para códigos QR
router.post('/generar-qr/:id', generarQRCode);
router.get('/buscar-qr/:qrCode', buscarPorQRCode);
router.post('/generar-qr-masivo', generarQRCodesMasivo);

export default router;
