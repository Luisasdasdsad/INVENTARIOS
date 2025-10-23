import express from "express";
import { createCliente, getClientes, updateCliente, deleteCliente } from "../controllers/cliente.controller.js";

const router = express.Router();

// Crear cliente
router.post("/", createCliente);

// Obtener todos los clientes
router.get("/", getClientes);

// Actualizar cliente
router.put("/:id", updateCliente);

// Eliminar cliente
router.delete("/:id", deleteCliente);

export default router;
