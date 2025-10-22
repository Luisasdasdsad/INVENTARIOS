import { useState, useEffect, useRef } from 'react';
import api from '../../services/api.js';

export default function HerramientaForm({ herramienta, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    nombre: '',
    marca: '',
    modelo: '',
    tipo: '',
    cantidad: '',
    unidad: 'unidad',
    estado: 'disponible',
    descripcion: '',
    precio: '',
  });

  // Estados para captura de foto (AGREGADOS)
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Refs para cámara
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);

  useEffect(() => {
    if (herramienta) {
      setFormData({
        nombre: herramienta.nombre || '',
        marca: herramienta.marca || '',
        modelo: herramienta.modelo || '',
        tipo: herramienta.tipo || '',
        cantidad: herramienta.cantidad || '',
        unidad: herramienta.unidad || 'unidad',
        estado: herramienta.estado || 'disponible',
        descripcion: herramienta.descripcion || '',
        precio: herramienta.precio || '',
      });
      setPreview(herramienta.foto || '');
      if (herramienta.foto) {
        setCapturedImage(herramienta.foto);
      }
    } else {
      setFormData({
        nombre: '',
        marca: '',
        modelo: '',
        tipo: '',
        cantidad: '',
        unidad: 'unidad',
        estado: 'disponible',
        descripcion: '',
        precio: '',
      });
      setPreview('');
      setCapturedImage(null);
    }
  }, [herramienta]);

  // useEffect para manejar el stream de la cámara
  useEffect(() => {
    if (showCamera && cameraStream && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = cameraStream;
      
      video.muted = true;
      video.play()
        .then(() => {
          console.log('✅ Video reproduciéndose exitosamente');
        })
        .catch((err) => {
          console.error('❌ Error en video.play():', err);
          setError('Error al iniciar la cámara: ' + err.message);
        });

      return () => {
        if (video.srcObject) {
          video.srcObject.getTracks().forEach(track => track.stop());
          video.srcObject = null;
        }
      };
    }
  }, [showCamera, cameraStream]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Función para subir archivo normal (mantener por si acaso)
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFoto(file);
      setPreview(URL.createObjectURL(file));
      setCapturedImage(URL.createObjectURL(file));
    }
  };

  // Función para iniciar la cámara
  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia no está soportado en este navegador.');
      }
      
      console.log('🔄 Iniciando cámara...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { min: 320, max: 640 },  
          height: { min: 240, max: 480 }
        } 
      });
      
      console.log('✅ Stream obtenido exitosamente');
      setCameraStream(stream);
      setShowCamera(true);
      setError('');
      
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
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
    setCameraStream(null);
    setError('');
  };

  // Función para capturar foto y subirla
  const capturePhoto = async () => {
    if (!videoRef.current) {
      setError('Elemento de video no encontrado.');
      return;
    }

    const video = videoRef.current;

    // Esperar hasta que el video tenga frames
    const waitForVideoReady = () => {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50;

        const checkVideo = () => {
          attempts++;
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            console.log('✅ Video listo para capturar!');
            resolve();
          } else if (attempts >= maxAttempts) {
            reject(new Error('El video no se cargó a tiempo. Intenta de nuevo o verifica la cámara.'));
          } else {
            setTimeout(checkVideo, 100);
          }
        };

        video.addEventListener('loadeddata', () => {
          if (video.videoWidth > 0) resolve();
        }, { once: true });

        checkVideo();
      });
    };

    try {
      setError('');
      await waitForVideoReady();

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
          formDataUpload.append('foto', blob, `herramienta-foto-${Date.now()}.jpg`);

          console.log('📤 Subiendo foto al backend...');
          const response = await api.post('/fotos', formDataUpload, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          const fotoUrl = response.data.foto;
          // Guardamos tanto la URL para el formulario como el preview
          setPreview(fotoUrl);
          setCapturedImage(URL.createObjectURL(blob));
          setFoto(blob); // También guardamos el blob por si necesitas usarlo
          setError('');
          alert('Foto capturada y subida exitosamente');
          stopCamera(); // Cerramos la cámara después de capturar
        } catch (err) {
          setError('Error al subir la foto: ' + (err.response?.data?.msg || err.message));
          console.error('Error upload:', err);
        } finally {
          setLoading(false);
        }
      }, 'image/jpeg', 0.8);

    } catch (err) {
      console.error('Error en captura:', err);
      setError(err.message || 'Cámara no lista. Intenta de nuevo.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => data.append(key, value));
      
      // Si hay una foto capturada, la agregamos al FormData
      if (foto) {
        data.append("foto", foto);
      } else if (preview && preview.startsWith('http')) {
        // Si ya hay una URL de foto (de una herramienta existente), la enviamos como string
        data.append("fotoUrl", preview);
      }

      if (herramienta) {
        await api.put(`/herramientas/${herramienta._id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Herramienta actualizada con éxito.");
      } else {
        await api.post("/herramientas", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Herramienta creada con éxito.");
      }

      onSuccess();
    } catch (err) {
      setError("Error al guardar la herramienta: " + (err.response?.data?.msg || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
      <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-800">
        {herramienta ? 'Editar Herramienta' : 'Crear Nueva Herramienta'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre *
          </label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Marca *</label>
            <input
              type="text"
              name="marca"
              value={formData.marca}
              onChange={handleChange}
              required
              className="w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej. Stanley"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Modelo *</label>
            <input
              type="text"
              name="modelo"
              value={formData.modelo}
              onChange={handleChange}
              required
              className="w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej. STHT0-72413"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Tipo</label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              required
              className="w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecciona un tipo</option>
              <option value="herramientas">Herramientas</option>
              <option value="útiles de escritorio">Útiles de escritorio</option>
              <option value="equipos de computo">Equipos de computo</option>
              <option value="muebles">Muebles</option>
              <option value="útiles de aseo">Útiles de aseo</option>
              <option value="materiales">Materiales</option>
              <option value="equipos de protección personal (EPPS)">Equipos de protección personal (EPPS)</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="cantidad" className="block text-sm font-medium text-gray-700 mb-1">
            Cantidad *
          </label>
          <input
            type="number"
            id="cantidad"
            name="cantidad"
            value={formData.cantidad}
            onChange={handleChange}
            required
            min="1"
            className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="unidad" className="block text-sm font-medium text-gray-700 mb-1">
            Unidad
          </label>
          <input
            type="text"
            id="unidad"
            name="unidad"
            value={formData.unidad}
            onChange={handleChange}
            className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="precio" className="block text-sm font-medium text-gray-700 mb-1">
            Precio (S/.)
          </label>
          <input
            type="number"
            id="precio"
            name="precio"
            value={formData.precio}
            onChange={handleChange}
            min="0"
            step="0.01"
            placeholder="Ej. 120.50"
            className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows="3"
            placeholder="Detalles adicionales de la herramienta..."
            className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* SECCIÓN DE FOTO - COMO EN MOVIMIENTOPAGE */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="text-lg font-semibold mb-3">Foto de la Herramienta (opcional)</h3>
          
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
              <h4 className="text-sm font-medium text-gray-700 mb-2">Vista previa de la cámara:</h4>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full max-w-md mx-auto rounded border-2 border-gray-300 block"
                style={{ 
                  minHeight: '240px',
                  backgroundColor: '#e0f2fe',
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
                alt="Foto de la herramienta" 
                className="w-full max-w-xs mx-auto rounded border"
              />
              <p className="text-xs text-gray-500 mt-1">
                {preview && preview.startsWith('http') ? `URL: ${preview}` : 'Foto lista para guardar'}
              </p>
              {/* Botón para tomar otra foto */}
              <button
                type="button"
                onClick={() => {
                  setCapturedImage(null);
                  setPreview('');
                  setFoto(null);
                  startCamera();
                }}
                className="text-sm text-blue-600 underline mt-1"
              >
                📸 Tomar otra foto
              </button>
            </div>
          )}

          {/* Opción alternativa: subir archivo */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              O subir archivo de imagen:
            </label>
            <input 
              type="file"
              accept="image/*"
              onChange={handleFotoChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            id="estado"
            name="estado"
            value={formData.estado}
            onChange={handleChange}
            className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="disponible">Disponible</option>
            <option value="prestado">Prestado</option>
          </select>
        </div>

        {error && (
          <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md border border-red-200">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 min-h-[44px]"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 min-h-[44px]"
            disabled={loading}
          >
            {loading ? 'Guardando...' : (herramienta ? 'Actualizar' : 'Crear')}
          </button>
        </div>
      </form>
    </div>
  );
}