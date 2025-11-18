import express from "express";
import { crearOrdenTrabajo, listarOrdenesTrabajo, cambiarEstadoOT } from "../controllers/ordenTrabajo.controller.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(auth);

router.post("/", crearOrdenTrabajo);
router.get("/", listarOrdenesTrabajo);
router.patch("/:id/estado", cambiarEstadoOT);

export default router;
