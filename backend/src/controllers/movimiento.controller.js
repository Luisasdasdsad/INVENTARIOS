import Movimiento from '../models/movimiento.model.js';
import Herramienta from '../models/herramienta.model.js';
import { validationResult } from 'express-validator';
import User from '../models/usuario.model.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import mongoose from 'mongoose';

export const registrarMovimiento = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { herramientas, tipo, nota, obra, foto } = req.body;

  try {
    // Validar que se proporcionen herramientas
    if (!herramientas || !Array.isArray(herramientas) || herramientas.length === 0) {
      return res.status(400).json({ msg: 'Debe proporcionar al menos una herramienta' });
    }

    const herramientasMovimiento = [];

    // Procesar cada herramienta
    for (const item of herramientas) {
      const { herramienta: herramientaId, barcode, cantidad } = item;

      let herramientaDoc;

      // Buscar herramienta por ID o por código de barras
      if (barcode) {
        herramientaDoc = await Herramienta.findOne({ barcode });
        if (!herramientaDoc) {
          return res.status(404).json({ msg: `Herramienta no encontrada con el código de barras ${barcode}` });
        }
      } else if (herramientaId) {
        herramientaDoc = await Herramienta.findById(herramientaId);
        if (!herramientaDoc) {
          return res.status(404).json({ msg: 'Herramienta no encontrada' });
        }
      } else {
        return res.status(400).json({ msg: 'Cada herramienta debe tener ID o código de barras' });
      }

      // Verificar stock para salidas
      if (tipo === 'salida' && herramientaDoc.cantidad < cantidad) {
        return res.status(400).json({ msg: `Cantidad insuficiente para ${herramientaDoc.nombre}` });
      }

      // Actualizar stock
      herramientaDoc.cantidad += tipo === 'entrada' ? cantidad : -cantidad;
      if (herramientaDoc.cantidad < 0) herramientaDoc.cantidad = 0;
      await herramientaDoc.save();

      herramientasMovimiento.push({
        herramienta: herramientaDoc._id,
        cantidad
      });
    }

    const movimiento = new Movimiento({
      herramientas: herramientasMovimiento,
      tipo,
      usuario: req.user.id, // Asociar al usuario logueado
      nota,
      obra,
      foto,
    });
    await movimiento.save();

    const movimientoGuardado = await Movimiento.findById(movimiento._id)
      .populate({
        path: 'herramientas.herramienta',
        select: 'nombre marca modelo serie unidad barcode'
      })
      .populate('usuario', 'nombre');

    res.status(201).json({ msg: 'Movimiento registrado', movimiento: movimientoGuardado });
  } catch (error) {
    console.error('Error al registrar movimiento:', error);
    res.status(500).json({ msg: 'Error en servidor', error: error.message });
  }
};

export const listarMovimientos = async (req, res) => {
  try {
    // Si el usuario no es admin, solo mostrar sus propios movimientos
    const filtro = req.user.rol !== 'admin' ? { usuario: req.user.id } : {};

    const movimientos = await Movimiento.find(filtro)
      .populate({
        path: 'herramientas.herramienta',
        select: 'nombre marca modelo serie unidad barcode'
      })
      .populate('usuario', 'nombre')
      .sort({ createdAt: -1 }); // Ordenar por fecha descendente (más recientes primero)
    res.json(movimientos);
  } catch (error) {
    console.error('Error al listar movimientos:', error);
    res.status(500).json({ msg: 'Error en servidor', error: error.message });
  }
};
