import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generarReporteMovimientos = (movimientosFiltrados = []) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  // 🔹 Fecha
  const fecha = new Date().toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.setFontSize(10);
  doc.text(`Fecha de generación: ${fecha}`, 40, 120);

  // 🔹 Columnas (se agregan Obra y Nota)
  const columnas = [
    { header: "Fecha", dataKey: "fecha" },
    { header: "Movimiento", dataKey: "tipo" },
    { header: "Tipo", dataKey: "herramienta" },
    { header: "Cantidad", dataKey: "cantidad" },
    { header: "Responsable", dataKey: "usuario" },
    { header: "Obra", dataKey: "obra" },
    { header: "Nota", dataKey: "nota" },
  ];

  // 🔹 Filas (se agregan obra y nota)
  const filas = movimientosFiltrados.map((m) => ({
    fecha: new Date(m.fecha).toLocaleDateString(),
    tipo: m.tipo || "—",
    herramienta: m.herramienta?.nombre || m.herramienta || "—",
    cantidad: m.cantidad || 0,
    usuario: m.usuario?.nombre || m.usuario || "—",
    obra: m.obra || "—",
    nota: m.nota || "—",
  }));

  // 🔹 Tabla con diseño
  autoTable(doc, {
    columns: columnas,
    body: filas,
    startY: 35,
    theme: "grid",
    headStyles: {
      fillColor: [33, 150, 243],
      textColor: 255,
      halign: "center",
      fontSize: 10,
    },
    bodyStyles: { fontSize: 9, cellPadding: 3 },
    styles: { lineColor: [200, 200, 200], lineWidth: 0.2 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 10, right: 10 },
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
