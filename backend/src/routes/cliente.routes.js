import express from "express";
import Cliente from "../models/cliente.model.js";

const router = express.Router();

// Crear cliente
router.post("/", async (req, res) => {
  try {
    const nuevoCliente = new Cliente(req.body);
    await nuevoCliente.save();
    res.status(201).json(nuevoCliente);
  } catch (error) {
    res.status(400).json({ msg: "Error al crear cliente", error: error.message });
  }
});

// Obtener todos los clientes
router.get("/", async (req, res) => {
  try {
    const clientes = await Cliente.find();
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener clientes", error: error.message });
  }
});

// Actualizar cliente
router.put("/:id", async (req, res) => {
  try {
    const clienteActualizado = await Cliente.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!clienteActualizado) {
      return res.status(404).json({ msg: "Cliente no encontrado" });
    }
    res.json(clienteActualizado);
  } catch (error) {
    res.status(400).json({ msg: "Error al actualizar cliente", error: error.message });
  }
});

export default router;
