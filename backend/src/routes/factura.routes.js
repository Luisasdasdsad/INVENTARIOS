import express from "express";
import { auth } from "../middlewares/auth.js";
import {createFactura,getFacturas,getFacturaById, enviarFacturaSunat} from "../controllers/factura.controller.js";

const router = express.Router();

// Todas las rutas de facturas requieren autenticación
router.use(auth);

router.post("/", createFactura);
router.get("/", getFacturas);
router.get("/:id", getFacturaById);
router.post("/:id/enviar-sunat", enviarFacturaSunat); // <-- NUEVA RUTA

export default router;