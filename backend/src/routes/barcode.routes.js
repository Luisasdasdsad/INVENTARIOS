import express from 'express';
import {
  generarCodigoBarras,
  generarImagenCodigoBarras,
  buscarPorCodigoBarras,
  generarCodigosBarrasMasivo,
  verificarDuplicados
} from '../controllers/barcode.controller.js';
import { auth } from '../middlewares/auth.js';

const router = express.Router();

// ⚠️ RUTAS PÚBLICAS (sin autenticación)
// Estas no requieren token porque son usadas por <img src="...">
router.get('/imagen/:barcode', generarImagenCodigoBarras);

// ✅ A PARTIR DE AQUÍ, TODAS LAS RUTAS REQUIEREN TOKEN
router.use(auth);

// Generar código de barras para una herramienta específica
router.post('/generar/:id', generarCodigoBarras);

// Buscar herramienta por código de barras
router.get('/buscar/:barcode', buscarPorCodigoBarras);

// Generar códigos de barras masivamente
router.post('/generar-masivo', generarCodigosBarrasMasivo);

// Verificar duplicados
router.get('/verificar-duplicados', verificarDuplicados);



export default router;
