import Cliente from "../models/cliente.model.js";
import axios from "axios";

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

export const consultarRUC = async (req, res) => {
  try {
    const { ruc } = req.params;

    // Validar que el RUC tenga 11 dígitos
    if (!/^\d{11}$/.test(ruc)) {
      return res.status(400).json({ msg: "RUC inválido. Debe tener 11 dígitos." });
    }

    // Consultar API de SUNAT (usando apis.net.pe como ejemplo)
    const response = await axios.get(`https://api.apis.net.pe/v1/ruc?numero=${ruc}`, {
      headers: {
        'Accept': 'application/json',
      }
    });

    const data = response.data;

    // Verificar si la consulta fue exitosa
    if (!data || !data.nombre) {
      return res.status(404).json({ msg: "RUC no encontrado o inactivo." });
    }

    // Mapear respuesta a formato del cliente
    const clienteData = {
      nombre: data.nombre,
      nombreComercial: data.nombre,
      direccion: data.direccion || "",
      ubigeo: data.ubigeo || "",
      estado: data.estado || "",
      condicion: data.condicion || ""
    };

    res.json(clienteData);
  } catch (error) {
    console.error("Error al consultar RUC:", error);

    if (error.response) {
      // Error de la API externa
      return res.status(error.response.status).json({
        msg: "Error al consultar SUNAT",
        error: error.response.data?.message || "Error desconocido"
      });
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      // Error de conexión
      return res.status(503).json({ msg: "Servicio de consulta SUNAT no disponible" });
    } else {
      // Error interno
      res.status(500).json({ msg: "Error interno del servidor", error: error.message });
    }
  }
};

export const consultarDNI = async (req, res) => {
  try {
    const { dni } = req.params;

    // Validar que el DNI tenga 8 dígitos
    if (!/^\d{8}$/.test(dni)) {
      return res.status(400).json({ msg: "DNI inválido. Debe tener 8 dígitos." });
    }

    // Consultar API de RENIEC (usando apis.net.pe como ejemplo)
    const response = await axios.get(`https://api.apis.net.pe/v1/dni?numero=${dni}`, {
      headers: {
        'Accept': 'application/json',
      }
    });

    const data = response.data;

    // Verificar si la consulta fue exitosa
    if (!data || !data.nombre) {
      return res.status(404).json({ msg: "DNI no encontrado." });
    }

    // Mapear respuesta a formato del cliente
    const clienteData = {
      nombre: data.nombre,
      nombreApellido: data.nombre,
      // Otros campos pueden estar vacíos para DNI
    };

    res.json(clienteData);
  } catch (error) {
    console.error("Error al consultar DNI:", error);

    if (error.response) {
      // Error de la API externa
      return res.status(error.response.status).json({
        msg: "Error al consultar RENIEC",
        error: error.response.data?.message || "Error desconocido"
      });
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      // Error de conexión
      return res.status(503).json({ msg: "Servicio de consulta RENIEC no disponible" });
    } else {
      // Error interno
      res.status(500).json({ msg: "Error interno del servidor", error: error.message });
    }
  }
};
