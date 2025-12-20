import { useState, useRef, useEffect } from 'react';
import api from '../../services/api';
import { FaCamera, FaFileUpload, FaTrash, FaTimes, FaBolt } from 'react-icons/fa';

export default function PhotoCapture({ onCapture, currentPhoto, fileNamePrefix = "captura" }) {
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  // Manejar el stream de video al abrir/cerrar cámara
  useEffect(() => {
    if (showCamera && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.error("Error play video:", e));
    }
  }, [showCamera, stream]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Intenta usar cámara trasera en móviles
      });
      setStream(newStream);
      setShowCamera(true);
      setError('');

      // Detectar soporte de Flash/Linterna
      const track = newStream.getVideoTracks()[0];
      if (track && track.getCapabilities) {
        const capabilities = track.getCapabilities();
        if (capabilities.torch) {
          setTorchSupported(true);
        }
      }
    } catch (err) {
      setError('No se pudo acceder a la cámara. Verifique permisos.');
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      // Apagar flash si está encendido antes de detener para evitar errores
      if (torchOn) {
        const track = stream.getVideoTracks()[0];
        if (track) {
           track.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
        }
      }
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
    setTorchOn(false);
    setTorchSupported(false);
  };

  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchOn }]
      });
      setTorchOn(!torchOn);
    } catch (err) {
      console.error("Error al alternar flash:", err);
    }
  };

  const uploadFile = async (file) => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    
    // Renombrar el archivo usando el prefijo para mantener consistencia en el backend
    const ext = file.name.split('.').pop();
    const fileName = `${fileNamePrefix}-${Date.now()}.${ext}`;
    formData.append('foto', file, fileName);

    try {
      const res = await api.post('/fotos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onCapture(res.data.foto); // Enviamos la URL al padre
      stopCamera(); // Si estaba la cámara abierta, la cerramos
      setError('');
    } catch (err) {
      setError('Error al subir imagen: ' + (err.response?.data?.msg || err.message));
    } finally {
      setLoading(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob(blob => {
      if (blob) {
        const file = new File([blob], `${fileNamePrefix}-${Date.now()}.jpg`, { type: "image/jpeg" });
        uploadFile(file);
      }
    }, 'image/jpeg', 0.8);
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <h3 className="text-lg font-semibold mb-3">Evidencia / Foto (Opcional)</h3>
      <canvas ref={canvasRef} className="hidden" />
      
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

      {/* Vista Previa si ya hay foto */}
      {currentPhoto && !showCamera ? (
        <div className="text-center">
          <img src={currentPhoto} alt="Evidencia" className="max-w-xs mx-auto rounded border shadow-sm mb-2 max-h-48 object-contain" />
          <button 
            type="button" 
            onClick={() => onCapture('')} 
            className="text-red-600 hover:text-red-800 text-sm flex items-center justify-center gap-1 mx-auto"
          >
            <FaTrash size={12} /> Eliminar foto
          </button>
        </div>
      ) : (
        /* Botones de acción o Vista de Cámara */
        !showCamera ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={startCamera} disabled={loading} className="flex-1 bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 flex items-center justify-center gap-2">
              <FaCamera /> Usar Cámara
            </button>
            <label className={`flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 flex items-center justify-center gap-2 cursor-pointer ${loading ? 'opacity-50' : ''}`}>
              <FaFileUpload /> {loading ? 'Subiendo...' : 'Subir Archivo'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadFile(e.target.files[0])} disabled={loading} />
            </label>
          </div>
        ) : (
          <div className="text-center">
            <div className="relative bg-black rounded overflow-hidden mb-3">
              <video ref={videoRef} autoPlay muted playsInline className="w-full max-h-[300px] object-contain" />
              
              {torchSupported && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`absolute top-2 right-2 p-3 rounded-full shadow-md transition-colors z-10 ${
                    torchOn ? 'bg-yellow-400 text-black' : 'bg-black/40 text-white hover:bg-black/60'
                  }`}
                  title="Alternar Flash"
                >
                  <FaBolt size={18} />
                </button>
              )}
            </div>
            <div className="flex justify-center gap-3">
              <button type="button" onClick={capturePhoto} disabled={loading} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 flex items-center gap-2">
                <FaCamera /> {loading ? 'Guardando...' : 'Capturar'}
              </button>
              <button type="button" onClick={stopCamera} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2">
                <FaTimes /> Cancelar
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
