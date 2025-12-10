import html2pdf from 'html2pdf.js';

export const generarFactura = async (datosFactura) => {
  // Desestructurar los datos para fácil acceso
  const {
    logoUrl,
    empresa, // { nombre, ruc, direccion, telefono, email }
    factura, // { numero, fechaEmision, fechaVencimiento }
    cliente, // { nombre, ruc, direccion }
    items,   // [{ cantidad, unidad, descripcion, precioUnitario, total }]
    totales, // { subtotal, descuento, opGravada, igv, totalPagar }
  } = datosFactura;

  // Construir las filas de la tabla de items
  const itemsHtml = items.map(item => `
    <tr>
      <td>${item.cantidad}</td>
      <td>${item.unidad}</td>
      <td class="descripcion">${item.descripcion}</td>
      <td class="numero">${item.precioUnitario.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td class="numero">${item.total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
    </tr>
  `).join('');

  // Plantilla HTML de la factura
  const html = `
    <html>
      <head>
        <style>
          /* Aquí irían los estilos CSS para la factura */
          body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; font-size: 10px; }
          .container { padding: 20px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .empresa-info { text-align: left; }
          .factura-info { text-align: center; border: 2px solid #000; padding: 10px; }
          .factura-info h2 { margin: 0; font-size: 18px; }
          .factura-info p { margin: 0; font-size: 14px; }
          .cliente-info { margin-top: 20px; border: 1px solid #ccc; padding: 10px; border-radius: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .totales { margin-top: 20px; width: 40%; margin-left: 60%; }
          .totales table { width: 100%; }
          .totales td { border: none; }
          .totales .label { font-weight: bold; }
          .totales .monto-final { font-size: 14px; font-weight: bold; border-top: 2px solid #000; }
          .footer { margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 9px; }
          .descripcion { width: 50%; }
          .numero { text-align: right; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="empresa-info">
              ${logoUrl ? `<img src="${logoUrl}" style="max-width: 150px; margin-bottom: 10px;">` : ''}
              <p><strong>${empresa.nombre}</strong></p>
              <p>${empresa.direccion}</p>
              <p>Tel: ${empresa.telefono} | Email: ${empresa.email}</p>
            </div>
            <div class="factura-info">
              <h2>FACTURA</h2>
              <p>R.U.C. ${empresa.ruc}</p>
              <p>${factura.numero}</p>
            </div>
          </div>

          <div class="cliente-info">
            <p><strong>Señor(es):</strong> ${cliente.nombre}</p>
            <p><strong>R.U.C./DNI:</strong> ${cliente.ruc}</p>
            <p><strong>Dirección:</strong> ${cliente.direccion}</p>
            <p><strong>Fecha de Emisión:</strong> ${factura.fechaEmision}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Cant.</th>
                <th>Unidad</th>
                <th>Descripción</th>
                <th class="numero">P. Unit.</th>
                <th class="numero">Importe</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totales">
            <table>
              <tr><td class="label">Subtotal:</td><td class="numero">S/ ${totales.subtotal.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>
              <tr><td class="label">Descuento:</td><td class="numero">S/ ${totales.descuento.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>
              <tr><td class="label">Op. Gravada:</td><td class="numero">S/ ${totales.opGravada.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>
              <tr><td class="label">I.G.V. 18%:</td><td class="numero">S/ ${totales.igv.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>
              <tr class="monto-final"><td class="label">IMPORTE TOTAL:</td><td class="numero">S/ ${totales.totalPagar.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>
            </table>
          </div>

          <div class="footer">
            <p style="text-align: center; margin-top: 20px;">¡Gracias por su preferencia!</p>
          </div>
        </div>
      </body>
    </html>
  `;

  // Opciones para html2pdf
  const options = {
    margin: 0.5,
    filename: `Factura-${factura.numero}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  // Generar y descargar el PDF
  return html2pdf().from(html).set(options).save();
};