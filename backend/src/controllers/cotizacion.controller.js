import Cotizacion from "../models/cotización.model.js";

// 💡 FUNCIÓN INTERNA REUTILIZABLE para obtener el siguiente número de cotización
const getNextNumber = async () => {
  try {
    const maxCotizacion = await Cotizacion.aggregate([
      // PASO 1: Intentar convertir 'numeroCotizacion' a número. Si falla, se vuelve null.
      {
        $project: {
          numero: { $toInt: "$numeroCotizacion" }
        }
      },
      // PASO 2: Filtrar solo los que se pudieron convertir (no son null).
      {
        $match: { numero: { $ne: null } }
      },
      // PASO 3: Agrupar para encontrar el máximo.
      {
        $group: { _id: null, maxNum: { $max: "$numero" } }
      }
    ]);
    const nextNum = maxCotizacion.length > 0 ? maxCotizacion[0].maxNum + 1 : 1;
    return nextNum.toString().padStart(4, '0');
  } catch (error) {
    console.error("Error en getNextNumber:", error);
    // Si la agregación falla por alguna razón, recurrimos a un método más simple
    const lastCotizacion = await Cotizacion.findOne().sort({ numeroCotizacion: -1 });
    const nextNum = lastCotizacion && !isNaN(lastCotizacion.numeroCotizacion) ? parseInt(lastCotizacion.numeroCotizacion) + 1 : 1;
    return nextNum.toString().padStart(4, '0');
  }
};

// 🆕 Obtener el siguiente número de cotización (Endpoint)
export const getNextCotizacionNumber = async (req, res) => {
  try {
    const numeroCotizacion = await getNextNumber();
    res.json({ numeroCotizacion });
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener el siguiente número de cotización", error: error.message });
  }
};

// Crear cotización (asigna automáticamente al usuario autenticado)
export const createCotizacion = async (req, res) => {
  try {
    // 💡 Usar la función interna para obtener el número de cotización
    const numeroCotizacion = await getNextNumber();

    // Asignar el número generado y el usuario responsable
    req.body.numeroCotizacion = numeroCotizacion;
    req.body.usuario = req.user._id; // Asociar con el usuario autenticado

    const nuevaCotizacion = new Cotizacion(req.body);
    await nuevaCotizacion.save();
    res.status(201).json(nuevaCotizacion);
  } catch (error) {
    res.status(400).json({ msg: "Error al crear cotización", error: error.message });
  }
};

// 🆕 Obtener solo MIS cotizaciones (las que yo creé)
export const getMisCotizaciones = async (req, res) => {
  try {
    const cotizaciones = await Cotizacion.find({ 
      usuario: req.user._id 
    })
      .populate('cliente')
      .populate('usuario', 'nombre email')
      .sort({ createdAt: -1 });
    
    res.json(cotizaciones);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener cotizaciones", error: error.message });
  }
};

// 🔄 Obtener TODAS las cotizaciones (historial completo)
export const getCotizaciones = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      fechaDesde, 
      fechaHasta,
      usuario 
    } = req.query;
    
    const filtros = {};
    
    // Si no es admin, solo puede ver sus propias cotizaciones en el historial
    if (req.user.rol !== 'admin') {
      filtros.usuario = req.user._id;
    } else if (usuario) {
      // Si es admin y especifica un usuario, filtrar por ese usuario
      filtros.usuario = usuario;
    }
    
    if (fechaDesde || fechaHasta) {
      filtros.createdAt = {};
      if (fechaDesde) filtros.createdAt.$gte = new Date(fechaDesde);
      if (fechaHasta) filtros.createdAt.$lte = new Date(fechaHasta);
    }
    
    const cotizaciones = await Cotizacion.find(filtros)
      .populate('cliente')
      .populate('usuario', 'nombre email rol')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Cotizacion.countDocuments(filtros);
    
    res.json({
      cotizaciones,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener cotizaciones", error: error.message });
  }
};

export const getCotizacionById = async (req, res) => {
  try {
    const cotizacion = await Cotizacion.findById(req.params.id)
      .populate('cliente')
      .populate('usuario', 'nombre email');
    
    if (!cotizacion) {
      return res.status(404).json({ msg: "Cotización no encontrada" });
    }

    // Verificar permisos: solo el dueño, admin o responsable_inventario pueden ver
    if (req.user.rol !== 'admin' && req.user.rol !== 'responsable_inventario' && cotizacion.usuario._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: "No tienes permiso para ver esta cotización" });
    }

    res.json(cotizacion);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener cotización", error: error.message });
  }
};

export const updateCotizacion = async (req, res) => {
  try {
    // Buscar la cotización primero
    const cotizacion = await Cotizacion.findById(req.params.id);
    
    if (!cotizacion) {
      return res.status(404).json({ msg: "Cotización no encontrada" });
    }

    // Verificar permisos: solo el dueño o admin pueden editar
    if (req.user.rol !== 'admin' && cotizacion.usuario.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: "No tienes permiso para editar esta cotización" });
    }

    // Verificar si el número de cotización ya existe en otra cotización
    if (req.body.numeroCotizacion && req.body.numeroCotizacion !== cotizacion.numeroCotizacion) {
      const existingCotizacion = await Cotizacion.findOne({
        numeroCotizacion: req.body.numeroCotizacion,
        _id: { $ne: req.params.id }
      });
      if (existingCotizacion) {
        return res.status(400).json({ msg: "El número de cotización ya existe. Por favor, usa un número único." });
      }
    }

    const cotizacionActualizada = await Cotizacion.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    )
      .populate('cliente')
      .populate('usuario', 'nombre email');
    
    res.json(cotizacionActualizada);
  } catch (error) {
    res.status(400).json({ msg: "Error al actualizar cotización", error: error.message });
  }
};

export const deleteCotizacion = async (req, res) => {
  try {
    const cotizacion = await Cotizacion.findById(req.params.id);
    
    if (!cotizacion) {
      return res.status(404).json({ msg: "Cotización no encontrada" });
    }

    // Verificar permisos: solo el dueño, admin o responsable_inventario pueden eliminar
    if (req.user.rol !== 'admin' && req.user.rol !== 'responsable_inventario' && cotizacion.usuario.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: "No tienes permiso para eliminar esta cotización" });
    }

    await Cotizacion.findByIdAndDelete(req.params.id);
    res.json({ msg: "Cotización eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ msg: "Error al eliminar cotización", error: error.message });
  }
};