import Cotizacion from "../models/cotización.model.js";

// 💡 FUNCIÓN INTERNA REUTILIZABLE para obtener el siguiente número de cotización
const getNextNumber = async (year) => {
  try {
    // Definir el rango de fechas para el año solicitado (o el actual por defecto)
    const currentYear = year || new Date().getFullYear();
    const startDate = new Date(`${currentYear}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${currentYear}-12-31T23:59:59.999Z`);

    const maxCotizacion = await Cotizacion.aggregate([
      // PASO 0: Filtrar solo las cotizaciones de ese año
      {
        $match: {
          fecha: { $gte: startDate, $lte: endDate }
        }
      },
      // PASO 1: Extraer la parte numérica. Soporta formatos "001" y "COT-2026-001"
      {
        $project: {
          // Dividimos por guión "-" y tomamos la última parte
          parts: { $split: ["$numeroCotizacion", "-"] }
        }
      },
      {
        $project: {
          // Convertimos la última parte a entero de forma segura
          numero: { 
            $convert: { 
              input: { $arrayElemAt: ["$parts", -1] }, 
              to: "int", 
              onError: 0, 
              onNull: 0 
            } 
          }
        }
      },
      // PASO 3: Agrupar para encontrar el máximo.
      {
        $group: { _id: null, maxNum: { $max: "$numero" } }
      }
    ]);
    const nextNum = maxCotizacion.length > 0 ? maxCotizacion[0].maxNum + 1 : 1;
    // 💡 RETORNO SEGURO: Agregamos prefijo del año (ej: COT-2026-001) para evitar duplicados
    return `COT-${currentYear}-${nextNum.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error("Error en getNextNumber:", error);
    // Fallback seguro en caso de error
    return `COT-${year || new Date().getFullYear()}-001`;
  }
};

// 🆕 Obtener el siguiente número de cotización (Endpoint)
export const getNextCotizacionNumber = async (req, res) => {
  try {
    // Recibir el año desde el frontend (req.query.year)
    const { year } = req.query;
    const numeroCotizacion = await getNextNumber(year);
    res.json({ numeroCotizacion });
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener el siguiente número de cotización", error: error.message });
  }
};

// Crear cotización (asigna automáticamente al usuario autenticado)
export const createCotizacion = async (req, res) => {
  try {
    // 💡 Extraer el año de la fecha de la cotización para generar el correlativo correcto
    const year = req.body.fecha ? new Date(req.body.fecha).getFullYear() : new Date().getFullYear();
    const numeroCotizacion = await getNextNumber(year);

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
      .populate('factura') // Popula la factura asociada
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
      .populate('factura') // Popula la factura asociada
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
      .populate('usuario', 'nombre email')
      .populate('factura'); // Popula la factura asociada
    
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

// ✅ NUEVO: Actualizar solo el estado de una cotización
export const updateEstadoCotizacion = async (req, res) => {
  try {
    const { estado } = req.body;
    const { id } = req.params;

    // Validar que el estado enviado es uno de los permitidos en el modelo
    const estadosValidos = Cotizacion.schema.path('estado').enumValues;
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ msg: `Estado no válido. Los estados permitidos son: ${estadosValidos.join(', ')}` });
    }

    const cotizacion = await Cotizacion.findById(id);
    if (!cotizacion) {
      return res.status(404).json({ msg: "Cotización no encontrada" });
    }

    // Verificar permisos: solo el dueño o admin pueden cambiar el estado
    if (req.user.rol !== 'admin' && cotizacion.usuario.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: "No tienes permiso para modificar esta cotización" });
    }

    // Actualizar y devolver el documento actualizado
    cotizacion.estado = estado;
    await cotizacion.save();

    // ✅ SOLUCIÓN: Volver a popular los datos antes de enviar la respuesta
    const cotizacionActualizada = await Cotizacion.findById(id)
      .populate('cliente').populate('usuario', 'nombre email');

    res.json(cotizacionActualizada);
  } catch (error) {
    res.status(500).json({ msg: "Error al actualizar el estado de la cotización", error: error.message });
  }
};