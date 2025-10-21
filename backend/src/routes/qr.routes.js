import express from 'express';
import {
  generarQRHerramienta,
  generarQRProducto,
  buscarPorQR,
  generarQRMasivoHerramientas,
  generarQRMasivoProductos,
  generarImagenQR
} from '../controllers/qr.controller.js';
import { auth } from '../middlewares/auth.js';

const router = express.Router();

// ⚠️ RUTAS PÚBLICAS (sin autenticación)
// Estas no requieren token porque son usadas por <img src="...">
router.get('/imagen/:qrCode', generarImagenQR);

// ✅ A PARTIR DE AQUÍ, TODAS LAS RUTAS REQUIEREN TOKEN
router.use(auth);

// Generar QR para herramienta específica
router.post('/herramienta/:id', generarQRHerramienta);

// Generar QR para producto específico
router.post('/producto/:id', generarQRProducto);

// Buscar item por QR (herramienta o producto)
router.get('/buscar/:qrCode', buscarPorQR);

// Generar QR masivo para herramientas
router.post('/masivo/herramientas', generarQRMasivoHerramientas);

// Generar QR masivo para productos
router.post('/masivo/productos', generarQRMasivoProductos);

export default router;
