import express from "express";
import multer from "multer";
import { auth, requireRole } from "../middlewares/auth.js";
import {
  crearProducto,
  listarProductos,
  obtenerProducto,
  actualizarProducto,
  eliminarProducto,
  generarCodigoBarrasProducto,
  generarCodigosBarrasMasivoProducto,
  generarImagenCodigoBarrasProducto,
  generarImagenQRProducto,
} from "../controllers/producto.controller.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// ⚠️ RUTAS PÚBLICAS (sin autenticación)
// Estas permiten mostrar imágenes QR o de código de barras directamente
router.get("/imagen-barcode/:barcode", generarImagenCodigoBarrasProducto);
router.get("/imagen-qr/:qrCode", generarImagenQRProducto);

// ✅ A PARTIR DE AQUÍ, TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN Y ROL ADMIN
router.use(auth);
router.use(requireRole(['admin']));

// CRUD productos
router.post("/", upload.single("foto"), crearProducto);
router.get("/", listarProductos);
router.get("/:id", obtenerProducto);
router.put("/:id", upload.single("foto"), actualizarProducto);
router.delete("/:id", eliminarProducto);

// Rutas para códigos de barras
router.post("/generar-barcode/:id", generarCodigoBarrasProducto);

// Rutas masivas
router.post("/generar-barcode-masivo", generarCodigosBarrasMasivoProducto);

export default router;
