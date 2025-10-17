import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
    { header: "Movimiento", dataKey: "tipo" },
    { header: "Tipo", dataKey: "herramienta" },
    { header: "Cantidad", dataKey: "cantidad" },
    { header: "Responsable", dataKey: "usuario" },
    { header: "Obra", dataKey: "obra" },
    { header: "Nota", dataKey: "nota" },
  ];

  // 🔹 Filas
  const filas = movimientosFiltrados.map((m) => ({
    fecha: new Date(m.fecha || m.createdAt).toLocaleDateString(),
    tipo: m.tipo || "—",
    herramienta: m.herramienta?.tipo || "—",
    cantidad: m.cantidad || 0,
    usuario: m.usuario?.nombre || "—",
    obra: m.obra || "—",
    nota: m.nota || "—",
  }));

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
      fecha: { cellWidth: 80 },
      tipo: { cellWidth: 80 },
      herramienta: { cellWidth: 100 },
      cantidad: { cellWidth: 60, halign: "center" },
      usuario: { cellWidth: 100 },
      obra: { cellWidth: 100 },
      nota: { cellWidth: 100 },
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
