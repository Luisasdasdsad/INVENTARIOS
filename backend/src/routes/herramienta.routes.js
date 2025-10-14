import express from "express";
import { actualizarHerramientas, crearHerramienta, eliminarHerramienta, listarHerramientas, obtenerHerramienta } from "../controllers/herramienta.controller.js";
import { buscarPorCodigoBarras } from "../controllers/barcode.controller.js";
import multer from "multer";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/", upload.single("foto"), crearHerramienta);
router.get("/", listarHerramientas);
router.put("/:id", upload.single("foto"), actualizarHerramientas);
router.delete("/:id",eliminarHerramienta);
router.get('/:id', obtenerHerramienta);
router.get('/buscar-por-codigo-barras/:codigo', buscarPorCodigoBarras);

export default router;
