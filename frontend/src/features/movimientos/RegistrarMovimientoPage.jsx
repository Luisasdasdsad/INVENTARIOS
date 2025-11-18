import { useState, useEffect, useRef } from 'react';
import api from '../../services/api.js';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import BarcodeScanner from '../../components/BarcodeScanner/BarcodeScanner';
import EscanerQR from '../../components/EscannerQR/EscannerQR.jsx';
import axios from 'axios';

export default function RegistrarMovimientoPage() {
  const [searchParams] = useSearchParams();
  const tipoInicial = searchParams.get('tipo') || 'entrada';

  const [herramientas, setHerramientas] = useState([]);
  const [formData, setFormData] = useState({
    herramientas: [{ herramienta: '', barcode: '', qrCode: '', cantidad: '' }],
    tipo: tipoInicial,
    nota: '',
    nombreUsuario: '',
    obra: '',
    foto: ''
  });

  // Estado para manejar múltiples herramientas
  const [herramientasSeleccionadas, setHerramientasSeleccionadas] = useState([]);

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
  const [showEscanerQR, setShowEscanerQR] = useState(false);
  const [selectedHerramientas, setSelectedHerramientas] = useState([]);
  const [isScanning, setIsScanning] = useState(false); // Controla si el scanner está activo
  const [qrProcessing, setQrProcessing] = useState(false); // Previene procesamiento múltiple de QR
  const barcodeProcessingRef = useRef(false); // Previene procesamiento múltiple de barcode

  const navigate = useNavigate();
  const { user } = useAuth();

  

  // useEffect para cargar herramientas al inicio
  useEffect(() => {
    api.get('/herramientas')
      .then(res => setHerramientas(res.data))
      .catch(() => setError('Error al cargar herramientas'));
  }, []);

  // Reset qrProcessing cuando se abre el modal QR
  useEffect(() => {
    setQrProcessing(false);
  }, [showEscanerQR]);

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
  if (isScanning) {
    console.log('⏳ Procesando escaneo anterior – Ignorando...');
    return null;
  }

  setIsScanning(true);
  setError('');

  try {
    const codigo = barcode?.trim()?.toUpperCase();
    if (!codigo) throw new Error('Código de barras vacío');

    // ✅ Validar formato: exactamente 8 caracteres hexadecimales
    if (codigo.length !== 8 || !/^[A-F0-9]{8}$/i.test(codigo)) {
      throw new Error('Código de barras no válido. Debe ser exactamente 8 caracteres hexadecimales (A-F, 0-9)');
    }

    console.log('🔍 API Call: /barcode/buscar/' + codigo);
    const response = await api.get(`/barcode/buscar/${codigo}`); // Igual que QR (usa api sin /api extra)

    console.log('✅ API Respuesta:', response.data);
    const herramienta = Array.isArray(response.data)
      ? response.data[0]
      : response.data;

    if (!herramienta || !herramienta._id) {
      throw new Error('Herramienta no encontrada por este código de barras');
    }

    // 🧩 Agregar a herramientas seleccionadas
    setHerramientasSeleccionadas(prev => [...prev, {
      ...herramienta,
      barcode: codigo,
      qrCode: '',
      cantidad: 1 // Default cantidad
    }]);

    // Limpiar formData para permitir agregar más
    setFormData(prev => ({
      ...prev,
      herramienta: '',
      barcode: '',
      qrCode: '',
    }));

    console.log(`✅ Herramienta agregada: ${herramienta.nombre} (Stock: ${herramienta.cantidad})`);
    return herramienta;
  } catch (error) {
    console.error('❌ API Error:', error.response?.status, error.response?.data?.error || error.message);

    if (error.response?.status === 404) {
      throw new Error('Herramienta no encontrada por este código de barras');
    } else if (error.response?.status === 500) {
      throw new Error('Error en el servidor – Verifica el código o contacta admin');
    } else {
      throw new Error('Error de conexión – Intenta escanear de nuevo');
    }
  } finally {
    // 🔁 Debounce 2s igual que QR
    setTimeout(() => setIsScanning(false), 2000);
  }
};

    
    // Alert de éxito


  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    setFieldErrors(prev => ({ ...prev, [name]: '' }));

    if (name === 'herramienta' && value) {
      setFormData(prev => ({
        ...prev,
        barcode: '',
        qrCode: ''  // Limpia QR
      }));
      const herramienta = herramientas.find(h => h._id === value);
      if (herramienta) {
        // Agregar a herramientas seleccionadas
        setHerramientasSeleccionadas(prev => [...prev, {
          ...herramienta,
          herramienta: herramienta._id,
          barcode: '',
          qrCode: '',
          cantidad: 1 // Default cantidad
        }]);

        // Limpiar formData para permitir agregar más
        setFormData(prev => ({
          ...prev,
          herramienta: '',
          barcode: '',
          qrCode: '',
        }));
      }
    }
  };

  const handleBarcodeDetected = async (barcode) => {
  if (barcodeProcessingRef.current) {
    console.log('⏸️ Barcode ya procesándose – Ignorando...');
    return;
  }
  // ✅ FIX: Cambia el check a "if (isScanning)" para bloquear SOLO si ya está procesando
  // (antes bloqueaba si NO estaba procesando, lo cual era al revés)
  if (isScanning) {
    console.log('⏳ Ya procesando escaneo anterior – Ignorando...');
    return;
  }
  console.log('🔄 Procesando barcode en parent:', barcode);
  barcodeProcessingRef.current = true;
  setIsScanning(true); // ✅ Set a true ANTES del fetch para bloquear scans subsiguientes
  try {
    await fetchHerramientaByBarcode(barcode);
    // Esperar antes de cerrar el escáner (mismo timeout)
    setTimeout(() => {
      setIsScanning(false); // Reset aquí también (redundante pero seguro)
      setShowScanner(false);
      console.log('📴 Cámara cerrada correctamente');
    }, 1000);
  } catch (err) {
    console.error('❌ Error en handleBarcodeDetected:', err);
    setError(err.message || 'Error al procesar barcode');
  } finally {
    barcodeProcessingRef.current = false;
    // No reset isScanning aquí; déjalo para el timeout o el fetch (evita race conditions)
  }
};

