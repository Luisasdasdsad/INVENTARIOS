import express from "express";
import { actualizarHerramientas, crearHerramienta, eliminarHerramienta, listarHerramientas, obtenerHerramienta } from "../controllers/herramienta.controller.js";

const router = express.Router();

router.post("/", crearHerramienta);
router.get("/", listarHerramientas);
router.put("/:id",actualizarHerramientas);
router.delete("/:id",eliminarHerramienta);
router.get('/:id', obtenerHerramienta);

export default router;
