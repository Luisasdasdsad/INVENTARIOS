import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generarReporteMovimientoIndividual = (movimiento) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  // 🔹 Título principal
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("MOVIMIENTO INDIVIDUAL", 40, 60);

  // 🔹 Línea separadora
  doc.setLineWidth(1);
  doc.line(40, 70, 550, 70);

  // 🔹 Información del movimiento en formato estructurado
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("DETALLES DEL MOVIMIENTO", 40, 100);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");

  // Crear tabla con autoTable para detalles generales
  const datosGenerales = [
    ["Tipo de Movimiento", movimiento.tipo.charAt(0).toUpperCase() + movimiento.tipo.slice(1)],
    ["Responsable", movimiento.usuario?.nombre || 'N/A'],
    ["Obra", movimiento.obra || 'N/A'],
    ["Nota", movimiento.nota || 'Sin nota'],
    ["Fecha y Hora", new Date(movimiento.fecha || movimiento.createdAt).toLocaleString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })],
  ];

  autoTable(doc, {
    startY: 120,
    body: datosGenerales,
    theme: "grid",
    headStyles: {
      fillColor: [33, 150, 243],
      textColor: 255,
      halign: "center",
      fontSize: 10,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 10,
      cellPadding: 8,
    },
    columnStyles: {
      0: { cellWidth: 150, fontStyle: "bold", fillColor: [245, 245, 245] },
      1: { cellWidth: 350 },
    },
    styles: {
      lineColor: [200, 200, 200],
      lineWidth: 0.5,
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { left: 40, right: 40 },
  });

  // 🔹 Tabla de herramientas
  let startYHerramientas = doc.lastAutoTable.finalY + 20;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("HERRAMIENTAS INVOLUCRADAS", 40, startYHerramientas);

  const herramientasDatos = movimiento.herramientas.map(h => [
    h.herramienta?.nombre || 'N/A',
    h.herramienta?.marca || 'N/A',
    h.herramienta?.modelo || 'N/A',
    `${h.cantidad} ${h.herramienta?.unidad || 'unidad'}`,
  ]);

  autoTable(doc, {
    startY: startYHerramientas + 20,
    head: [["Herramienta", "Marca", "Modelo", "Cantidad"]],
    body: herramientasDatos,
    theme: "grid",
    headStyles: {
      fillColor: [33, 150, 243],
      textColor: 255,
      halign: "center",
      fontSize: 10,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 10,
      cellPadding: 8,
    },
    columnStyles: {
      0: { cellWidth: 150 },
      1: { cellWidth: 100 },
      2: { cellWidth: 100 },
      3: { cellWidth: 100, halign: "center" },
    },
    styles: {
      lineColor: [200, 200, 200],
      lineWidth: 0.5,
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { left: 40, right: 40 },
  });

  // 🔹 Pie de página con borde
  const pageHeight = doc.internal.pageSize.height;
  doc.setLineWidth(0.5);
  doc.line(40, pageHeight - 50, 550, pageHeight - 50);

  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Generado automáticamente por el Sistema de Inventario TEAM GAS S.A.C.",
    40,
    pageHeight - 30
  );

  // 🔹 Guardar PDF
  const fecha = new Date().toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  doc.save(`movimiento_${movimiento._id}_${fecha}.pdf`);
};

export const generarReporteMovimientos = (movimientosFiltrados = []) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });

  // 🔹 Título
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("REPORTE DE MOVIMIENTOS", 40, 50);

  // 🔹 Fecha
  const fecha = new Date().toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Fecha de generación: ${fecha}`, 40, 80);

  // 🔹 Total de movimientos
  doc.text(`Total de movimientos: ${movimientosFiltrados.length}`, 40, 100);

  // 🔹 Columnas
  const columnas = [
    { header: "Fecha", dataKey: "fecha" },
    { header: "Hora", dataKey: "hora" },
    { header: "Movimiento", dataKey: "tipo" },
    { header: "Herramienta", dataKey: "herramienta" },
    { header: "Cantidad", dataKey: "cantidad" },
    { header: "Responsable", dataKey: "usuario" },
    { header: "Obra", dataKey: "obra" },
    { header: "Nota", dataKey: "nota" },
  ];

  // 🔹 Filas: Expandir cada herramienta en una fila separada
  const filas = [];
  movimientosFiltrados.forEach((m) => {
    const fechaMov = new Date(m.fecha || m.createdAt).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const horaMov = new Date(m.fecha || m.createdAt).toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const tipoMov = m.tipo || "—";
    const usuarioMov = m.usuario?.nombre || "—";
    const obraMov = m.obra || "—";
    const notaMov = m.nota || "—";

    if (m.herramientas && m.herramientas.length > 0) {
      m.herramientas.forEach((h) => {
        filas.push({
          fecha: fechaMov,
          hora: horaMov,
          tipo: tipoMov,
          herramienta: h.herramienta?.nombre || "—",
          cantidad: h.cantidad || 0,
          usuario: usuarioMov,
          obra: obraMov,
          nota: notaMov,
        });
      });
    } else {
      // Fallback para movimientos antiguos con una sola herramienta
      filas.push({
        fecha: fechaMov,
        hora: horaMov,
        tipo: tipoMov,
        herramienta: m.herramienta?.nombre || "—",
        cantidad: m.cantidad || 0,
        usuario: usuarioMov,
        obra: obraMov,
        nota: notaMov,
      });
    }
  });

  // 🔹 Tabla con diseño
  autoTable(doc, {
    columns: columnas,
    body: filas,
    startY: 120,
    theme: "grid",
    headStyles: {
      fillColor: [33, 150, 243],
      textColor: 255,
      halign: "center",
      fontSize: 9,
    },
    bodyStyles: { fontSize: 8, cellPadding: 3 },
    styles: { lineColor: [200, 200, 200], lineWidth: 0.2 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 10, right: 10 },
    columnStyles: {
      fecha: { cellWidth: 70 },
      hora: { cellWidth: 60 },
      tipo: { cellWidth: 70 },
      herramienta: { cellWidth: 120 },
      cantidad: { cellWidth: 50, halign: "center" },
      usuario: { cellWidth: 80 },
      obra: { cellWidth: 80 },
      nota: { cellWidth: 80 },
    },
  });

  // 🔹 Pie de página
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(9);
  doc.text(
    "Generado automáticamente por el Sistema de Inventario TEAM GAS S.A.C.",
    40,
    pageHeight - 30
  );

  // 🔹 Guardar PDF
  doc.save(`reporte_movimientos_${fecha}.pdf`);
};
