import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/LogoTG.png"; // Logo principal
// import qrImage from "../assets/qr.png";  // Tu código QR (opcional)

const generarReporteCotizacion = ({
  cliente,
  productos,
  subtotal,
  igv,
  total,
  fecha,
  moneda,
  numeroCotizacion,
  condicionPago = "CONTADO",
  validez = "15 días",
}) => {
  const doc = new jsPDF();
  const margenIzq = 10;

  // 🔹 1. Encabezado con logo y datos
  doc.addImage(logo, "PNG", margenIzq, 10, 35, 25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("TEAMGAS SOCIEDAD ANONIMA CERRADA", 48, 15);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("JR. CORONEL GUERRA NRO. 152 (PLAZA PRINCIPAL)", 48, 20);
  doc.text("JUNIN - CHUPACA - CHUPACA", 48, 25);

  // 🔹 Caja derecha con RUC y número de cotización
  doc.setFontSize(11);
  doc.rect(144, 10, 60, 25);
  doc.text("RUC 20604956499", 145, 18);
  doc.text(`${numeroCotizacion}`, 145, 27);

  // 🔹 2. Bloque Emisor / Cliente
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("EMISOR:", margenIzq, 45);
  doc.text("CLIENTE:", 110, 45);

  // Caja emisor y cliente
  doc.rect(margenIzq, 47, 90, 25);
  doc.rect(110, 47, 90, 25);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("TEAMGAS SAC", margenIzq + 5, 52);
  doc.text("RUC: 20604956499", margenIzq + 5, 57);
  doc.text("EMAIL: teamgas@gmail.com", margenIzq + 5, 62);
  doc.text("TELÉFONO: 987654321", margenIzq + 5, 67);

  doc.text(`${cliente.nombre || "#N/A"}`, 115, 52);
  doc.text(`RUC: ${cliente.documento || "#N/A"}`, 115, 57);
  doc.text(`DIRECCIÓN: ${cliente.direccion || "#N/A"}`, 115, 62);
  doc.text(`TELÉFONO: ${cliente.telefono || "#N/A"}`, 115, 67);

  // 🔹 3. Datos de la cotización
  doc.setFont("helvetica", "bold");
  doc.text("DATOS DE LA COTIZACIÓN", margenIzq, 80);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.line(margenIzq, 82, 200, 82);

  doc.text(`FECHA DE EMISIÓN: ${new Date(fecha).toLocaleDateString()}`, margenIzq, 88);
  doc.text(`CONDICIÓN DE PAGO: ${condicionPago}`, 130, 88);
  doc.text(`TIEMPO DE VALIDEZ: ${validez}`, margenIzq, 93);
  doc.text(`MONEDA: ${moneda}`, 130, 93);

  // 🔹 4. Tabla de productos
  autoTable(doc, {
    startY: 100,
    head: [["N°", "CANT.", "UND", "DESCRIPCIÓN", "V. UNIT", "IGV", "P. UNIT", "TOTAL"]],
    body: productos.map((p, i) => [
      i + 1,
      p.cantidad,
      p.unidad || "",
      p.descripcion,
      p.precioUnit.toFixed(2),
      (p.precioUnit * 0.18).toFixed(2),
      (p.precioUnit * 1.18).toFixed(2),
      (p.cantidad * p.precioUnit * 1.18).toFixed(2),
    ]),
    headStyles: { fillColor: [230, 230, 230], textColor: 0, halign: "center" },
    styles: { fontSize: 8, cellPadding: 2 },
  });

  // 🔹 5. Observaciones y QR
  const y = doc.lastAutoTable.finalY + 8;
  doc.setFont("helvetica", "bold");
  doc.text("OBSERVACIONES:", margenIzq, y);
  doc.rect(margenIzq, y + 2, 190, 20);

  // Banco y QR
  doc.setFontSize(8);
  doc.text("Banco de Crédito BCP", margenIzq, y + 30);
  doc.text("CTA: ---------------------------", margenIzq, y + 35);
  doc.text("CCI: ---------------------------", margenIzq, y + 40);
  doc.text("Titular: TEAMGAS S.A.C", margenIzq, y + 45);

  // QR (opcional)
  //if (qrImage) {
    //doc.addImage(qrImage, "PNG", 95, y + 25, 30, 30);
    //doc.text("Escanee nuestro QR y visite nuestra página web", 80, y + 60);
  //}

  // 🔹 6. Totales
  const yTotales = y + 25;
  doc.setFont("helvetica", "bold");
  doc.text("SUB TOTAL:", 150, yTotales);
  doc.text("IGV 18%:", 150, yTotales + 5);
  doc.text("TOTAL:", 150, yTotales + 10);

  doc.setFont("helvetica", "normal");
  doc.text(`${moneda} ${subtotal.toFixed(2)}`, 190, yTotales, { align: "right" });
  doc.text(`${moneda} ${igv.toFixed(2)}`, 190, yTotales + 5, { align: "right" });
  doc.text(`${moneda} ${total.toFixed(2)}`, 190, yTotales + 10, { align: "right" });

  // 🔹 Pie
  doc.setFontSize(8);
  doc.text("Gracias por su preferencia.", 105, 285, { align: "center" });

  doc.save(`COTIZACION-${cliente.nombre}.pdf`);
};

export default generarReporteCotizacion;
