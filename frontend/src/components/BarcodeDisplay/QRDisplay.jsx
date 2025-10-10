import { useState } from 'react';
import { FaQrcode } from 'react-icons/fa';
import api from '../../services/api';  // ← Ajusta path si tu api.js está en otro lugar (ej. '../../services/api')

const QRDisplay = ({ 
  qrCode, 
  showActions = true,    // ← PROP: Muestra botón download (false en modal "ver")
  className = "" 
}) => {
  const [imageError, setImageError] = useState(false);

  // ← Download: Crea link a backend PNG
  const handleDownload = () => {
    if (qrCode) {
      const link = document.createElement('a');
      link.href = `${api.defaults.baseURL}/barcode/imagen-qr/${qrCode}`;
      link.download = `qr-${qrCode}.png`;
      link.click();
      console.log('📥 Descargando QR:', qrCode);
    }
  };

  // ← Error Handler: Oculta img + set error (muestra placeholder)
  const handleImageError = (e) => {
    console.log(`❌ Error cargando QR imagen: ${e.target.src} (404 o backend fail)`);
    setImageError(true);
    e.target.style.display = 'none';
  };

  // ← Placeholder si no qrCode o error
  if (!qrCode || imageError) {
    return (
      <div className={`text-center p-4 border-2 border-dashed border-gray-300 rounded-lg ${className}`}>
        <FaQrcode size={24} className="mx-auto mb-2 text-gray-400" />
        <p className="text-gray-500">
          {qrCode ? 'Imagen QR no disponible (verifica backend)' : 'No hay código QR generado'}
        </p>
        {qrCode && !imageError && (  // ← Solo si tiene qrCode pero error en img
          <button
            onClick={() => setImageError(false)}  // ← Reintenta (opcional)
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            Reintentar
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`qr-display ${className}`}>
      <div className="text-center space-y-4">  {/* ← space-y-4: Espacio vertical anti-overlap */}
        <div className="mx-auto">  {/* ← Centrado simple */}
          <img
            src={`${api.defaults.baseURL}/barcode/imagen-qr/${qrCode}`}  // ← Backend PNG
            alt="Código QR"
            className="border rounded-lg bg-white block mx-auto max-w-xs h-auto shadow-md max-h-40"  // ← max-w-sm (384px), auto height, shadow para visual
            onLoad={() => console.log('✅ QR imagen cargada OK para:', qrCode)}  // ← Log éxito
            onError={handleImageError}  // ← Maneja error
          />
        </div>
        {/* ← Texto Código: Siempre visible abajo */}
        <p className="text-sm font-mono bg-blue-100 px-3 py-1 rounded inline-block">
          {qrCode}
        </p>
        {/* ← Botón Download: Solo si showActions=true */}
        {showActions && (
          <div className="flex justify-center mt-3">  {/* ← mt-3 espacio */}
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
            >
              📥 Descargar QR
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRDisplay;