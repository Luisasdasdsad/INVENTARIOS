import MovimientoProducto from '../models/movimientoProducto.model.js';
import Producto from '../models/producto.model.js'; // Necesario para actualizar la cantidad del producto
import User from '../models/usuario.model.js'; // Asumo que tienes un modelo de usuario
import { validationResult } from 'express-validator'; // Si usas validación

export const registrarMovimientoProducto = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { productoId, barcode, tipo, cantidad, nota, nombreUsuario, referencia } = req.body;

  try {
    let productoDoc;

    // Buscar producto por ID o por código de barras
    if (barcode) {
      productoDoc = await Producto.findOne({ barcode });
      if (!productoDoc) {
        return res.status(404).json({ msg: 'Producto no encontrado con el código de barras proporcionado' });
      }
    } else if (productoId) {
      productoDoc = await Producto.findById(productoId);                                 
      if (!productoDoc) {
        return res.status(404).json({ msg: 'Producto no encontrado' });
      }
    } else {
      return res.status(400).json({ msg: 'Debe proporcionar el ID del producto o el código de barras' });
    }

    // Actualizar cantidad del producto
    if (tipo === 'salida' && productoDoc.cantidad < cantidad) {
      return res.status(400).json({ msg: 'Cantidad insuficiente en inventario para la salida' });
    }
    
    productoDoc.cantidad += (tipo === 'entrada' || tipo === 'ajuste') ? cantidad : -cantidad;
    if (productoDoc.cantidad < 0) productoDoc.cantidad = 0; // Evitar cantidades negativas
    
    // Actualizar fechas de último movimiento
    if (tipo === 'entrada') productoDoc.fechaUltimaEntrada = new Date();
    if (tipo === 'salida') productoDoc.fechaUltimaSalida = new Date();

    await productoDoc.save();

    // Buscar o crear usuario con el nombre proporcionado
    let usuario = await User.findOne({ nombre: nombreUsuario });
    if (!usuario) {
      // Crear usuario temporal si no existe (considera mejorar esto para producción)
      usuario = new User({
        nombre: nombreUsuario,
        email: `${nombreUsuario.toLowerCase().replace(/\s/g, '')}@temp.com`,
        password: 'temp123' // Password temporal
      });
      await usuario.save();
    }

    const movimiento = new MovimientoProducto({
      producto: productoDoc._id,
      tipo,
      cantidad,
      usuario: usuario._id,
      nota,
      referencia,
    });
    await movimiento.save();

    const movimientoGuardado = await MovimientoProducto.findById(movimiento._id)
      .populate('producto', 'nombre sku cantidad unidadMedida barcode')
      .populate('usuario', 'nombre');

    res.status(201).json({ msg: 'Movimiento de producto registrado', movimiento: movimientoGuardado });
  } catch (error) {
    console.error('Error al registrar movimiento de producto:', error);
    res.status(500).json({ msg: 'Error en servidor', error: error.message });
  }
};

export const listarMovimientosProducto = async (req, res) => {
  try {
    const movimientos = await MovimientoProducto.find()
      .populate('producto', 'nombre sku unidadMedida')
      .populate('usuario', 'nombre')
      .sort({ createdAt: -1 });
    res.json(movimientos);
  } catch (error) {
    console.error('Error al listar movimientos de producto:', error);
    res.status(500).json({ msg: 'Error en servidor', error: error.message });
  }
};