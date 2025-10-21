import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generarReporteProductos = (productosFiltrados = []) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });

  // 🔹 Título
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("REPORTE DE PRODUCTOS", 40, 50);

  // 🔹 Fecha
  const fecha = new Date().toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Fecha de generación: ${fecha}`, 40, 80);

  // 🔹 Total de productos
  doc.text(`Total de productos: ${productosFiltrados.length}`, 40, 100);

  // 🔹 Columnas
  const columnas = [
    { header: "Nombre", dataKey: "nombre" },
    { header: "Categoría", dataKey: "categoria" },
    { header: "Stock", dataKey: "stock" },
    { header: "Unidad", dataKey: "unidad" },
    { header: "Precio Unitario", dataKey: "precioUnitario" },
    { header: "Descripción", dataKey: "descripcion" },
  ];

  // 🔹 Filas
  const filas = productosFiltrados.map((p) => ({
    nombre: p.nombre || "—",
    categoria: p.categoria || "—",
    stock: p.stock || 0,
    unidad: p.unidad || "unidad",
    precioUnitario: p.precioUnitario ? `S/ ${p.precioUnitario.toFixed(2)}` : "S/ 0.00",
    descripcion: p.descripcion || "—",
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
      nombre: { cellWidth: 120 },
      categoria: { cellWidth: 100 },
      stock: { cellWidth: 50, halign: "center" },
      unidad: { cellWidth: 50 },
      precioUnitario: { cellWidth: 80, halign: "right" },
      descripcion: { cellWidth: 150 },
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
  doc.save(`reporte_productos_${fecha}.pdf`);
};
