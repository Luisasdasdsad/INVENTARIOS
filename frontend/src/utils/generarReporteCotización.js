import html2pdf from "html2pdf.js";

// Función para convertir número a palabras en español
const numeroAPalabras = (num) => {
  const unidades = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
  const decenas = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
  const centenas = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];
  const miles = ["", "mil", "dos mil", "tres mil", "cuatro mil", "cinco mil", "seis mil", "siete mil", "ocho mil", "nueve mil"];

  if (num === 0) return "cero";
  if (num < 10) return unidades[num];
  if (num < 20) return ["diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"][num - 10];
  if (num < 100) {
    const d = Math.floor(num / 10);
    const u = num % 10;
    if (d === 2 && u > 0) return "veinti" + unidades[u];
    return decenas[d] + (u > 0 ? " y " + unidades[u] : "");
  }
  if (num < 1000) {
    const c = Math.floor(num / 100);
    const r = num % 100;
    if (num === 100) return "cien";
    return centenas[c] + (r > 0 ? " " + numeroAPalabras(r) : "");
  }
  if (num < 10000) {
    const m = Math.floor(num / 1000);
    const r = num % 1000;
    return miles[m] + (r > 0 ? " " + numeroAPalabras(r) : "");
  }
  if (num < 100000) {
    const dm = Math.floor(num / 1000);
    const r = num % 1000;
    return numeroAPalabras(dm) + " mil" + (r > 0 ? " " + numeroAPalabras(r) : "");
  }
  // Para números mayores a 99999
  return num.toString();
};

