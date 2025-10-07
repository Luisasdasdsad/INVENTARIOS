import { useState, useEffect, useRef } from 'react';
import api from '../../services/api.js';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import BarcodeScanner from '../../components/BarcodeScanner/BarcodeScanner';

export default function RegistrarMovimientoPage() {
  const [searchParams] = useSearchParams();
  const tipoInicial = searchParams.get('tipo') || 'entrada';

  const [herramientas, setHerramientas] = useState([]);
  const [formData, setFormData] = useState({
    herramienta: '',
    barcode: '',
    tipo: tipoInicial,
    cantidad: '',
    nota: '',
    nombreUsuario: '',
    obra: '',
    foto: ''
  });

  // Estados para captura de foto
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null); // Preview de la foto
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null); // NUEVO: Estado para guardar el stream

  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedHerramienta, setSelectedHerramienta] = useState(null);
  const [isScanning, setIsScanning] = useState(true); // Controla si el scanner está activo

  const navigate = useNavigate();
  const { user } = useAuth();

  // useEffect para cargar herramientas al inicio
  useEffect(() => {
    api.get('/herramientas')
      .then(res => setHerramientas(res.data))
      .catch(() => setError('Error al cargar herramientas'));
  }, []);

  // NUEVO useEffect: Para asignar el stream al elemento <video> una vez que se renderiza
  useEffect(() => {
    console.log('🔍 useEffect de cámara disparado - showCamera:', showCamera, 'cameraStream:', !!cameraStream, 'videoRef.current:', !!videoRef.current);

    if (showCamera && cameraStream && videoRef.current) {
      console.log('🎥 Asignando stream al video después del render...');
      
      const video = videoRef.current;
      video.srcObject = cameraStream;
      
      // Event listeners para confirmar carga y debug
      const handleLoadedMetadata = () => {
        console.log('📹 loadedmetadata: Width:', video.videoWidth, 'Height:', video.videoHeight);
      };
      const handleCanPlay = () => {
        console.log('🎬 canplay: Video listo para reproducir');
      };
      const handleVideoError = (e) => {
        console.error('❌ Error en video element:', e);
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
      video.addEventListener('canplay', handleCanPlay, { once: true });
      video.addEventListener('error', handleVideoError, { once: true });

      // Fuerza play
      video.muted = true;
      video.play()
        .then(() => {
          console.log('▶️ Video reproduciéndose exitosamente');
        })
        .catch((err) => {
          console.error('❌ Error en video.play():', err);
        });

      // Cleanup: Detener tracks y remover listeners cuando el componente se desmonte o el stream cambie
      return () => {
        console.log('🧹 Limpiando listeners y tracks del video...');
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleVideoError);
        if (video.srcObject) {
          video.srcObject.getTracks().forEach(track => track.stop());
          video.srcObject = null;
        }
      };
    } else if (showCamera && !cameraStream) {
      console.log('⏳ useEffect esperando: showCamera es true, pero cameraStream aún no está disponible.');
    } else if (showCamera && cameraStream && !videoRef.current) {
      console.log('⏳ useEffect esperando: showCamera y cameraStream están listos, pero videoRef.current es null (video no renderizado aún).');
    } else {
      console.log('⏳ useEffect esperando: showCamera es false o cameraStream es null.');
    }
  }, [showCamera, cameraStream]); // Dependencias: se ejecuta cuando showCamera o cameraStream cambian

  // Función para iniciar la cámara
  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { // CORREGIDO: getUserMedia sin espacio
        throw new Error('getUserMedia no está soportado en este navegador.');
      }
      console.log('🔄 Iniciando cámara...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',  // Cámara frontal para laptops
          width: { min: 320, max: 640 },  
          height: { min: 240, max: 480 }
        } 
      });
      console.log('✅ Stream obtenido exitosamente');
      // Guardamos el stream en estado temporal; el useEffect lo asignará al video
      setCameraStream(stream);
      setShowCamera(true);  // Esto triggera el render del <video>
      setError('');
      console.log('📹 Stream guardado, esperando render del video...');
    } catch (err) {
      console.error('Error cámara:', err);
      setError('Error al acceder a la cámara: ' + err.message + '. Verifica permisos y navegador.');
      setCameraStream(null);
    }
  };
   
  // Función para detener la cámara
  const stopCamera = () => {
    console.log('🛑 Deteniendo cámara...');
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null; // Limpiar srcObject del video
    }
    setShowCamera(false);
    setCameraStream(null); // Limpiar el estado del stream
    setCapturedImage(null); // Limpiar preview de la foto
    setError(''); // Limpiar errores
    console.log('⏹️ Cámara detenida y stream limpiado');
  };

  // Función para capturar foto y subirla
  const capturePhoto = async () => {
    if (!videoRef.current) {
      setError('Elemento de video no encontrado.');
      return;
    }

    const video = videoRef.current;
    console.log('🔄 Intentando capturar - Video width inicial:', video.videoWidth, 'Height:', video.videoHeight);

    // Esperar hasta que el video tenga frames (máximo 5 segundos)
    const waitForVideoReady = () => {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // ~5 segundos (100ms x 50)

        const checkVideo = () => {
          attempts++;
          console.log(`⏳ Esperando frames... Intento ${attempts}, Width: ${video.videoWidth}`);

          if (video.videoWidth > 0 && video.videoHeight > 0) {
            console.log('✅ Video listo para capturar!');
            resolve();
          } else if (attempts >= maxAttempts) {
            reject(new Error('El video no se cargó a tiempo. Intenta de nuevo o verifica la cámara.'));
          } else {
            setTimeout(checkVideo, 100); // Revisa cada 100ms
          }
        };

        // Listener para cuando el video cargue datos (por si acaso)
        video.addEventListener('loadeddata', () => {
          console.log('🎥 Evento loadeddata disparado');
          if (video.videoWidth > 0) resolve();
        }, { once: true });

        checkVideo(); // Inicia la espera
      });
    };

    try {
      setError(''); // Limpia errores previos
      await waitForVideoReady(); // Espera aquí hasta que esté listo

      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error('Canvas no encontrado.');
      }

      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      console.log('🖼️ Imagen dibujada en canvas');

      // Convertir a Blob y subir
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setError('No se pudo crear el blob de la imagen.');
          return;
        }

        setLoading(true);
        try {
          const formDataUpload = new FormData();
          formDataUpload.append('foto', blob, `movimiento-foto-${Date.now()}.jpg`);

          console.log('📤 Subiendo foto al backend...');
          const response = await api.post('/fotos', formDataUpload, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          const fotoUrl = response.data.foto;
          setFormData(prev => ({ ...prev, foto: fotoUrl })); // Actualiza formData
          setCapturedImage(URL.createObjectURL(blob)); // Preview local temporal
          setError('');
          alert('Foto capturada y subida exitosamente');
        } catch (err) {
          setError('Error al subir la foto: ' + (err.response?.data?.msg || err.message));
          console.error('Error upload:', err);
        } finally {
          setLoading(false);
        }
      }, 'image/jpeg', 0.8); // Calidad 80%

      // stopCamera(); // Cierra cámara después de capturar (opcional, puedes dejarla abierta)
    } catch (err) {
      console.error('Error en captura:', err);
      setError(err.message || 'Cámara no lista. Intenta de nuevo.');
    }
  };

  const fetchHerramientaByBarcode = async (barcode) => {
  setLoading(true);
  setError('');  // Limpia error previo
  
  try {
    const url = `http://localhost:5000/api/barcode/buscar/${barcode.toUpperCase()}`;
    console.log('🔍 Iniciando fetch a (full URL):', url);
    
    const response = await fetch(url);
    
    console.log('📡 Response status:', response.status);  // 200 OK
    console.log('📡 Content-Type:', response.headers.get('content-type'));  // application/json
    
    if (!response.ok) {
      // Maneja error sin crashear en JSON
      let errorData = {};
      try {
        errorData = await response.json();
      } catch (jsonErr) {
        console.warn('No JSON en error response:', jsonErr);
      }
      throw new Error(errorData.error || `Error ${response.status}: Herramienta no encontrada`);
    }
    
    // ← DIRECTO A JSON: Sin responseText o previews
    const herramienta = await response.json();
    
    // ← NO DEBUGS: Quita cualquier console.log con responseText aquí
    // Ejemplo de lo que BORRAS: console.log('📄 Response text preview:', responseText);  // ELIMINADO
    
    console.log('✅ Herramienta JSON recibida:', herramienta.nombre);  // Log simple (opcional)
    
    // Setea form y state (éxito)
    setSelectedHerramienta(herramienta);
    setFormData(prev => ({
      ...prev,
      herramienta: herramienta._id,  // Para select/dropdown
      barcode: barcode.toUpperCase()  // Muestra en input
    }));
    
    console.log('✅ Form actualizado con herramienta:', herramienta.nombre);  // Confirma set
    
    // Alert de éxito
    alert(`✅ Cargada: ${herramienta.nombre} - Stock: ${herramienta.cantidad}`);
    
  } catch (err) {
    console.error('❌ Error al buscar herramienta:', err.message);
    setError(err.message);  // Muestra en UI (ej. "No encontrada")
    setSelectedHerramienta(null);
    setFormData(prev => ({ 
      ...prev, 
      herramienta: '', 
      barcode: barcode.toUpperCase()  // Mantiene barcode si error
    }));
  } finally {
    setLoading(false);
    // Opcional: setIsScanning(true);  // Re-activa scanner si quieres auto
  }
};
    
    // Alert de éxito


  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    setFieldErrors(prev => ({ ...prev, [name]: '' }));

    if (name === 'herramienta' && value) {
      setFormData(prev => ({ ...prev, barcode: '' }));
      const herramienta = herramientas.find(h => h._id === value);
      setSelectedHerramienta(herramienta);
    }
  };

  const handleBarcodeDetected = (barcode) => {
  if (!isScanning) {
    console.log('⏸️ Bloqueado en parent');
    return;
  }
  console.log('🔄 Parent procesando:', barcode);
  setIsScanning(false);  // ← PASA A FALSE → Scanner se detiene via isActive
  fetchHerramientaByBarcode(barcode);
};

  const handleBarcodeManualChange = e => {
    const barcode = e.target.value.toUpperCase();
    setFormData(prev => ({ ...prev, barcode }));

    if (barcode.length === 8 && /^[A-F0-9]{8}$/i.test(barcode)) {
      fetchHerramientaByBarcode(barcode);
    } else if (barcode.length > 0) {
      setError('Código debe ser 8 caracteres hexadecimales (A-F,0-9)');
      setSelectedHerramienta(null);
      setFormData(prev => ({ ...prev, herramienta: '' }));
    } else {
      setError('');
      setSelectedHerramienta(null);
      setFormData(prev => ({ ...prev, herramienta: '' }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    if (!formData.herramienta && !formData.barcode) {
      setError('Debe seleccionar una herramienta o escanear un código de barras');
      setLoading(false);
      return;
    }
    if (formData.cantidad <= 0) {
      setError('La cantidad debe ser mayor que cero');
      setLoading(false);
      return;
    }
    if (!formData.nombreUsuario) {
      setError('Debe seleccionar un usuario');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        cantidad: Number(formData.cantidad),
      };
      
      if (formData.barcode) {
        payload.barcode = formData.barcode;
        delete payload.herramienta;
      }
      
      console.log('Payload enviado a /movimientos:', payload);
      await api.post('/movimientos', payload);
      alert('Movimiento registrado con éxito');
      navigate('/movimientos');
    } catch (err) {
      setError(err.response?.data?.msg || 'Error al registrar movimiento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Registrar Movimiento</h2>
      
      {/* Sección de selección de herramienta */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-3">Seleccionar Herramienta</h3>
        
        {selectedHerramienta && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded">
            <p className="text-green-800">
              <strong>Herramienta seleccionada:</strong> {selectedHerramienta.nombre} ({selectedHerramienta.codigo})
            </p>
            <p className="text-green-700 text-sm">
              Cantidad disponible: {selectedHerramienta.cantidad} {selectedHerramienta.unidad}
            </p>
            {formData.barcode && (
              <p className="text-green-700 text-sm">
                Código de barras: {formData.barcode}
              </p>
            )}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Ingresar código de barras manualmente</label>
          <input
            type="text"
            placeholder="Ej. E317FD89"
            value={formData.barcode}
            onChange={handleBarcodeManualChange}
            maxLength="8"
            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          {loading && <p className="text-sm text-blue-600 mt-1">Buscando herramienta...</p>}
        </div>

        <div className="flex space-x-2 mb-4">
          <button
            type="button"
            onClick={() => setShowScanner(!showScanner)}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
            disabled={loading}
          >
            {showScanner ? '📷 Cerrar Escáner' : '📷 Escanear Código'}
          </button>
          <span className="flex items-center text-gray-500">o</span>
        </div>

        {showScanner && (
          <div className="mb-4">
            <BarcodeScanner
              onDetected={handleBarcodeDetected}
              onError={(err) => setError('Error al acceder a la cámara')}
              isActive={showScanner}
            />
          </div>
        )}

        <select
          name="herramienta"
          value={formData.herramienta}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          disabled={!!formData.barcode || loading}
        >
          <option value="">Seleccione manualmente una herramienta</option>
          {herramientas.map(h => (
            <option key={h._id} value={h._id}>
              {h.nombre} ({h.codigo}) - Cantidad: {h.cantidad}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        <select
          name="nombreUsuario"
          value={formData.nombreUsuario}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
          disabled={loading}
        >
          <option value="">Seleccione un usuario</option>
          <option value="Luis">Luis</option>
          <option value="Roque">Roque</option>
          <option value="Gary">Gary</option>
          <option value="Alex">Alex</option>
        </select>

        <div>
          <label className="mr-4">
            <input
              type="radio"
              name="tipo"
              value="entrada"
              checked={formData.tipo === 'entrada'}
              onChange={handleChange}
              disabled={loading}
            /> Entrada
          </label>
          <label>
            <input
              type="radio"
              name="tipo"
              value="salida"
              checked={formData.tipo === 'salida'}
              onChange={handleChange}
              disabled={loading}
            /> Salida
          </label>
        </div>

        <input
          type="number"
          name="cantidad"
          value={formData.cantidad}
          onChange={handleChange}
          placeholder="Cantidad"
          min="1"
          className="w-full border p-2 rounded"
          required
          disabled={loading}
        />

        <textarea
          name="nota"
          value={formData.nota}
          onChange={handleChange}
          placeholder="Nota (opcional)"
          className="w-full border p-2 rounded"
          rows="3"
          disabled={loading}
        />

        {/* Campo: Obra */}
        <input
          type="text"
          name="obra"
          value={formData.obra}
          onChange={handleChange}
          placeholder="Obra (opcional, ej. Grifo Pucara)"
          className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
          maxLength="200"
          disabled={loading}
        />
        {fieldErrors.obra && <p className="text-red-600 text-sm">{fieldErrors.obra}</p>}

        {/* Sección: Captura de Foto */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="text-lg font-semibold mb-3">Foto de Referencia (opcional)</h3>
          
          {/* Canvas oculto para snapshot */}
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Si no hay foto capturada, muestra botón para abrir cámara */}
          {!showCamera && !capturedImage && (
            <button
              type="button"
              onClick={startCamera}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition-colors mb-2"
              disabled={loading}
            >
              📸 Tomar Foto con Cámara
            </button>
          )}
          
          {/* Si cámara abierta, muestra video y botones */}
          {showCamera && (
            <div className="mb-4 text-center p-4 border-2 border-blue-300 rounded bg-gray-50">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Vista previa de la cámara (debe mostrar video aquí):</h4>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full max-w-md mx-auto rounded border-2 border-gray-300 block"
                style={{ 
                  minHeight: '240px',  // Altura mínima para ver si está vacío
                  backgroundColor: '#e0f2fe',  // Fondo azul claro si está vacío (para debug)
                  width: '100%'
                }}
              />
              <div className="mt-3 flex justify-center space-x-3">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  disabled={loading}
                >
                  📷 Capturar Foto
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                >
                  ❌ Detener Cámara
                </button>
              </div>
            </div>
          )}
          
          {/* Preview de foto capturada (si existe) */}
          {capturedImage && (
            <div className="mt-4 text-center">
              <p className="text-sm text-green-600 mb-2">Foto capturada:</p>
              <img 
                src={capturedImage} 
                alt="Foto capturada" 
                className="w-full max-w-xs mx-auto rounded border"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL guardada: {formData.foto || 'Subiendo...'}
              </p>
              {/* Botón para tomar otra foto */}
              <button
                type="button"
                onClick={() => {
                  setCapturedImage(null);
                  setFormData(prev => ({ ...prev, foto: '' }));
                  startCamera(); // Inicia la cámara de nuevo para otra foto
                }}
                className="text-sm text-blue-600 underline mt-1"
              >
                📸 Tomar otra foto
              </button>
            </div>
          )}
        </div>
        {error && <p className="text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Registrando...' : 'Registrar Movimiento'}
        </button>
      </form>
    </div>
  );
}