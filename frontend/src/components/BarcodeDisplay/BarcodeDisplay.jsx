import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

const BarcodeDisplay = ({ value, width = 2, height = 60, displayValue = true, className = "" }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (value && canvasRef.current) {
      try {
        JsBarcode(canvasRef.current, value, {
          format: "CODE128",
          width: width,
          height: height,
          displayValue: displayValue,
          fontSize: 12,
          textMargin: 5,
          margin: 10
        });
      } catch (error) {
        console.error('Error generando código de barras:', error);
      }
    }
  }, [value, width, height, displayValue]);

  const handlePrint = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const dataURL = canvas.toDataURL('image/png');
      
      // Crear ventana de impresión
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Código de Barras - ${value}</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
                font-family: Arial, sans-serif;
              }
              .barcode-container {
                text-align: center;
                margin: 20px;
                padding: 20px;
                border: 1px solid #ccc;
                border-radius: 8px;
              }
              .barcode-info {
                margin-top: 10px;
                font-size: 12px;
                color: #666;
              }
              @media print {
                body { margin: 0; padding: 10px; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="barcode-container">
              <img src="${dataURL}" alt="Código de barras" />
              <div class="barcode-info">
                <p><strong>Código:</strong> ${value}</p>
                <p><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <button class="no-print" onclick="window.print(); window.close();" 
                    style="margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Imprimir
            </button>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleDownload = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const link = document.createElement('a');
      link.download = `barcode-${value}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  if (!value) {
    return (
      <div className={`text-center p-4 border-2 border-dashed border-gray-300 rounded-lg ${className}`}>
        <p className="text-gray-500">No hay código de barras generado</p>
      </div>
    );
  }

  return (
    <div className={`barcode-display ${className}`}>
      <div className="text-center">
        <canvas ref={canvasRef} className="border rounded-lg bg-white p-2"></canvas>
        <div className="mt-3 flex justify-center space-x-2">
          <button
            onClick={handlePrint}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            🖨️ Imprimir
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
          >
            📥 Descargar
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2">Código: {value}</p>
      </div>
    </div>
  );
};

export default BarcodeDisplay;