const generarReporteCotizacion = async (cotizacion) => {
  const {
    cliente,
    productos,
    subtotal,
    descuento,
    igv,
    total,
    fecha,
    moneda,
    numeroCotizacion,
    condicionPago,
    validez,
    observaciones,
    responsable,
  } = cotizacion;

  const element = document.createElement("div");
  element.innerHTML = `
    <div style="font-family: 'Arial', sans-serif; font-size: 12px; padding: 20px; border-radius: 12px; background: #fff; width: 210mm; height: 297mm; box-sizing: border-box; page-break-inside: avoid;">
      
      <!-- ENCABEZADO -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #ffc107; padding-bottom: 10px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center;">
          <img src="/fondocotizacion.png" alt="Logo" style="height: 70px;">
          <div style="margin-left: 15px;">
            <h3 style="margin: 0; color: #333; font-size: 16px;">TEAMGAS</h3>
            <p style="margin: 2px 0; font-size: 12px;">Email: teamgas.fulltec@gmail.com</p>
            <p style="margin: 2px 0; font-size: 12px;">Web: www.teamgas.pe</p>
          </div>
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0; color: #333;">COTIZACIÓN N° ${numeroCotizacion}</h2>
          <p style="margin: 0;">Fecha: ${fecha}</p>
        </div>
      </div>

      <!-- TÍTULO DE LA EMPRESA -->
      <div style="text-align: left; margin-bottom: 10px;">
        <h2 style="margin: 0 0 2px 0; color: #333; font-size: 16px; text-transform: uppercase;">Teamgas Sociedad Anónima Cerrada</h2>
        <p style="margin: 0; color: #444; font-size: 14px;">Jr. Coronel Guerra Nro. 152 (Plaza Principal) Junín - Chupaca - Chupaca</p>
      </div>

      <!-- INFORMACIÓN PRINCIPAL -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <div style="width: 48%; border: 2px solid #ffc107; border-radius: 8px; padding: 5px;">
          <h4 style="margin-top: 0; color: #444; text-align: center;"><Stong>Emisor</Strong></h4>
          <p><b>Razón Social:</b> TEAMGAS SOCIEDAD ANÓNIMA CERRADA</p>
          <p><b>RUC:</b> 20604956499</p>
          <p><b>EMAIL:</b> info@teamgas.pe</p>
          <p><b>Teléfono:</b> 997030802 - 919289085</p>
          <p><b>Responsable:</b> ${responsable || "N/A"}</p>
        </div>

        <div style="width: 48%; border: 2px solid #ffc107; border-radius: 8px; padding: 5px;">
          <h4 style="margin-top: 0; color: #444; text-align: center;"><Strong>Cliente</Strong></h4>
          <p><b>Nombre:</b> ${cliente.nombre}</p>
          <p><b>Documento:</b> ${cliente.documento}</p>
          <p><b>Dirección:</b> ${cliente.direccion}</p>
          <p><b>Teléfono:</b> ${cliente.telefono}</p>
        </div>
      </div>

      <!-- DATOS DE COTIZACIÓN -->
      <div style="border: 2px solid #ffc107; border-radius: 8px; padding: 2px; margin-bottom: 5px;">
        <h4 style="margin-top: 0; margin-bottom: 10p; color: #444;">Datos de Cotización</h4>
        <div style="display: flex; justify-content: space-between;">
          <div style="width: 48%;">
            <p style="margin: 4px 0;"><b>Condición de Pago:</b> ${condicionPago}</p>
            <p style="margin: 4px 0;"><b>Moneda:</b> ${moneda}</p>
          </div>
          <div style="width: 48%;">
            <p style="margin: 4px 0;"><b>Fecha de Emisión:</b> ${fecha}</p>
            <p style="margin: 4px 0;"><b>Validez de Oferta:</b> ${validez}</p>
            </div>
          </div>
      </div>

      <!-- TABLA DE PRODUCTOS -->
      <div style="margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 9px; border: 1px solid #ddd;">
          <thead>
            <tr style="background: #fff3cd; color: #333;">
              <th style="border: 2px solid #ffc107; padding: 3px 2px 13px 2px; text-align: center; vertical-align: middle; font-size: 11px; font-weight: bold;">N°</th>
              <th style="border: 2px solid #ffc107; padding: 3px 2px 13px 2px; text-align: center; vertical-align: middle; font-size: 11px; font-weight: bold;">CANT.</th>
              <th style="border: 2px solid #ffc107; padding: 3px 2px 13px 2px; text-align: center; vertical-align: middle; font-size: 11px; font-weight: bold;">UND</th>
              <th style="border: 2px solid #ffc107; padding: 3px 2px 13px 2px; text-align: center; vertical-align: middle; font-size: 11px; font-weight: bold;">DESCRIPCIÓN</th>
              <th style="border: 2px solid #ffc107; padding: 3px 2px 13px 2px; text-align: center; vertical-align: middle; font-size: 11px; font-weight: bold;">V. UNIT</th>
              <th style="border: 2px solid #ffc107; padding: 3px 2px 13px 2px; text-align: center; vertical-align: middle; font-size: 11px; font-weight: bold;">IGV</th>
              <th style="border: 2px solid #ffc107; padding: 3px 2px 13px 2px; text-align: center; vertical-align: middle; font-size: 11px; font-weight: bold;">P. UNIT</th>
              <th style="border: 2px solid #ffc107; padding: 3px 2px 13px 2px; text-align: center; vertical-align: middle; font-size: 11px; font-weight: bold;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${[...productos, ...Array(Math.max(0, 8 - productos.length)).fill(null)].map((p, index) => {
                if (p) {
                  const pUnit = isNaN(parseFloat(p.precioUnit)) ? 0 : parseFloat(p.precioUnit);          // Precio con IGV
                  const cantidad = isNaN(parseFloat(p.cantidad)) ? 0 : parseFloat(p.cantidad);
                  const igvUnit = pUnit * 0.18;        // IGV es el 18% del precio
                  const vUnit = pUnit - igvUnit;       // Valor sin IGV
                  const totalItem = cantidad * pUnit; // Total con IGV
                  // Para el cálculo: vUnit es el valor sin IGV
                  return `
                <tr>
                  <td style="border-right: 1px solid #ddd; padding: 2px; text-align: center;">${index + 1}</td>
                  <td style="border-right: 1px solid #ddd; padding: 2px; text-align: center;">${cantidad}</td>
                  <td style="border-right: 1px solid #ddd; padding: 2px; text-align: center;">UND</td>
                  <td style="border-right: 1px solid #ddd; padding: 6px; text-align: left; white-space: pre-line; line-height: 1.4;">${p.descripcion || ''}</td>
                  <td style="border-right: 1px solid #ddd; padding: 2px; text-align: center;">${vUnit.toFixed(2)}</td>
                  <td style="border-right: 1px solid #ddd; padding: 2px; text-align: center;">${igvUnit.toFixed(2)}</td>
                  <td style="border-right: 1px solid #ddd; padding: 2px; text-align: center;">${pUnit.toFixed(2)}</td>
                  <td style="border-right: 1px solid #ddd; padding: 2px; text-align: center;">${totalItem.toFixed(2)}</td>
                </tr>`;
                } else {
                  return `
                <tr>
                  <td style="border-right: 1px solid #ddd; padding: 2px; text-align: center;">&nbsp;</td>
                  <td style="border-right: 1px solid #ddd; padding: 2px; text-align: center;">&nbsp;</td>
                  <td style="border-right: 1px solid #ddd; padding: 2px; text-align: center;">&nbsp;</td>
                  <td style="border-right: 1px solid #ddd; padding: 2px; text-align: left;">&nbsp;</td>
                  <td style="border-right: 1px solid #ddd; padding: 2px; text-align: center;">&nbsp;</td>
                  <td style="border-right: 1px solid #ddd; padding: 2px; text-align: center;">&nbsp;</td>
                  <td style="border-right: 1px solid #ddd; padding: 2px; text-align: center;">&nbsp;</td>
                  <td style="border-right: 1px solid #ddd; padding: 2px; text-align: center;">&nbsp;</td>
                </tr>`;
                }
              }).join("")}
          </tbody>
        </table>
      </div>

      <!-- TOTAL EN LETRAS -->
      <div style="border: 1px solid #ffc107; padding: 5px; margin-bottom: 10px; width: 100%;">
        <p style="margin: 0; text-transform: uppercase;">SON: ${numeroAPalabras(Math.floor(parseFloat(total) || 0)).toUpperCase()} ${moneda.toUpperCase()}</p>
      </div>

      <!-- OBSERVACIONES -->
      <div style="border: 1px solid #ffc107; padding: 5px; margin-bottom: 10px; width: 100%;">
        <p style="margin: 0; color: #444;">Observaciones: ${observaciones || "Ninguna"}</p>
      </div>

      <!-- TOTALES Y CUENTAS BANCARIAS -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <div style="width: 30%; border: 1px solid #ffc107; padding: 8px; font-size: 9px;">
          <div style="margin-bottom: 8px;">
            <p style="margin: 0 0 4px 0; font-weight: bold; color: #002A8D; font-size: 11px;">Banco de Crédito del Perú</p>
            <p style="margin: 2px 0;"><b>CTA:</b> 191-1234567-0-00</p>
            <p style="margin: 2px 0;"><b>CCI:</b> 00219100123456789000</p>
          </div>
          <div>
            <p style="margin: 0 0 4px 0; font-weight: bold; color: #00A651; font-size: 11px;">Interbank</p>
            <p style="margin: 2px 0;"><b>Cuenta corriente en dólares:</b> 123-45678901</p>
            <p style="margin: 2px 0;"><b>Titular:</b> TEAM GAS SAC</p>
          </div>
        </div>

        <!-- CÓDIGO QR -->
        <div style="width: 30%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <img src="/QRPagina.png" alt="QR TEAMGAS" style="width: 120px; height: 120px;">
          <p style="margin: 5px 0 0 0; font-size: 10px; text-align: center;">Escanea para visitar nuestra web</p>
        </div>

        <div style="width: 30%;">
          <table style="border-collapse: collapse; width: 100%;">
            <tr><td style="padding: 4px;">Subtotal</td><td style="text-align: right; padding-left: 15px;">${(parseFloat(subtotal) || 0).toFixed(2)}</td></tr>
            <tr><td style="padding: 4px;">Descuento</td><td style="text-align: right; padding-left: 15px;">-${(parseFloat(descuento) || 0).toFixed(2)}</td></tr>
            <tr><td style="padding: 4px;">IGV (18%)</td><td style="text-align: right; padding-left: 15px;">${(parseFloat(igv) || 0).toFixed(2)}</td></tr>
            <tr style="background: #fff3cd; font-weight: bold;"><td style="padding: 4px;">TOTAL</td><td style="text-align: right; padding-left: 15px;">${(parseFloat(total) || 0).toFixed(2)}</td></tr>
          </table>
        </div>
      </div>

      <!-- PIE -->
      <div style="border-top: 3px solid #ffc107; padding-top: 10px; text-align: center; font-size: 12px; color: #666;">
        <p>Gracias por su preferencia</p>
      </div>
    </div>
  `;

  // === Generar PDF ===
  const opt = {
    margin: 0,
    filename: `COTIZACION_${numeroCotizacion}.pdf`,
    image: { type: "jpeg", quality: 1 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: 'avoid-all', before: '.pagebreak', after: '.pagebreak', avoid: '.no-break' },
  };

  html2pdf().set(opt).from(element).save();
};

export default generarReporteCotizacion;
