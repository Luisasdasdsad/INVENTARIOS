import express from "express";
import { createCotizacion, getCotizaciones, getCotizacionById, updateCotizacion, deleteCotizacion } from "../controllers/cotizacion.controller.js";

const router = express.Router();

// Crear cotización
router.post("/", createCotizacion);

// Obtener todas las cotizaciones
router.get("/", getCotizaciones);

// Obtener cotización por ID
router.get("/:id", getCotizacionById);

// Actualizar cotización
router.put("/:id", updateCotizacion);

// Eliminar cotización
router.delete("/:id", deleteCotizacion);

export default router;
