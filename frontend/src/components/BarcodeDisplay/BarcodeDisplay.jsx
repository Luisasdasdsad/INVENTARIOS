import { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { FaBarcode } from 'react-icons/fa';

const BarcodeDisplay = ({ 
  value, 
  width = 2, 
  height = 60, 
  displayValue = false,  // ← DEFAULT: false (evita doble texto – usa <p> externo si quieres)
  showActions = true,    // ← NUEVO PROP: Muestra print/download (false en modal "ver")
  className = "" 
}) => {
  const canvasRef = useRef(null);
  const [canvasError, setCanvasError] = useState(false);

  useEffect(() => {
    setCanvasError(false);
    if (value && canvasRef.current && !canvasError) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);  // Limpia

      try {
        JsBarcode(canvas, value, {
          format: "CODE128",
          width: width,
          height: height,
          displayValue: false,  // Solo si true (raro – mejor false + <p> externo)
          fontSize: 12,
          textMargin: 5,
          margin: 10,
          background: '#FFFFFF',
          lineColor: '#000000'
        });
        console.log('✅ Barcode canvas generado OK para:', value);
      } catch (error) {
        console.error('❌ Error generando barcode:', error);
        setCanvasError(true);
      }
    }
  }, [width, height, displayValue]);

  // ← Funciones Print/Download (tu código original – simplificado)
  const handlePrint = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const dataURL = canvas.toDataURL('image/png');
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html><head><title>Barcode - ${value}</title>
        <style>body { margin: 0; padding: 20px; text-align: center; font-family: Arial; }
        img { max-width: 100%; } </style></head>
        <body><img src="${dataURL}" /><p><strong>Código:</strong> ${value}</p>
        <button onclick="window.print(); window.close();" style="margin-top: 20px; padding: 10px; background: #007bff; color: white; border: none; border-radius: 4px;">Imprimir</button>
        </body></html>
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

  if (!value || canvasError) {
    return (
      <div className={`text-center p-4 border-2 border-dashed border-gray-300 rounded-lg ${className}`}>
        <FaBarcode size={24} className="mx-auto mb-2 text-gray-400" />
        <p className="text-gray-500">Error/No código de barras</p>
      </div>
    );
  }

  return (
    <div className={`barcode-display ${className}`}>
      <div className="text-center space-y-4">  {/* ← space-y-4: Más espacio vertical (anti-overlap) */}
        <div className="mx-auto">  {/* ← mx-auto simple para center */}
          <canvas 
            ref={canvasRef} 
            width={width * 150}  // ← Ajustado: Más ancho (300px para width=2) – visible en modal
            height={height} 
            className="border rounded-lg bg-white block"  // ← block para no inline overlap
            style={{ maxWidth: '100%', height: 'auto' }}  // ← Escala si container pequeño
          />
        </div>
        {/* ← Texto Externo: Siempre visible (no depende de displayValue) */}
        <p className="text-sm font-mono bg-gray-100 px-3 py-1 rounded inline-block">
          {value}
        </p>
        {/* ← Botones: Solo si showActions=true */}
        {showActions && (
          <div className="flex justify-center space-x-2 mt-3">  {/* ← mt-3 más espacio */}
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
        )}
      </div>
    </div>
  );
};

export default BarcodeDisplay;