const handleBarcodeManualChange = e => {
    const barcode = e.target.value.toUpperCase();
    setFormData(prev => ({ ...prev, barcode }));
    if (barcode.length === 8 && /^[A-F0-9]{8}$/i.test(barcode)) {
      fetchHerramientaByBarcode(barcode);
    } else if (barcode.length > 0) {
      setError('Código debe ser 8 caracteres hexadecimales (A-F,0-9)');
      setFormData(prev => ({ ...prev, herramienta: '' }));
    } else {
      setError('');
      setFormData(prev => ({ ...prev, herramienta: '' }));
    }
  };

  const fetchHerramientaByQR = async (qrCode) => {
  if (isScanning) {
    console.log('⏳ Procesando QR anterior – Ignorando...');
    return null;
  }
  setIsScanning(true);
  try {
    console.log('🔍 API Call: /qr/buscar/' + qrCode);
    const response = await api.get(`/qr/buscar/${qrCode}`);  // ← FIX: Correct endpoint is /qr/buscar, not /barcode/buscar-qr
    console.log('✅ API Respuesta:', response.data);
    return response.data;  // { _id, nombre, cantidad, ... }
  } catch (error) {
    console.error('❌ API Error:', error.response?.status, error.response?.data?.error || error.message);
    if (error.response?.status === 404) {
      throw new Error('Herramienta no encontrada por este QR');
    } else if (error.response?.status === 500) {
      throw new Error('Error en el servidor – Verifica el QR o contacta admin');
    } else {
      throw new Error('Error de conexión – Intenta escanear de nuevo');
    }
  } finally {
    setTimeout(() => setIsScanning(false), 2000);  // Debounce 2s
  }
};


  const handleEscanerQRError = (err) => {
    console.error('❌ Error en escáner QR:', err);
    setError('Error en escáner: ' + (err.message || err));
  };

  const handleScanQR = async (qrCode) => {
  if (qrProcessing) {
    console.log('⏸️ QR ya procesándose – Ignorando...');
    return;
  }
  setQrProcessing(true);
  console.log('🔍 QR Detectado:', qrCode);
  try {
    setError('');  // Limpia si tienes
    alert('Buscando herramienta...');  // Loading simple
    const herramienta = await fetchHerramientaByQR(qrCode);
    if (herramienta) {
      // Agregar a herramientas seleccionadas
      setHerramientasSeleccionadas(prev => [...prev, {
        ...herramienta,
        qrCode: qrCode.toUpperCase(),
        barcode: '',
        cantidad: 1 // Default cantidad
      }]);

      // Limpiar formData para permitir agregar más
      setFormData(prev => ({
        ...prev,
        herramienta: '',
        qrCode: '',
        barcode: '',
      }));

      const msg = `✅ Agregada: ${herramienta.nombre} - Stock: ${herramienta.cantidad}`;
      alert(msg);
      console.log('✅ Herramienta agregada:', herramienta);
    } else {
      throw new Error('No encontrada');
    }
  } catch (err) {
    console.error('❌ QR Process Error:', err.message);
    const msg = '❌ ' + err.message;
    setError(msg);
    alert(msg);
  } finally {
    setIsScanning(false);
    setShowEscanerQR(false);  // Cierra modal
    setQrProcessing(false);
  }
};

  const handleManualQRChange = (e) => {
    const qr = e.target.value.toUpperCase();
    setFormData(prev => ({ ...prev, qrCode: qr }));
    // Valida formato (QR- + chars hex) – busca auto si válido
    if (qr.startsWith('QR-') && qr.length >= 15 && /^[QR-][A-F0-9]{12,}$/i.test(qr)) {
      fetchHerramientaByQR(qr);
    } else if (qr.length > 0 && !qr.startsWith('QR-')) {
      setError('Código QR debe empezar con "QR-" seguido de caracteres hexadecimales');
      setFormData(prev => ({ ...prev, herramienta: '' }));
    } else {
      setError('');
      setFormData(prev => ({ ...prev, herramienta: '' }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    // Validar que al menos una herramienta tenga datos
    const herramientasValidas = herramientasSeleccionadas.filter(h =>
      h.herramienta || h.barcode || h.qrCode
    );

    if (herramientasValidas.length === 0) {
      setError('Debe seleccionar al menos una herramienta');
      setLoading(false);
      return;
    }

    // Validar que cada herramienta tenga cantidad > 0
    for (const h of herramientasValidas) {
      if (!h.cantidad || h.cantidad <= 0) {
        setError('Todas las herramientas deben tener cantidad mayor que cero');
        setLoading(false);
        return;
      }
    }

    try {
      const { nombreUsuario, ...payloadData } = formData; // Excluir nombreUsuario ya que viene del auth
      const payload = {
        ...payloadData,
        herramientas: herramientasValidas.map(h => ({
          herramienta: h.herramienta || undefined,
          barcode: h.barcode || undefined,
          qrCode: h.qrCode || undefined,
          cantidad: Number(h.cantidad)
        }))
      };

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

  const handleEscanneQRError = (errMsg) => {
    setError(`Error en escáner QR: ${errMsg}`);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Registrar Movimiento</h2>
      
      {/* Sección de selección de herramienta */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-3">Seleccionar Herramienta</h3>
        
        {herramientasSeleccionadas.length > 0 && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded">
            <p className="text-green-800 font-semibold mb-2">Herramientas seleccionadas:</p>
            {herramientasSeleccionadas.map((h, index) => (
              <div key={index} className="mb-2 p-2 bg-white rounded border">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-green-800">
                      <strong>{h.nombre}</strong> ({h.codigo})
                    </p>
                    <p className="text-green-700 text-sm">
                      Cantidad disponible: {h.cantidad} {h.unidad}
                    </p>
                    {h.barcode && (
                      <p className="text-green-700 text-sm">
                        Código de barras: {h.barcode}
                      </p>
                    )}
                    {h.qrCode && (
                      <p className='text-green-700 text-sm'>
                        Código QR: {h.qrCode}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium">Cant:</label>
                    <input
                      type="number"
                      min="1"
                      value={h.cantidad}
                      onChange={(e) => {
                        const newCantidad = parseInt(e.target.value) || 1;
                        setHerramientasSeleccionadas(prev =>
                          prev.map((item, i) =>
                            i === index ? { ...item, cantidad: newCantidad } : item
                          )
                        );
                      }}
                      className="w-16 border p-1 rounded text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setHerramientasSeleccionadas(prev =>
                          prev.filter((_, i) => i !== index)
                        );
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
            disabled={loading || !!formData.qrCode}
          />
          {loading && <p className="text-sm text-blue-600 mt-1">Buscando herramienta...</p>}
        </div>

        <div className="flex space-x-2 mb-4">
          <button
            type="button"
            onClick={() => setShowScanner(!showScanner)}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
            disabled={loading || !!formData.qrCode}
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

        <div className='mb-4 pt-4 border-t border-gray-200'>
          <label className='block text-sm font-medium mb-2'>o Ingresar código QR manualmente</label>
          <input
            type="text"
            placeholder="Ej. QR-E674899FFC83"
            value={formData.qrCode}
            onChange={handleManualQRChange}
            maxLength="20"  // Ajusta según tu formato QR
            className="w-full border p-2 rounded focus:ring-2 focus:ring-purple-500"
            disabled={loading || !!formData.barcode}  // Deshabilita si barcode activo
          ></input>
          {loading && <p className='text-sm text-blue-600 mt-1'>Buscando herramienta por QR</p>}
        </div>

        <div className="flex space-x-2 mb-4">  {/* Botón escáner QR */}
          <button
            type="button"
            onClick={() => setShowEscanerQR(true)}  // ← Abre modal QR
            className="flex-1 bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition-colors"
            disabled={loading || !!formData.barcode}
          >
            🔲 Escanear QR
          </button>
          <span className="flex items-center text-gray-500">o</span>
        </div>

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

        <div>
          <label className="block text-sm font-medium mb-2">Usuario</label>
          <input
            type="text"
            value={user?.nombre || ''}
            className="w-full border p-2 rounded bg-gray-100"
            readOnly
          />
        </div>

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

        {/* Campo cantidad removido ya que ahora está por herramienta */}

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
          placeholder="Obra (requerida, ej. Grifo Pucara)"
          className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
          maxLength="200"
          disabled={loading}
          required
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
      {/* ← NUEVO: Modal Escáner QR (render condicional) */}
      {showEscanerQR && (
        <EscanerQR
          isOpen={showEscanerQR}
          onScan={handleScanQR}
          onClose={() => setShowEscanerQR(false)}
          onError={(err) => setError('Error escáner: ' + err.message)}
        />
      )}
    </div>
  );
}