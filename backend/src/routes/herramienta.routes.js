import express from "express";
import { actualizarHerramientas, crearHerramienta, eliminarHerramienta, listarHerramientas, obtenerHerramienta } from "../controllers/herramienta.controller.js";
import { buscarPorCodigoBarras } from "../controllers/barcode.controller.js";

const router = express.Router();

router.post("/", crearHerramienta);
router.get("/", listarHerramientas);
router.put("/:id",actualizarHerramientas);
router.delete("/:id",eliminarHerramienta);
router.get('/:id', obtenerHerramienta);
router.get('/buscar-por-codigo-barras/:codigo', buscarPorCodigoBarras);

export default router;
