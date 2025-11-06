import express from "express";
import { createCliente, getClientes, updateCliente, deleteCliente, consultarRUC, consultarDNI } from "../controllers/cliente.controller.js";
import { auth, requireRole } from "../middlewares/auth.js";

const router = express.Router();

// Todas las rutas requieren autenticación y rol admin
router.use(auth);
router.use(requireRole(['admin']));

// Crear cliente
router.post("/", createCliente);

// Obtener todos los clientes
router.get("/", getClientes);

// Actualizar cliente
router.put("/:id", updateCliente);

// Eliminar cliente
router.delete("/:id", deleteCliente);

// Consultar RUC en SUNAT
router.get("/consultar-ruc/:ruc", consultarRUC);

// Consultar DNI en RENIEC
router.get("/consultar-dni/:dni", consultarDNI);

export default router;
