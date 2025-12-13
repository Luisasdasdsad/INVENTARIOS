import MovimientoProducto from '../models/movimientoProducto.model.js';
import Producto from '../models/producto.model.js'; // Necesario para actualizar la cantidad del producto
import { validationResult } from 'express-validator'; // Si usas validación

export const registrarMovimientoProducto = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  // Recibimos 'productos' como array y 'obra' del frontend
  const { productos, tipo, nota, obra, referencia, foto } = req.body;

  try {
    const movimientosGuardados = [];

    // Procesar cada producto del array
    for (const item of productos) {
      const { producto: productoId, cantidad } = item;
      let productoDoc;

      // Buscar producto por ID (el frontend envía el ID en el campo 'producto')
      if (productoId) {
        productoDoc = await Producto.findById(productoId);
        if (!productoDoc) {
          return res.status(404).json({ msg: `Producto con ID ${productoId} no encontrado` });
        }
      } else {
        return res.status(400).json({ msg: 'Debe proporcionar el ID del producto' });
      }

      // Actualizar cantidad del producto
      if (tipo === 'salida' && productoDoc.stock < cantidad) {
        return res.status(400).json({ msg: `Stock insuficiente para ${productoDoc.nombre}. Disponible: ${productoDoc.stock}` });
      }
      
      // Actualizar stock (usando el campo 'stock' del modelo Producto, no 'cantidad')
      productoDoc.stock = (productoDoc.stock || 0) + ((tipo === 'entrada' || tipo === 'ajuste') ? cantidad : -cantidad);
      if (productoDoc.stock < 0) productoDoc.stock = 0; // Evitar negativos
      
      // Actualizar fechas (opcional, si tu modelo Producto tiene estos campos)
      // if (tipo === 'entrada') productoDoc.fechaUltimaEntrada = new Date();
      // if (tipo === 'salida') productoDoc.fechaUltimaSalida = new Date();

      await productoDoc.save();

      // Crear registro de movimiento individual
      const movimiento = new MovimientoProducto({
        producto: productoDoc._id,
        tipo,
        cantidad,
        usuario: req.user.id, // Usar ID del usuario autenticado (gracias al middleware auth)
        nota,
        referencia,
        obra,
        foto // Guardamos la URL de la foto
      });
      
      await movimiento.save();
      movimientosGuardados.push(movimiento);
    }

    res.status(201).json({ 
      msg: 'Movimientos de productos registrados correctamente', 
      count: movimientosGuardados.length 
    });
    
  } catch (error) {
    console.error('Error al registrar movimiento de producto:', error);
    res.status(500).json({ msg: 'Error en servidor', error: error.message });
  }
};

export const listarMovimientosProducto = async (req, res) => {
  try {
    const movimientos = await MovimientoProducto.find()
      .populate('producto', 'nombre stock unidad obra')
      .populate('usuario', 'nombre')
      .sort({ createdAt: -1 });
    res.json(movimientos);
  } catch (error) {
    console.error('Error al listar movimientos de producto:', error);
    res.status(500).json({ msg: 'Error en servidor', error: error.message });
  }
};