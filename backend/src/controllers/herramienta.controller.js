import Herramienta from "../models/herramienta.model.js";

// Crear herramienta
export const crearHerramienta = async (req, res) => {
  try {
    const nuevaHerramienta = new Herramienta(req.body);
    const guardada = await nuevaHerramienta.save();
    res.status(201).json(guardada);
  } catch (error) {
    // Captura errores de validación de Mongoose o duplicados
    res.status(400).json({ error: error.message });
  }
};

// Listar herramientas
export const listarHerramientas = async (req, res) => {
  try {
    const herramientas = await Herramienta.find();
    res.json(herramientas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Actualizar herramienta
export const actualizarHerramientas = async (req, res) => {
  try {
    const {id} =req.params;
    const actualizada = await Herramienta.findByIdAndUpdate(id,req.body, {
      new:true,
      runValidators:true // Asegura que las validaciones del esquema se ejecuten
    });
    if(!actualizada){
      return res.status(404).json({message:"Herramienta no encontrada"});
    }
    res.json(actualizada);
  } catch (error) {
    // Captura errores de validación de Mongoose
    res.status(400).json({error:error.message});
  }
};

//Eliminar herramienta
export const eliminarHerramienta = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminada = await Herramienta.findByIdAndDelete(id);
    if (!eliminada) return res.status(404).json({ error: "Herramienta no encontrada" });
    res.json({ mensaje: "Herramienta eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener herramienta por id
export const obtenerHerramienta = async (req, res) => {
  try {
    const herramienta = await Herramienta.findById(req.params.id);
    if (!herramienta) return res.status(404).json({ msg: 'Herramienta no encontrada' });
    res.json(herramienta);
  } catch (error) {
    res.status(500).json({ msg: 'Error en servidor', error });
  }
};