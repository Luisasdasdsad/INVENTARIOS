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
  const { herramienta, barcode, tipo, cantidad, nota, nombreUsuario, obra } = req.body;

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
      .populate('herramienta', 'nombre marca modelo serie unidad barcode')
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
      .populate('herramienta', 'nombre marca modelo serie unidad')
      .populate('usuario', 'nombre');
    res.json(movimientos);
  } catch (error) {
    console.error('Error al listar movimientos:', error);
    res.status(500).json({ msg: 'Error en servidor', error: error.message });
  }
};

export const generarReportePDF = async (req, res) => {
  try {
    const { tipo, fechaDesde, fechaHasta } = req.query;
    let query = { tipo: { $in: ['entrada', 'salida'] } }; // Default solo válidos

    if (tipo && ['entrada', 'salida'].includes(tipo.toLowerCase())) {
      query.tipo = tipo.toLowerCase();
    }
    if (fechaDesde) {
      query.createdAt = query.createdAt || {};
      query.createdAt.$gte = new Date(fechaDesde + 'T00:00:00');
    }
    if (fechaHasta) {
      query.createdAt = query.createdAt || {};
      query.createdAt.$lte = new Date(fechaHasta + 'T23:59:59');
    }

    const movimientos = await Movimiento.find(query)
      .populate('herramienta', 'nombre marca modelo serie unidad')
      .populate('usuario', 'nombre')
      .sort({ createdAt: -1 }) // Más recientes primero, como sample
      .lean();

    if (movimientos.length === 0) {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="reporte-movimientos-${new Date().toISOString().split('T')[0]}.pdf"`);
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
      doc.pipe(res);

      doc.fontSize(24).font('Helvetica-Bold').text('Reporte de Movimientos', 0, 50, { align: 'center', width: 650 });
      doc.fontSize(12).font('Helvetica').moveTo(50, 100).lineTo(700, 100).stroke(); // Línea separadora
      doc.text('No hay movimientos disponibles con los filtros aplicados.', 50, 120, { align: 'center', width: 650 });
      if (tipo || fechaDesde || fechaHasta) {
        let filtrosStr = `Filtros: Tipo=${tipo || 'Todos'}; Desde=${fechaDesde || 'N/A'}; Hasta=${fechaHasta || 'N/A'}.`;
        doc.text(filtrosStr, 50, 140, { width: 650 });
      }
      doc.moveDown(2);
      doc.text('Generado por el sistema de inventario.', { align: 'center' });
      doc.end();
      return;
    }

    // Config PDF: Landscape para ancho extra
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    let filename = `reporte-movimientos-${new Date().toISOString().split('T')[0]}.pdf`;
    if (tipo) filename += `-tipo-${tipo}`;
    if (fechaDesde || fechaHasta) filename += `-fechas-${fechaDesde || ''}-${fechaHasta || ''}`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    doc.pipe(res);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('Reporte de Movimientos de Inventario', 50, 50, { width: 650, align: 'center' });
    doc.fontSize(12).text(`Generado el: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`, 50, 80, { width: 650, align: 'center' });
    doc.moveTo(50, 100).lineTo(700, 100).stroke(); // Línea bajo header

    // Filtros (si aplican)
    let yPos = 120;
    if (tipo || fechaDesde || fechaHasta) {
      let filtrosText = 'Filtros aplicados: ';
      if (tipo) filtrosText += `Tipo: ${tipo.toUpperCase()}; `;
      if (fechaDesde) filtrosText += `Desde: ${new Date(fechaDesde).toLocaleDateString('es-ES')}; `;
      if (fechaHasta) filtrosText += `Hasta: ${new Date(fechaHasta).toLocaleDateString('es-ES')}; `;
      doc.fontSize(10).text(filtrosText.slice(0, -2) + '.', 50, yPos, { width: 650 });
      yPos += 20;
    }

    doc.fontSize(12).font('Helvetica-Bold').text(`Total de movimientos: ${movimientos.length}`, 50, yPos);
    yPos += 30;

    // Tabla: Headers y columnas fijas (optimizadas para sample: herramienta como "eJMLO (3)")
    const headers = ['Tipo', 'Herramienta', 'Marca', 'Modelo', 'Serie', 'Cantidad', 'Unidad', 'Usuario', 'Fecha', 'Nota'];
    const colWidths = [40, 100, 80, 80, 80, 50, 50, 80, 100, 100]; // Anchos para landscape (suma 680px)
    const colX = [50]; // Posiciones X acumuladas
    for (let i = 1; i < colWidths.length; i++) {
      colX.push(colX[i - 1] + colWidths[i - 1]);
    }
    const tableEndX = colX[colX.length - 1] + colWidths[colWidths.length - 1];
    const rowHeight = 20;
    const maxRowsPerPage = 20; // ~500px / 20px
    let currentPageRows = 0;

    // Función para dibujar header de tabla
    const drawTableHeader = (y) => {
      doc.font('Helvetica-Bold').fontSize(8);
      headers.forEach((header, i) => {
        doc.text(header, colX[i], y, { width: colWidths[i], align: i >= 2 && i <= 5 ? 'center' : 'left' });
      });
      // Borders header
      doc.moveTo(50, y).lineTo(tableEndX, y).stroke(); // Top
      colX.forEach((x, i) => {
        if (i < colX.length) doc.moveTo(x, y).lineTo(x, y + rowHeight).stroke(); // Verticals
      });
      doc.moveTo(tableEndX, y).lineTo(tableEndX, y + rowHeight).stroke();
    };

    // Función para fila de datos (con truncado para sample)
    const drawDataRow = (mov, y, rowNum) => {
      doc.font('Helvetica').fontSize(7);
      if (rowNum % 2 === 0) doc.fillColor('#f5f5f5'); // Gris alterno

      // Tipo (mayús, badge-like)
      doc.text((mov.tipo || 'N/A').toUpperCase(), colX[0], y, { width: colWidths[0], align: 'center' });

      // Herramienta (truncada, maneja "N/A ()")
      let herrName = mov.herramienta ? `${mov.herramienta.nombre || 'N/A'} (${mov.herramienta.codigo || ''})` : 'N/A';
      if (herrName.length > 28) herrName = herrName.substring(0, 28) + '...';
      doc.text(herrName, colX[1], y, { width: colWidths[1], align: 'left' });

      // Marca
      let marca = mov.herramienta?.marca || '-';
      if (marca.length > 10) marca = marca.substring(0, 10) + '...';
      doc.text(marca, colX[2], y, { width: colWidths[2], align: 'left' });
      
      // Modelo
      let modelo = mov.herramienta?.modelo || '-';
      if (modelo.length > 10) modelo = modelo.substring(0, 10) + '...';
      doc.text(modelo, colX[3], y, { width: colWidths[3], align: 'left' });
      
      // Serie
      let serie = mov.herramienta?.serie || '-';
      if (serie.length > 10) serie = serie.substring(0, 10) + '...';
      doc.text(serie, colX[4], y, { width: colWidths[4], align: 'left' });

      // Cantidad (numérico, center)
      doc.text((mov.cantidad || 0).toString(), colX[2], y, { width: colWidths[2], align: 'center' });

      // Unidad (consistente "-")
      doc.text(mov.herramienta?.unidad || '-', colX[3], y, { width: colWidths[3], align: 'center' });

      // Usuario
      doc.text(mov.usuario?.nombre || 'Desconocido', colX[4], y, { width: colWidths[4], align: 'left' });

      // Fecha (corta, como sample "25/09/2025, 17:19")
      const fechaFmt = new Date(mov.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) + 
                       ', ' + new Date(mov.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      doc.text(fechaFmt, colX[5], y, { width: colWidths[5], align: 'center' });

      // Nota (truncada)
      let nota = mov.nota || '-';
      if (nota.length > 35) nota = nota.substring(0, 35) + '...';
      doc.text(nota, colX[6], y, { width: colWidths[6], align: 'left' });

      doc.fillColor('black'); // Reset

      // Borders fila
      doc.moveTo(50, y + rowHeight).lineTo(tableEndX, y + rowHeight).stroke(); // Bottom
      colX.forEach(x => doc.moveTo(x, y + rowHeight).lineTo(x, y + 2 * rowHeight).stroke()); // Verticals next
      doc.moveTo(tableEndX, y + rowHeight).lineTo(tableEndX, y + 2 * rowHeight).stroke();
    };

    // Dibujar tabla
    drawTableHeader(yPos);
    let currentY = yPos + rowHeight;

    movimientos.forEach((mov, index) => {
      if (currentPageRows >= maxRowsPerPage || currentY > 650) { // Paginación
        doc.addPage({ size: 'A4', layout: 'landscape', margin: 50 });
        currentY = 100;
        drawTableHeader(currentY);
        currentY += rowHeight;
        currentPageRows = 0;
      }

      drawDataRow(mov, currentY, index);
      currentY += rowHeight;
      currentPageRows++;
    });

    // Pie
    doc.addPage({ size: 'A4', layout: 'landscape', margin: 50 });
    doc.fontSize(10).text('Fin del reporte. Generado por el sistema de inventario el ' + new Date().toLocaleString('es-ES'), 50, 400, { align: 'center', width: 650 });
    doc.end();

  } catch (error) {
    console.error('Error al generar PDF:', error);
    res.status(500).json({ msg: 'Error interno al generar PDF', error: error.message });
  }
};
