import { useState, useEffect } from 'react';
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
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedHerramienta, setSelectedHerramienta] = useState(null);

  const navigate = useNavigate();

  const { user } = useAuth();

  useEffect(() => {

    api.get('/herramientas')
      .then(res => setHerramientas(res.data))
      .catch(() => setError('Error al cargar herramientas'));

  }, []);

  const fetchHerramientaByBarcode = async (barcode) => {
    setLoading(true);
    setError('');
    try{
      const response = await fetch('/api/herramientas/buscar-por-codigo-barras/${barcode.toUpperCase()}');
      if(!response.ok) {
        throw new Error('Herramienta no encontrada con código ${barcode}');
      }
      const herramienta = await response.json();

      setSelectedHerramienta(herramienta);
      setFormData(prev => ({
        ...prev,
        herramienta: herramienta._id,
        barcode: barcode.toUpperCase()
      }));

      console.log('Herramienta encontrada:', herramienta);
    }catch (err) {
      setError(err.message);
      setSelectedHerramienta(null);
      setFormData(prev => ({ ...prev, herramienta: '', barcode: '' }));
      console.error('Error al buscar herramienta:',err);
    } finally {
      setLoading(false);
    }
  }

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Si se selecciona una herramienta manualmente, limpiar el código de barras
    if (name === 'herramienta' && value) {
      setFormData(prev => ({ ...prev, barcode: '' }));
      const herramienta = herramientas.find(h => h._id === value);
      setSelectedHerramienta(herramienta);
    }
  };

  const handleBarcodeDetected = (barcode) => {
    if (barcode && barcode.length === 8) { // Validación básica: 8 chars
      fetchHerramientaByBarcode(barcode);
      setShowScanner(false); // Cerrar escáner después de detectar
    } else {
      setError('Código de barras inválido. Debe tener 8 caracteres hexadecimales (ej. E317FD89)');
    }
  };

  const handleBarcodeManualChange = e => {
    const barcode = e.target.value.toUpperCase();
    setFormData(prev => ({ ...prev, barcode }));

    if (barcode.length === 10 && /^[A-F0-9]{10}$/i.test(barcode)) {

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

    if (!formData.herramienta && !formData.barcode) {
      setError('Debe seleccionar una herramienta o escanear un código de barras');
      return;
    }
    if (formData.cantidad <= 0) {
      setError('La cantidad debe ser mayor que cero');
      return;
    }
    if (!formData.nombreUsuario) {
      setError('Debe seleccionar un usuario');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        cantidad: Number(formData.cantidad),
      };
      
      // Si hay código de barras, enviarlo en lugar del ID
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
            placeholder='Ej.E317FD89'
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
          disabled={!!formData.barcode}
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
            /> Entrada
          </label>
          <label>
            <input
              type="radio"
              name="tipo"
              value="salida"
              checked={formData.tipo === 'salida'}
              onChange={handleChange}
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
        />

        <textarea
          name="nota"
          value={formData.nota}
          onChange={handleChange}
          placeholder="Nota (opcional)"
          className="w-full border p-2 rounded"
          rows="3"
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
    </div>
  );
}