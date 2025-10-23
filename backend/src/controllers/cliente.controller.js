import Cliente from "../models/cliente.model.js";

export const createCliente = async (req, res) => {
  try {
    const nuevoCliente = new Cliente(req.body);
    await nuevoCliente.save();
    res.status(201).json(nuevoCliente);
  } catch (error) {
    res.status(400).json({ msg: "Error al crear cliente", error: error.message });
  }
};

export const getClientes = async (req, res) => {
  try {
    const clientes = await Cliente.find();
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener clientes", error: error.message });
  }
};

export const updateCliente = async (req, res) => {
  try {
    const clienteActualizado = await Cliente.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!clienteActualizado) {
      return res.status(404).json({ msg: "Cliente no encontrado" });
    }
    res.json(clienteActualizado);
  } catch (error) {
    res.status(400).json({ msg: "Error al actualizar cliente", error: error.message });
  }
};

export const deleteCliente = async (req, res) => {
  try {
    const clienteEliminado = await Cliente.findByIdAndDelete(req.params.id);
    if (!clienteEliminado) {
      return res.status(404).json({ msg: "Cliente no encontrado" });
    }
    res.json({ msg: "Cliente eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ msg: "Error al eliminar cliente", error: error.message });
  }
};
