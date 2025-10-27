import Cotizacion from "../models/cotización.model.js";

export const createCotizacion = async (req, res) => {
  try {
    // Verificar si el número de cotización ya existe
    const existingCotizacion = await Cotizacion.findOne({ numeroCotizacion: req.body.numeroCotizacion });
    if (existingCotizacion) {
      return res.status(400).json({ msg: "El número de cotización ya existe. Por favor, usa un número único." });
    }

    const nuevaCotizacion = new Cotizacion(req.body);
    await nuevaCotizacion.save();
    res.status(201).json(nuevaCotizacion);
  } catch (error) {
    res.status(400).json({ msg: "Error al crear cotización", error: error.message });
  }
};

export const getCotizaciones = async (req, res) => {
  try {
    const cotizaciones = await Cotizacion.find().populate('cliente');
    res.json(cotizaciones);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener cotizaciones", error: error.message });
  }
};

export const getCotizacionById = async (req, res) => {
  try {
    const cotizacion = await Cotizacion.findById(req.params.id).populate('cliente');
    if (!cotizacion) {
      return res.status(404).json({ msg: "Cotización no encontrada" });
    }
    res.json(cotizacion);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener cotización", error: error.message });
  }
};

export const updateCotizacion = async (req, res) => {
  try {
    // Verificar si el número de cotización ya existe en otra cotización (excluyendo la actual)
    const existingCotizacion = await Cotizacion.findOne({
      numeroCotizacion: req.body.numeroCotizacion,
      _id: { $ne: req.params.id }
    });
    if (existingCotizacion) {
      return res.status(400).json({ msg: "El número de cotización ya existe. Por favor, usa un número único." });
    }

    const cotizacionActualizada = await Cotizacion.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cotizacionActualizada) {
      return res.status(404).json({ msg: "Cotización no encontrada" });
    }
    res.json(cotizacionActualizada);
  } catch (error) {
    res.status(400).json({ msg: "Error al actualizar cotización", error: error.message });
  }
};

export const deleteCotizacion = async (req, res) => {
  try {
    const cotizacionEliminada = await Cotizacion.findByIdAndDelete(req.params.id);
    if (!cotizacionEliminada) {
      return res.status(404).json({ msg: "Cotización no encontrada" });
    }
    res.json({ msg: "Cotización eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ msg: "Error al eliminar cotización", error: error.message });
  }
};
