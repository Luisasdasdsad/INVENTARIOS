import html2pdf from 'html2pdf.js';
import { toast } from 'react-hot-toast';

export const generarReporteGeneralCompras = (compras, fechaInicio, fechaFin) => {
  let granTotal = 0;

  const tableRows = compras.map(compra => {
    const fecha = new Date(compra.createdAt).toLocaleDateString();
    const totalCompra = compra.items.reduce((acc, item) => {
      return acc + (item.cantidad * (item.precioUnitario || 0));
    }, 0);
    granTotal += totalCompra;

    return `
      <tr>
        <td>${fecha}</td>
        <td>${compra.codigo || '-'}</td>
        <td>${compra.nombreObra || 'Sin nombre'}</td>
        <td>${compra.proveedorNombre || 'No asignado'}</td>
        <td>${compra.solicitante?.nombre || 'N/A'}</td>
        <td class="total">S/ ${totalCompra.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; font-size: 9px; color: #333; }
          .container { padding: 20px; }
          h1 { font-size: 16px; color: #111; text-align: center; margin-bottom: 10px; }
          .info { font-size: 10px; text-align: center; color: #555; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 4px; text-align: left; word-break: break-word; }
          th { background-color: #16a34a; color: white; font-size: 9px; }
          .total { text-align: right; font-weight: bold; }
          .grand-total-row { background-color: #f0fdf4; font-weight: bold; }
          .grand-total-row td { font-size: 11px; padding: 8px; border-top: 2px solid #16a34a; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Reporte General de Compras Aprobadas</h1>
          <div class="info">
            Periodo: ${fechaInicio} al ${fechaFin} | Fecha de emisión: ${new Date().toLocaleDateString()}
          </div>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Código</th>
                <th>Obra/Proyecto</th>
                <th>Proveedor</th>
                <th>Solicitante</th>
                <th class="total">Total</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              <tr class="grand-total-row">
                <td colspan="5" class="total">TOTAL DEL PERIODO:</td>
                <td class="total">S/ ${granTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </body>
    </html>
  `;

  const element = document.createElement('div');
  element.innerHTML = htmlContent;

  const opt = {
    margin: 0.5,
    filename: `Reporte_Compras_${fechaInicio}_${fechaFin}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  toast.promise(
    html2pdf().set(opt).from(element).save(),
    {
      loading: 'Generando reporte PDF...',
      success: 'Reporte descargado.',
      error: 'Error al generar el reporte.'
    }
  );
};
