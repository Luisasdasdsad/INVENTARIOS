import express from "express";
import { createCotizacion, getCotizaciones, getCotizacionById, updateCotizacion, deleteCotizacion } from "../controllers/cotizacion.controller.js";
import { auth, requireRole } from "../middlewares/auth.js";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(auth);

// Crear cotización (solo admin)
router.post("/", requireRole(['admin']), createCotizacion);

// Obtener todas las cotizaciones (admin y trabajador pueden ver)
router.get("/", getCotizaciones);

// Obtener cotización por ID (admin y trabajador pueden ver)
router.get("/:id", getCotizacionById);

// Actualizar cotización (solo admin)
router.put("/:id", requireRole(['admin']), updateCotizacion);

// Eliminar cotización (solo admin)
router.delete("/:id", requireRole(['admin']), deleteCotizacion);

export default router;
