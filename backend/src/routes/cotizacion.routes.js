import express from "express";
import { 
  createCotizacion, 
  getCotizaciones, 
  getMisCotizaciones, 
  getCotizacionById, 
  updateCotizacion, 
  deleteCotizacion,
  getNextCotizacionNumber 
} from "../controllers/cotizacion.controller.js";
import { auth, requireRole } from "../middlewares/auth.js";

const router = express.Router();

// 💡 RUTA PÚBLICA: Obtener el siguiente número de cotización. No requiere token.
router.get("/next-number", getNextCotizacionNumber);

// Todas las rutas requieren autenticación
router.use(auth);

// 🆕 Obtener MIS cotizaciones (las que yo creé) - todos pueden
router.get("/mis-cotizaciones", getMisCotizaciones);

// Obtener TODAS las cotizaciones (historial) - todos pueden ver, pero trabajadores solo ven las suyas
router.get("/historial", getCotizaciones);

// Crear cotización - todos los usuarios autenticados pueden crear
router.post("/", createCotizacion);

// Obtener cotización por ID - verifica permisos en el controlador
router.get("/:id", getCotizacionById);

// Actualizar cotización - verifica permisos en el controlador
router.put("/:id", updateCotizacion);

// Eliminar cotización - verifica permisos en el controlador
router.delete("/:id", deleteCotizacion);

export default router;