import { toast } from 'react-hot-toast';
import html2pdf from 'html2pdf.js';

export const generarReporteCompras = (compra) => {
  // Solo mostramos precios si la compra NO está pendiente (es decir, ya fue cotizada, aprobada, etc.)
  const mostrarPrecios = compra.estado !== 'pendiente';

  const totalGeneral = compra.items.reduce((acc, item) => acc + (item.cantidad * (item.precioUnitario || 0)), 0);

  const itemsHtml = compra.items.map((item, index) => {
    const totalItem = (item.cantidad * (item.precioUnitario || 0));
    return `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 8px; text-align: center; border-bottom: 1px solid #eee;">${index + 1}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">
        <strong>${item.nombre}</strong><br/>
        <span style="font-size: 12px; color: #666;">${item.descripcion || ''}</span>
      </td>
      <td style="padding: 8px; text-align: center; border-bottom: 1px solid #eee;">${item.cantidad}</td>
      <td style="padding: 8px; text-align: center; border-bottom: 1px solid #eee;">${item.unidad}</td>
      ${mostrarPrecios ? `
        <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">S/ ${(item.precioUnitario || 0).toFixed(2)}</td>
        <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">S/ ${totalItem.toFixed(2)}</td>
      ` : ''}
    </tr>
  `}).join('');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; background: white;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #ea580c; padding-bottom: 10px;">
        <div>
          <h1 style="margin: 0; font-size: 24px; color: #333;">Requerimiento de Compra</h1>
          <div style="margin-top: 5px; font-size: 14px;"><strong>Código:</strong> ${compra.codigo}</div>
          <div style="font-size: 14px;"><strong>Fecha:</strong> ${new Date(compra.createdAt).toLocaleDateString()}</div>
        </div>
        <div style="text-align: right;">
          <h3 style="margin: 0; font-size: 18px;">${compra.nombreObra}</h3>
          <p style="margin: 5px 0 0; color: #666; font-size: 14px;">${compra.asunto}</p>
        </div>
      </div>

      <div style="margin-bottom: 15px; font-size: 14px;">
        <strong>Solicitante:</strong> ${compra.solicitante?.nombre || 'N/A'}
      </div>
      
      ${compra.comentarios ? `<div style="margin-bottom: 15px; font-size: 14px; background: #f9f9f9; padding: 10px; border-left: 3px solid #ccc;"><strong>Nota:</strong> ${compra.comentarios}</div>` : ''}

      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd; width: 40px;">#</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Descripción</th>
            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd; width: 60px;">Cant.</th>
            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd; width: 60px;">Unid.</th>
            ${mostrarPrecios ? `
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd; width: 80px;">P. Unit.</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd; width: 80px;">Total</th>
            ` : ''}
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      ${mostrarPrecios ? `
      <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
        <table style="width: 250px; border-collapse: collapse; font-size: 14px;">
            <tr style="background-color: #f5f5f5; font-weight: bold;">
                <td style="padding: 10px; border-top: 2px solid #ea580c; text-align: right;">TOTAL:</td>
                <td style="padding: 10px; border-top: 2px solid #ea580c; text-align: right;">S/ ${totalGeneral.toFixed(2)}</td>
            </tr>
        </table>
      </div>
      ` : ''}
    </div>
  `;

  const element = document.createElement('div');
  element.innerHTML = htmlContent;

  const opt = {
    margin:       0.5,
    filename:     `Requerimiento_${compra.codigo}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, logging: false },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  toast.promise(html2pdf().set(opt).from(element).save(), { loading: 'Generando PDF...', success: 'PDF descargado', error: 'Error al generar PDF' });
};