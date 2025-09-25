import Movimiento from '../models/movimiento.model.js';
import Herramienta from '../models/herramienta.model.js';
import { validationResult } from 'express-validator';
import User from '../models/usuario.model.js';

export const registrarMovimiento = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { herramienta, barcode, tipo, cantidad, nota, nombreUsuario } = req.body;

  try {
    let herramientaDoc;

    // Buscar herramienta por ID o por código de barras
    if (barcode) {
      herramientaDoc = await Herramienta.findOne({ barcode });
      if (!herramientaDoc) {
        return res.status(404).json({ msg: 'Herramienta no encontrada con el código de barras proporcionado' });
      }
    } else if (herramienta) {
      herramientaDoc = await Herramienta.findById(herramienta);
      if (!herramientaDoc) {
        return res.status(404).json({ msg: 'Herramienta no encontrada' });
      }
    } else {
      return res.status(400).json({ msg: 'Debe proporcionar el ID de la herramienta o el código de barras' });
    }

    if (tipo === 'salida' && herramientaDoc.cantidad < cantidad) {
      return res.status(400).json({ msg: 'Cantidad insuficiente' });
    }
    herramientaDoc.cantidad += tipo === 'entrada' ? cantidad : -cantidad;
    if (herramientaDoc.cantidad < 0) herramientaDoc.cantidad = 0;
    await herramientaDoc.save();

    // Buscar o crear usuario con el nombre proporcionado
    let usuario = await User.findOne({ nombre: nombreUsuario });
    if (!usuario) {
      // Crear usuario temporal si no existe
      usuario = new User({
        nombre: nombreUsuario,
        email: `${nombreUsuario.toLowerCase()}@temp.com`,
        password: 'temp123' // Password temporal
      });
      await usuario.save();
    }

    const movimiento = new Movimiento({
      herramienta: herramientaDoc._id,
      tipo,
      cantidad,
      usuario: usuario._id,
      nota,
    });
    await movimiento.save();

    const movimientoGuardado = await Movimiento.findById(movimiento._id)
      .populate('herramienta', 'nombre codigo unidad barcode')
      .populate('usuario', 'nombre');

    res.status(201).json({ msg: 'Movimiento registrado', movimiento: movimientoGuardado });
  } catch (error) {
    console.error('Error al registrar movimiento:', error);
    res.status(500).json({ msg: 'Error en servidor', error: error.message });
  }
};

export const listarMovimientos = async (req, res) => {
  try {
    const movimientos = await Movimiento.find()
      .populate('herramienta', 'nombre codigo unidad')
      .populate('usuario', 'nombre');
    res.json(movimientos);
  } catch (error) {
    console.error('Error al listar movimientos:', error);
    res.status(500).json({ msg: 'Error en servidor', error: error.message });
  }
};
