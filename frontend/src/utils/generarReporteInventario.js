import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generarReporteInventario = (herramientasFiltradas = []) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });

  // 🔹 Título
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("REPORTE DE INVENTARIO", 40, 50);

  // 🔹 Fecha
  const fecha = new Date().toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Fecha de generación: ${fecha}`, 40, 80);

  // 🔹 Total de herramientas
  doc.text(`Total de herramientas: ${herramientasFiltradas.length}`, 40, 100);

  // 🔹 Columnas
  const columnas = [
    { header: "Nombre", dataKey: "nombre" },
    { header: "Marca", dataKey: "marca" },
    { header: "Modelo", dataKey: "modelo" },
    { header: "Tipo", dataKey: "tipo" },
    { header: "Cantidad", dataKey: "cantidad" },
    { header: "Unidad", dataKey: "unidad" },
    { header: "Estado", dataKey: "estado" },
    { header: "Precio", dataKey: "precio" },
  ];

  // 🔹 Filas
  const filas = herramientasFiltradas.map((h) => ({
    nombre: h.nombre || "—",
    marca: h.marca || "—",
    modelo: h.modelo || "—",
    tipo: h.tipo || "—",
    cantidad: h.cantidad || 0,
    unidad: h.unidad || "unidad",
    estado: h.estado || "disponible",
    precio: h.precio ? `S/ ${h.precio.toFixed(2)}` : "S/ 0.00",
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
      nombre: { cellWidth: 100 },
      marca: { cellWidth: 80 },
      modelo: { cellWidth: 80 },
      tipo: { cellWidth: 100 },
      cantidad: { cellWidth: 50, halign: "center" },
      unidad: { cellWidth: 50 },
      estado: { cellWidth: 60 },
      precio: { cellWidth: 60, halign: "right" },
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
  doc.save(`reporte_inventario_${fecha}.pdf`);
};
