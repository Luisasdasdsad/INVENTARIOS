import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/LogoTG.png"; // Logo principal
import logoBCP from "../assets/LogoBCP.png"; // Logo BCP
import logoInterbank from "../assets/LogoInterbank.png"; // Logo Interbank
import qrImage from "../assets/QRPagina.png"; // Código QR
import { DefaultContext } from "react-icons/lib";

// Función para convertir números a letras en español
const numeroALetras = (numero) => {
  const unidades = ["", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
  const decenas = ["", "DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
  const especiales = ["DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISEIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE"];
  const centenas = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

  let entero = Math.floor(numero);
  let decimal = Math.round((numero - entero) * 100);

  let letras = "";

  if (entero === 0) {
    letras = "CERO";
  } else {
    if (entero >= 1000000) {
      letras += numeroALetras(Math.floor(entero / 1000000)) + " MILLONES ";
      entero %= 1000000;
    }
    if (entero >= 1000) {
      letras += numeroALetras(Math.floor(entero / 1000)) + " MIL ";
      entero %= 1000;
    }
    if (entero >= 100) {
      letras += centenas[Math.floor(entero / 100)] + " ";
      entero %= 100;
    }
    if (entero >= 20) {
      letras += decenas[Math.floor(entero / 10)] + " ";
      entero %= 10;
    } else if (entero >= 10) {
      letras += especiales[entero - 10] + " ";
      entero = 0;
    }
    if (entero > 0) {
      letras += unidades[entero] + " ";
    }
  }

  letras = letras.trim();

  if (decimal > 0) {
    letras += " CON " + decimal + "/100";
  }

  return letras;
};

const generarReporteCotizacion = async ({
  cliente,
  productos,
  subtotal,
  descuento = 0,
  igv,
  total,
  fecha,
  moneda,
  numeroCotizacion,
  condicionPago = "CONTADO",
  validez = "15 días",
  observaciones = "",
}) => {
  const doc = new jsPDF();
  const margenIzq = 10;

  // 🔹 1. Encabezado con logo y datos
  try {
    const response = await fetch(logo);
    const blob = await response.blob();
    const imageData = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
    doc.addImage(imageData, "PNG", margenIzq, 10, 35, 35);
  } catch (error) {
    console.error("Error loading logo:", error);
    // Continue without logo
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("TEAMGAS SOCIEDAD ANONIMA CERRADA", 48, 20);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("JR. CORONEL GUERRA NRO. 152 (PLAZA PRINCIPAL)", 48, 25);
  doc.text("JUNIN - CHUPACA - CHUPACA", 48, 30);

  // 🔹 Caja derecha con RUC y número de cotización
  doc.setFontSize(11);
  doc.rect(144, 10, 60, 25);
  doc.text("RUC: 20604956499", 145, 18);
  doc.text("COTIZACIÓN", 145, 23);
  doc.text(`COT-${numeroCotizacion}`, 145, 28);

  // 🔹 2. Bloque Emisor / Cliente
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("EMISOR:", margenIzq, 50);
  doc.text("CLIENTE:", 110, 50);

  // Caja emisor y cliente
  doc.rect(margenIzq, 52, 90, 25);
  doc.rect(110, 52, 90, 25);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("TEAMGAS SAC", margenIzq + 5, 57);
  doc.text("RUC: 20604956499", margenIzq + 5, 62);
  doc.text("EMAIL: teamgas@gmail.com", margenIzq + 5, 67);
  doc.text("TELÉFONO: 987654321", margenIzq + 5, 72);

  doc.text(`${cliente.nombre || "#N/A"}`, 115, 57);
  doc.text(`RUC: ${cliente.documento || "#N/A"}`, 115, 62);
  doc.text(`DIRECCIÓN: ${cliente.direccion || "#N/A"}`, 115, 67);
  doc.text(`TELÉFONO: ${cliente.telefono || "#N/A"}`, 115, 72);

  // 🔹 3. Datos de la cotización
  doc.setFont("helvetica", "bold");
  doc.text("DATOS DE LA COTIZACIÓN", margenIzq, 85);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.line(margenIzq, 87, 200, 87);

  // Formatear fecha correctamente para evitar problemas de zona horaria
  const fechaObj = new Date(fecha + 'T00:00:00');
  const fechaFormateada = fechaObj.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  doc.text(`FECHA DE EMISIÓN: ${fechaFormateada}`, margenIzq, 93);
  doc.text(`CONDICIÓN DE PAGO: ${condicionPago}`, 130, 93);
  doc.text(`TIEMPO DE VALIDEZ: ${validez}`, margenIzq, 98);
  doc.text(`MONEDA: ${moneda}`, 130, 98);

  // 🔹 4. Tabla de productos
  autoTable(doc, {
    startY: 105,
    head: [["N°", "CANT.", "UND", "DESCRIPCIÓN", "P. UNIT", "IGV", "V. UNIT", "TOTAL"]],
    body: productos.map((p, i) => [
      i + 1,
      p.cantidad,
      p.unidad || "",
      p.descripcion,
      p.precioUnit.toFixed(2),
      (p.precioUnit * 0.18).toFixed(2),
      (p.precioUnit - p.precioUnit * 0.18).toFixed(2),
      (p.cantidad * p.precioUnit).toFixed(2),
    ]),
    headStyles: { fillColor: [255, 215, 0], textColor: 0, halign: "center" },
    bodyStyles: { fillColor: [255, 240, 100] },
    styles: { fontSize: 8, cellPadding: 1 },
    columnStyles: {
      0: { cellWidth: 10 }, // N°
      1: { cellWidth: 15 }, // CANT.
      2: { cellWidth: 15 }, // UND
      3: { cellWidth: 70 }, // DESCRIPCIÓN - increased width
      4: { cellWidth: 20 }, // P. UNIT
      5: { cellWidth: 15 }, // IGV
      6: { cellWidth: 20 }, // V. UNIT
      7: { cellWidth: 25 }, // TOTAL
    },
  });

  // 🔹 4.1. Monto en letras (a la derecha, sobre los totales)
  const montoEnLetras = numeroALetras(total) + " " + (moneda === "SOLES" ? "SOLES" : "DÓLARES");
  const yMontoLetras = doc.lastAutoTable.finalY + 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("SON:", 120, yMontoLetras);
  doc.setFont("helvetica", "normal");
  const lineasMonto = doc.splitTextToSize(montoEnLetras, 75);
  doc.text(lineasMonto, 140, yMontoLetras);

  // 🔹 5. Totales
  const yTotales = yMontoLetras + (lineasMonto.length * 4) + 8;
  doc.setFont("helvetica", "bold");
  doc.text("SUB TOTAL:", 120, yTotales);
  if (descuento > 0) {
    doc.text(`DESCUENTO:`, 120, yTotales + 5);
    doc.text("SUB TOTAL CON DESCUENTO:", 120, yTotales + 10);
    doc.text("TOTAL:", 120, yTotales + 15);
  } else {
    doc.text("TOTAL:", 120, yTotales + 5);
  }

  doc.setFont("helvetica", "normal");
  doc.text(`${moneda} ${subtotal.toFixed(2)}`, 195, yTotales, { align: "right" });
  if (descuento > 0) {
    const discountedSubtotal = subtotal - descuento;
    doc.text(`${moneda} ${descuento.toFixed(2)}`, 195, yTotales + 5, { align: "right" });
    doc.text(`${moneda} ${discountedSubtotal.toFixed(2)}`, 195, yTotales + 10, { align: "right" });
    doc.text(`${moneda} ${total.toFixed(2)}`, 195, yTotales + 15, { align: "right" });
  } else {
    doc.text(`${moneda} ${total.toFixed(2)}`, 195, yTotales + 5, { align: "right" });
  }

  // 🔹 6. Observaciones
  const yObservaciones = yTotales + (descuento > 0 ? 25 : 15) + 8;
  doc.setFont("helvetica", "bold");
  doc.text("OBSERVACIONES:", margenIzq, yObservaciones);

  // Calcular altura dinámica para observaciones - increased width for more text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const observacionesLines = observaciones ? doc.splitTextToSize(observaciones, 180) : [];
  const lineHeight = 4; // Altura aproximada por línea
  const minObservacionesHeight = 40; // Altura mínima aumentada
  const observacionesHeight = Math.max(minObservacionesHeight, observacionesLines.length * lineHeight + 8);

  doc.rect(margenIzq, yObservaciones + 2, 190, observacionesHeight);
  if (observacionesLines.length > 0) {
    doc.text(observacionesLines, margenIzq + 5, yObservaciones + 8);
  }

  // Calcular posición del banco y verificar si cabe en la página actual
  const yBanco = yObservaciones + observacionesHeight + 10;
  const bancoHeight = 40; // Altura aproximada de la información bancaria
  const pageHeight = doc.internal.pageSize.height;

  // Si no hay suficiente espacio para la información bancaria, agregar nueva página
  if (yBanco + bancoHeight > pageHeight - 20) { // 20 es margen inferior
    doc.addPage();
    const newYBanco = 20; // Reiniciar posición en nueva página

    // Logos de bancos
    try {
      const responseBCP = await fetch(logoBCP);
      const blobBCP = await responseBCP.blob();
      const imageDataBCP = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blobBCP);
      });
      doc.addImage(imageDataBCP, "PNG", margenIzq, newYBanco, 45, 10);
    } catch (error) {
      console.error("Error loading BCP logo:", error);
    }

    doc.setFontSize(8);
    doc.text("Banco de Crédito BCP", margenIzq, newYBanco + 15);
    doc.text("CTA: ---------------------------", margenIzq, newYBanco + 20);
    doc.text("CCI: ---------------------------", margenIzq, newYBanco + 25);

    // Logo Interbank debajo de la descripción del BCP
    try {
      const responseInterbank = await fetch(logoInterbank);
      const blobInterbank = await responseInterbank.blob();
      const imageDataInterbank = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blobInterbank);
      });
      doc.addImage(imageDataInterbank, "PNG", margenIzq, newYBanco + 30, 20, 10);
    } catch (error) {
      console.error("Error loading Interbank logo:", error);
    }

    doc.text("Interbank", margenIzq, newYBanco + 45);
    doc.text("Cuenta corriente dólares:", margenIzq, newYBanco + 50);
    doc.text("CTA: ---------------------------", margenIzq, newYBanco + 55);
    doc.text("CCI: ---------------------------", margenIzq, newYBanco + 60);
    doc.text("Titular: TEAMGAS S.A.C", margenIzq, newYBanco + 65);

    // Pie de página en nueva página
    doc.setFontSize(8);
    doc.text("Gracias por su preferencia.", 105, pageHeight - 10, { align: "center" });

    // Código QR y texto
    try {
      const responseQR = await fetch(qrImage);
      const blobQR = await responseQR.blob();
      const imageDataQR = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blobQR);
      });
      doc.addImage(imageDataQR, "PNG", 92.5, pageHeight - 50, 25, 25);
    } catch (error) {
      console.error("Error loading QR:", error);
    }
    doc.setFontSize(7);
    doc.text("Escanea nuestro QR y visita nuestra página web", 105, pageHeight - 20, { align: "center" });
  } else {
    // Información bancaria cabe en la página actual

    // Logos de bancos
    try {
      const responseBCP = await fetch(logoBCP);
      const blobBCP = await responseBCP.blob();
      const imageDataBCP = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blobBCP);
      });
      doc.addImage(imageDataBCP, "PNG", margenIzq, yBanco, 45, 10);
    } catch (error) {
      console.error("Error loading BCP logo:", error);
    }

    doc.setFontSize(8);
    doc.text("Banco de Crédito BCP", margenIzq, yBanco + 15);
    doc.text("CTA: ---------------------------", margenIzq, yBanco + 20);
    doc.text("CCI: ---------------------------", margenIzq, yBanco + 25);

    // Logo Interbank debajo de la descripción del BCP
    try {
      const responseInterbank = await fetch(logoInterbank);
      const blobInterbank = await responseInterbank.blob();
      const imageDataInterbank = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blobInterbank);
      });
      doc.addImage(imageDataInterbank, "PNG", margenIzq, yBanco + 30, 20, 10);
    } catch (error) {
      console.error("Error loading Interbank logo:", error);
    }

    doc.text("Interbank", margenIzq, yBanco + 45);
    doc.text("Cuenta corriente dólares:", margenIzq, yBanco + 50);
    doc.text("CTA: ---------------------------", margenIzq, yBanco + 55);
    doc.text("CCI: ---------------------------", margenIzq, yBanco + 60);
    doc.text("Titular: TEAMGAS S.A.C", margenIzq, yBanco + 65);

    // 🔹 Pie
    doc.setFontSize(8);
    doc.text("Gracias por su preferencia.", 105, 285, { align: "center" });

    // Código QR y texto
    try {
      const responseQR = await fetch(qrImage);
      const blobQR = await responseQR.blob();
      const imageDataQR = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blobQR);
      });
      doc.addImage(imageDataQR, "PNG", 92.5, pageHeight - 50, 25, 25);
    } catch (error) {
      console.error("Error loading QR:", error);
    }
    doc.setFontSize(7);
    doc.text("Escanea nuestro QR y visita nuestra página web", 105, pageHeight - 20, { align: "center" });
  }

  doc.save(`COTIZACION-${cliente.nombre}.pdf`);
};

export default generarReporteCotizacion;
