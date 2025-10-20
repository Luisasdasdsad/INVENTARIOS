import express from "express";
import Cliente from "../models/cliente.model.js";

const router = express.Router();

// Crear cliente
router.post("/", async (req, res) => {
  try {
    const nuevoCliente = new Cliente(req.body);
    await nuevoCliente.save();
    res.status(201).json({ msg: "Cliente creado correctamente", cliente: nuevoCliente });
  } catch (error) {
    res.status(400).json({ msg: "Error al crear cliente", error: error.message });
  }
});

// Obtener todos los clientes (opcional)
router.get("/", async (req, res) => {
  try {
    const clientes = await Cliente.find();
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener clientes", error: error.message });
  }
});

export default router;
