import Proveedor from "../models/proveedor.model.js";

// --- Crear un nuevo proveedor ---
export const createProveedor = async (req, res) => {
  const { ruc, email, ...rest } = req.body;
  const dataToSave = { ...rest };

  // Solo añadimos ruc y email si tienen un valor real (no son null, undefined o string vacío)
  if (ruc) dataToSave.ruc = ruc;
  if (email) dataToSave.email = email;

  try {
    const nuevoProveedor = new Proveedor(dataToSave);
    await nuevoProveedor.save();
    res.status(201).json(nuevoProveedor);
  } catch (error) {
    // Manejo de errores de validación y duplicados
    if (error.code === 11000) {
      // --- INICIO DE LA CORRECCIÓN ---
      const campoDuplicado = Object.keys(error.keyValue)[0];
      return res.status(400).json({ msg: `Error: El valor '${error.keyValue[campoDuplicado]}' para el campo '${campoDuplicado}' ya existe.` });
      // --- FIN DE LA CORRECCIÓN ---
    }
    // --- INICIO DE LA CORRECCIÓN ---
    // Si es un error de validación de Mongoose, extraemos el primer mensaje de error.
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ msg: messages[0] }); // Enviamos el primer error de validación encontrado
    }
    res.status(400).json({ msg: "Error al crear el proveedor.", error: error.message }); // Error genérico
  }
};

// --- Obtener todos los proveedores ---
export const getProveedores = async (req, res) => {
  const { categoria } = req.query; // Capturamos el parámetro de la URL

  try {
    const filtro = {};
    if (categoria) {
      filtro.categoria = categoria; // Si se proporciona una categoría, la añadimos al filtro
    }

    // Ordenamos por nombre para que la lista sea más fácil de leer
    const proveedores = await Proveedor.find(filtro).sort({ nombre: 1 });
    res.json(proveedores);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener los proveedores.", error: error.message });
  }
};

// --- Actualizar un proveedor por ID ---
export const updateProveedor = async (req, res) => {
  const { ruc, email, ...rest } = req.body;
  const dataToUpdate = { ...rest };

  // Para actualizar, si el campo viene vacío, lo seteamos explícitamente a null para borrarlo.
  // Si tiene valor, lo usamos.
  dataToUpdate.ruc = ruc || null;
  dataToUpdate.email = email || null;

  try {
    const proveedorActualizado = await Proveedor.findByIdAndUpdate(req.params.id, dataToUpdate, { new: true, runValidators: true });
    if (!proveedorActualizado) {
      return res.status(404).json({ msg: "Proveedor no encontrado." });
    }
    res.json(proveedorActualizado);
  } catch (error) {
    if (error.code === 11000) {
      const campoDuplicado = Object.keys(error.keyValue)[0];
      return res.status(400).json({ msg: `Error: El valor '${error.keyValue[campoDuplicado]}' para el campo '${campoDuplicado}' ya existe.` });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ msg: messages[0] });
    }
    res.status(400).json({ msg: "Error al actualizar el proveedor.", error: error.message });
  }
};

// --- Eliminar un proveedor por ID ---
export const deleteProveedor = async (req, res) => {
  try {
    const proveedorEliminado = await Proveedor.findByIdAndDelete(req.params.id);
    if (!proveedorEliminado) {
      return res.status(404).json({ msg: "Proveedor no encontrado." });
    }
    // Podrías agregar una lógica aquí para verificar si el proveedor está siendo usado en alguna compra antes de eliminar.
    res.json({ msg: "Proveedor eliminado correctamente." });
  } catch (error) {
    res.status(500).json({ msg: "Error al eliminar el proveedor.", error: error.message });
  }
};