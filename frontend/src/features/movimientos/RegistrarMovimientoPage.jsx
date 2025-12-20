import { useState, useEffect, useRef } from 'react';
import api from '../../services/api.js';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import BarcodeScanner from '../../components/BarcodeScanner/BarcodeScanner';
import EscanerQR from '../../components/EscannerQR/EscannerQR.jsx';
import PhotoCapture from '../../components/PhotoCapture/PhotoCapture';

export default function RegistrarMovimientoPage() {
  const [searchParams] = useSearchParams();
  const tipoInicial = searchParams.get('tipo') || 'entrada';

  const [herramientas, setHerramientas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [formData, setFormData] = useState({
    herramientas: [{ herramienta: '', barcode: '', qrCode: '', cantidad: '' }],
    tipo: tipoInicial,
    nota: '',
    nombreUsuario: '',
    obra: '',
    foto: '',
    barcode: '',
    qrCode: '',
    herramienta: ''
  });

  // Estado para manejar múltiples herramientas
  const [herramientasSeleccionadas, setHerramientasSeleccionadas] = useState([]);

  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showEscanerQR, setShowEscanerQR] = useState(false);
  const [selectedHerramientas, setSelectedHerramientas] = useState([]);
  const [isScanning, setIsScanning] = useState(false); // Controla si el scanner está activo
  const [qrProcessing, setQrProcessing] = useState(false); // Previene procesamiento múltiple de QR
  const barcodeProcessingRef = useRef(false); // Previene procesamiento múltiple de barcode
  const barcodeSearchTimeoutRef = useRef(null); // Ref para debounce de búsqueda manual Barcode
  const qrSearchTimeoutRef = useRef(null); // Ref para debounce de búsqueda manual QR

  const navigate = useNavigate();
  const { user } = useAuth();

  

  // useEffect para cargar herramientas al inicio
  useEffect(() => {
    Promise.all([api.get('/herramientas'), api.get('/productos')])
      .then(([resHerramientas, resProductos]) => {
        setHerramientas(resHerramientas.data);
        setProductos(resProductos.data);
      })
      .catch(() => setError('Error al cargar inventario'));
  }, []);

  // Reset qrProcessing cuando se abre el modal QR
  useEffect(() => {
    setQrProcessing(false);
  }, [showEscanerQR]);

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

    // Validación relajada: Permitir cualquier código con longitud mínima para buscar
    if (codigo.length < 3) return null; 

    // 1. BÚSQUEDA LOCAL (Prioridad: Herramientas y Productos cargados)
    const toolLocal = herramientas.find(h => h.barcode === codigo);
    if (toolLocal) {
      setHerramientasSeleccionadas(prev => [...prev, {
        ...toolLocal,
        herramienta: toolLocal._id,
        barcode: codigo,
        qrCode: '',
        cantidad: 1,
        tipo: 'herramienta'
      }]);
      setFormData(prev => ({ ...prev, herramienta: '', barcode: '', qrCode: '' }));
      console.log(`✅ Herramienta encontrada localmente: ${toolLocal.nombre}`);
      return toolLocal;
    }

    const prodLocal = productos.find(p => p.barcode === codigo);
    if (prodLocal) {
      setHerramientasSeleccionadas(prev => [...prev, {
        ...prodLocal,
        producto: prodLocal._id,
        barcode: codigo,
        qrCode: '',
        cantidad: 1,
        tipo: 'producto'
      }]);
      setFormData(prev => ({ ...prev, herramienta: '', barcode: '', qrCode: '' }));
      console.log(`✅ Producto encontrado localmente: ${prodLocal.nombre}`);
      return prodLocal;
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
      cantidad: 1, // Default cantidad
      tipo: 'herramienta'
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
      const producto = productos.find(p => p._id === value);

      if (herramienta) {
        // Agregar a herramientas seleccionadas
        setHerramientasSeleccionadas(prev => [...prev, {
          ...herramienta,
          herramienta: herramienta._id,
          barcode: '',
          qrCode: '',
          cantidad: 1, // Default cantidad
          tipo: 'herramienta'
        }]);
      } else if (producto) {
        // Agregar producto seleccionado
        setHerramientasSeleccionadas(prev => [...prev, {
          ...producto,
          producto: producto._id,
          barcode: '',
          qrCode: '',
          cantidad: 1,
          tipo: 'producto'
        }]);
      }

      if (herramienta || producto) {
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
    
    // Limpiar timeout anterior
    if (barcodeSearchTimeoutRef.current) clearTimeout(barcodeSearchTimeoutRef.current);

    // Debounce para búsqueda manual (espera 500ms a que termines de escribir o escanear)
    if (barcode.length >= 3) {
      barcodeSearchTimeoutRef.current = setTimeout(() => {
        fetchHerramientaByBarcode(barcode).catch(() => {}); // Catch silencioso para no llenar de errores mientras escribe
      }, 500);
    }
    setFormData(prev => ({ ...prev, herramienta: '' }));
  };

  // Función auxiliar de búsqueda (sin efectos secundarios de estado de escaneo)
  const searchQR = async (qrCode) => {
    const qrUpper = qrCode?.trim()?.toUpperCase();
    if (!qrUpper) return null;

    // 1. BÚSQUEDA LOCAL
    const toolLocal = herramientas.find(h => h.qrCode === qrUpper);
    if (toolLocal) return { ...toolLocal, tipo: 'herramienta' };

    const prodLocal = productos.find(p => p.qrCode === qrUpper);
    if (prodLocal) return { ...prodLocal, tipo: 'producto' };

    // 2. API
    console.log('🔍 API Call: /qr/buscar/' + qrCode);
    const response = await api.get(`/qr/buscar/${qrCode}`);
    console.log('✅ API Respuesta:', response.data);
    return response.data;
  };

  const fetchHerramientaByQR = async (qrCode) => {
    if (isScanning) {
      console.log('⏳ Procesando QR anterior – Ignorando...');
      return null;
    }
    setIsScanning(true);

    try {
      return await searchQR(qrCode);
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
        ...herramienta, // Spread incluye propiedades como _id, nombre, etc.
        [herramienta.tipo === 'producto' ? 'producto' : 'herramienta']: herramienta._id, // Asignar ID al campo correcto
        qrCode: qrCode.toUpperCase(),
        barcode: '',
        cantidad: 1, // Default cantidad
        tipo: herramienta.tipo || 'herramienta' // Usar el tipo detectado o default
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
    
    if (qrSearchTimeoutRef.current) clearTimeout(qrSearchTimeoutRef.current);

    if (qr.length >= 5) {
      qrSearchTimeoutRef.current = setTimeout(async () => {
        try {
          const item = await searchQR(qr);
          if (item) {
            setHerramientasSeleccionadas(prev => [...prev, {
              ...item,
              [item.tipo === 'producto' ? 'producto' : 'herramienta']: item._id,
              qrCode: item.qrCode || qr,
              barcode: '',
              cantidad: 1,
              tipo: item.tipo || 'herramienta'
            }]);
            setFormData(prev => ({ ...prev, qrCode: '', herramienta: '' }));
          }
        } catch (err) {
          // Ignorar errores mientras escribe (ej. 404)
        }
      }, 500);
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
    const itemsValidos = herramientasSeleccionadas.filter(h =>
      h.herramienta || h.producto || h.barcode || h.qrCode
    );

    if (itemsValidos.length === 0) {
      setError('Debe seleccionar al menos un ítem');
      setLoading(false);
      return;
    }

    // Validar que cada herramienta tenga cantidad > 0
    for (const h of itemsValidos) {
      if (!h.cantidad || h.cantidad <= 0) {
        setError('Todos los ítems deben tener cantidad mayor que cero');
        setLoading(false);
        return;
      }
    }

    try {
      // Limpiamos el payload para enviar solo lo necesario (evitamos enviar campos de UI como barcode/qrCode inputs)
      const payloadData = {
        tipo: formData.tipo,
        nota: formData.nota,
        obra: formData.obra,
        foto: formData.foto
      };

      const herramientasItems = itemsValidos.filter(i => i.tipo !== 'producto');
      const productosItems = itemsValidos.filter(i => i.tipo === 'producto');
      const promises = [];

      // 1. Enviar Herramientas (si hay)
      if (herramientasItems.length > 0) {
        const payloadH = {
          ...payloadData,
          herramientas: herramientasItems.map(h => ({
            herramienta: h.herramienta || undefined,
            barcode: h.barcode || undefined,
            qrCode: h.qrCode || undefined,
            cantidad: Number(h.cantidad)
          }))
        };
        promises.push(api.post('/movimientos', payloadH));
      }

      // 2. Enviar Productos (si hay)
      if (productosItems.length > 0) {
        const payloadP = {
          ...payloadData,
          productos: productosItems.map(p => ({
            producto: p.producto || undefined,
            cantidad: Number(p.cantidad)
          }))
        };
        // Asumiendo que tu backend tiene este endpoint para la colección movimientosproductos
        promises.push(api.post('/movimientos-productos', payloadP));
      }

      await Promise.all(promises);

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
        <h3 className="text-lg font-semibold mb-3">Seleccionar Ítem</h3>
        
        {herramientasSeleccionadas.length > 0 && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded">
            <p className="text-green-800 font-semibold mb-2">Ítems seleccionados:</p>
            {herramientasSeleccionadas.map((h, index) => (
              <div key={index} className="mb-2 p-2 bg-white rounded border">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-green-800">
                      <strong>{h.nombre}</strong> {h.codigo ? `(${h.codigo})` : ''} <span className="text-xs bg-gray-200 px-1 rounded">{h.tipo === 'producto' ? 'Prod' : 'Herr'}</span>
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
          <option value="">Seleccione un ítem (Herramienta o Producto)</option>
          <optgroup label="Herramientas">
            {herramientas.map(h => (
              <option key={h._id} value={h._id}>
                {h.nombre} {h.codigo ? `(${h.codigo})` : ''} - Cantidad: {h.cantidad}
              </option>
            ))}
          </optgroup>
          <optgroup label="Productos">
            {productos.map(p => (
              <option key={p._id} value={p._id}>
                {p.nombre} - Stock: {p.stock} {p.unidad}
              </option>
            ))}
          </optgroup>
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
        <PhotoCapture 
          onCapture={(url) => setFormData(prev => ({ ...prev, foto: url }))} 
          currentPhoto={formData.foto} 
          fileNamePrefix="movimiento"
        />

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