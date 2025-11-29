import express from "express";
import { crearOrdenTrabajo, listarOrdenesTrabajo, obtenerOrdenTrabajo, cambiarEstadoOT, crearDesdeCotizacion, asignarTecnico, eliminarOrdenTrabajo, actualizarOrdenTrabajo } from "../controllers/ordenTrabajo.controller.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(auth);

router.post("/", crearOrdenTrabajo);
router.post("/desde-cotizacion", crearDesdeCotizacion);
router.get("/", listarOrdenesTrabajo);
router.get("/:id", obtenerOrdenTrabajo);
router.put("/:id", actualizarOrdenTrabajo); // 👈 RUTA NUEVA
router.patch("/:id/estado", cambiarEstadoOT);
router.patch("/:id/tecnico", asignarTecnico);
router.delete("/:id", eliminarOrdenTrabajo);

export default router;
