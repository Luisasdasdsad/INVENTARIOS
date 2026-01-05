import express from "express";
import {
  createProveedor,
  getProveedores,
  updateProveedor,
  deleteProveedor,
} from "../controllers/proveedor.controller.js";
import { auth, requireRole } from "../middlewares/auth.js";

const router = express.Router();

// Todas las rutas de proveedores requieren autenticación
router.use(auth);

// Solo los administradores pueden gestionar proveedores
router.use(requireRole(['admin', 'superadmin', 'administracion']));

router.post("/", createProveedor);
router.get("/", getProveedores);
router.put("/:id", updateProveedor);
router.delete("/:id", deleteProveedor);

export default router;