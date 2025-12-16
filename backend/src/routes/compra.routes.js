import express from 'express';
import { auth } from '../middlewares/auth.js';
import { getCompras, crearRequerimiento, registrarCotizacion, evaluarCompra, registrarFacturaCompra, actualizarRequerimiento, eliminarCompra } from '../controllers/compra.controller.js';

const router = express.Router();

router.get("/", auth, getCompras);
router.post("/requerimiento", auth, crearRequerimiento);
router.put("/:id/cotizar", auth, registrarCotizacion);
router.put("/:id/evaluar", auth, evaluarCompra);
router.put("/:id/facturar", auth, registrarFacturaCompra);
router.put("/:id", auth, actualizarRequerimiento);
router.delete("/:id", auth, eliminarCompra);

export default router;
