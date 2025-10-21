import { useState } from 'react';
import { FaQrcode } from 'react-icons/fa';
import api from '../../services/api'; // ← Ajusta path si tu api.js está en otra carpeta

/**
 * Componente QRDisplay
 * 
 * Props:
 * - qrCode: código QR del producto o herramienta
 * - entity: "productos" | "barcode" (determina la ruta del backend)
 * - showActions: muestra botón de descarga (default: true)
 * - className: clases CSS adicionales opcionales
 */
const QRDisplay = ({
  qrCode,
  entity = "barcode",   // ← Default para productos
  showActions = true,
  className = "",
}) => {
  const [imageError, setImageError] = useState(false);

  // 🔹 URL base según tipo de entidad
  const qrURL = `${api.defaults.baseURL}/qr/imagen/${qrCode}`;

  // 🔹 Descargar imagen QR desde backend
  const handleDownload = () => {
    if (qrCode) {
      const link = document.createElement('a');
      link.href = qrURL;
      link.download = `qr-${qrCode}.png`;
      link.click();
      console.log('📥 Descargando QR:', qrCode);
    }
  };

  // 🔹 Manejar error al cargar imagen
  const handleImageError = (e) => {
    console.warn(`❌ Error cargando QR imagen: ${e.target.src} (404 o backend fail)`);
    setImageError(true);
    e.target.style.display = 'none';
  };

  // 🔹 Placeholder si no hay QR o hay error
  if (!qrCode || imageError) {
    return (
      <div className={`text-center p-4 border-2 border-dashed border-gray-300 rounded-lg ${className}`}>
        <FaQrcode size={24} className="mx-auto mb-2 text-gray-400" />
        <p className="text-gray-500">
          {qrCode
            ? 'Imagen QR no disponible (verifica backend)'
            : 'No hay código QR generado'}
        </p>
        {qrCode && (
          <button
            onClick={() => setImageError(false)}  // ← Reintenta cargar
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            Reintentar
          </button>
        )}
      </div>
    );
  }

  // 🔹 Vista normal si carga correctamente
  return (
    <div className={`qr-display ${className}`}>
      <div className="text-center space-y-4">
        <div className="mx-auto">
          <img
            src={qrURL}
            alt="Código QR"
            className="border rounded-lg bg-white block mx-auto max-w-xs h-auto shadow-md max-h-40"
            onLoad={() => console.log('✅ QR imagen cargada OK para:', qrCode)}
            onError={handleImageError}
          />
        </div>

        <p className="text-sm font-mono bg-blue-100 px-3 py-1 rounded inline-block">
          {qrCode}
        </p>

        {showActions && (
          <div className="flex justify-center mt-3">
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
