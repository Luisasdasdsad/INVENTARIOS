import express from "express";
import multer from "multer";
import { auth } from "../middlewares/auth.js";
import {
  crearProducto,
  listarProductos,
  obtenerProducto,
  actualizarProducto,
  eliminarProducto,
  generarCodigoBarrasProducto,
} from "../controllers/producto.controller.js";

const router = express.Router();
router.use(auth);

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/", upload.single("foto"), crearProducto);
router.get("/", listarProductos);
router.get("/:id", obtenerProducto);
router.put("/:id", upload.single("foto"), actualizarProducto);
router.delete("/:id", eliminarProducto);

// Ruta para generar código de barras
router.post("/generar-barcode/:id", generarCodigoBarrasProducto);

export default router;
