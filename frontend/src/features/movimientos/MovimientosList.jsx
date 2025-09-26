import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';

export default function MovimientosList() {
  // ESTADOS (incluyendo pdfLoading y NUEVO: filtros)
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [filtros, setFiltros] = useState({ tipo: '', fechaDesde: '', fechaHasta: '' }); // NUEVO: Estado para filtros
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMovimientos = async () => {
      try {
        console.log('Iniciando fetch de movimientos...'); // DEBUG
        const res = await api.get('/movimientos');
        console.log('Movimientos cargados:', res.data ? res.data.length : 0); // DEBUG
        setMovimientos(res.data || []);
      } catch (err) {
        console.error('Error en fetchMovimientos:', err); // DEBUG
        setError('Error al cargar movimientos: ' + (err.message || 'Desconocido'));
      } finally {
        setLoading(false);
      }
    };

    fetchMovimientos();
  }, []);

  // NUEVO: Handler para cambios en filtros
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  // FUNCIÓN PDF ACTUALIZADA (usa filtros en URL)
  const descargarPDF = async () => {
    setPdfLoading(true);
    try {
      console.log('Iniciando descarga PDF con filtros:', filtros); // DEBUG
      // Construir query params con filtros
      const params = new URLSearchParams();
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
      if (filtros.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
      
      const url = `http://localhost:5000/api/movimientos/pdf?${params.toString()}`; // Full URL + params
      console.log('URL PDF:', url); // DEBUG
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.msg || `Error ${response.status}: Inténtelo de nuevo`);
      }

      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `reporte-movimientos-${new Date().toISOString().split('T')[0]}${filtros.tipo ? `-tipo-${filtros.tipo}` : ''}.pdf`; // Nombre con filtro opcional
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);

      console.log('PDF descargado exitosamente'); // DEBUG
      alert('PDF descargado exitosamente');
    } catch (err) {
      console.error('Error en descargarPDF:', err); // DEBUG
      alert('Error al generar PDF: ' + err.message);
      setError('Error en PDF: ' + err.message);
    } finally {
      setPdfLoading(false);
    }
  };

  // DEBUG RENDER
  console.log('Renderizando MovimientosList - Loading:', loading, 'Error:', error, 'Movimientos count:', movimientos.length);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded shadow max-w-5xl mx-auto">
        <p>Cargando movimientos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded shadow max-w-5xl mx-auto">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Recargar Página
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded shadow max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Lista de Movimientos</h2>
        <div className="space-x-2">
          <button
            onClick={() => navigate('/movimientos/registrar?tipo=entrada')}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Registrar Entrada
          </button>
          <button
            onClick={() => navigate('/movimientos/registrar?tipo=salida')}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Registrar Salida
          </button>
          <button
            onClick={descargarPDF}
            disabled={pdfLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400"
          >
            {pdfLoading ? 'Generando PDF...' : 'Descargar PDF'}
          </button>
        </div>
      </div>

      {/* NUEVA SECCIÓN: Filtros para PDF */}
      <div className="mb-4 p-4 bg-gray-50 rounded border">
        <h3 className="font-semibold mb-2">Filtros para Reporte PDF (opcional):</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tipo:</label>
            <select
              name="tipo"
              value={filtros.tipo}
              onChange={handleFiltroChange}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">Todos</option>
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Desde:</label>
            <input
              type="date"
              name="fechaDesde"
              value={filtros.fechaDesde}
              onChange={handleFiltroChange}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hasta:</label>
            <input
              type="date"
              name="fechaHasta"
              value={filtros.fechaHasta}
              onChange={handleFiltroChange}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">Deja vacío para todos los movimientos. El PDF se filtrará según tus selecciones.</p>
      </div>

      {movimientos.length === 0 ? (
        <div className="p-4 bg-yellow-50 border rounded">
          <p>No hay movimientos registrados. <button onClick={() => navigate('/movimientos/registrar?tipo=entrada')} className="text-blue-600 underline">Registra uno ahora</button></p>
        </div>
      ) : (
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2 text-left">Tipo</th>
              <th className="border px-4 py-2 text-left">Herramienta</th>
              <th className="border px-4 py-2 text-right">Cantidad</th>
              <th className="border px-4 py-2 text-left">Unidad</th>
              <th className="border px-4 py-2 text-left">Usuario</th>
              <th className="border px-4 py-2 text-left">Fecha</th>
              <th className="border px-4 py-2 text-left">Nota</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((mov) => (
              <tr key={mov._id} className="hover:bg-gray-50">
                <td className="border px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded text-white text-sm ${
                      mov.tipo === 'entrada' ? 'bg-green-600' : 'bg-red-600'
                    }`}
                  >
                    {mov.tipo.charAt(0).toUpperCase() + mov.tipo.slice(1)}
                  </span>
                </td>
                <td className="border px-4 py-2">
                  {mov.herramienta ? (
                    <>
                      <strong>{mov.herramienta.nombre}</strong> ({mov.herramienta.codigo})
                    </>
                  ) : (
                    'Herramienta eliminada'
                  )}
                </td>
                <td className="border px-4 py-2 text-right">{mov.cantidad}</td>
                <td className="border px-4 py-2">{mov.herramienta?.unidad || '-'}</td>
                <td className="border px-4 py-2">{mov.usuario?.nombre || 'Desconocido'}</td>
                <td className="border px-4 py-2">
                  {new Date(mov.createdAt).toLocaleString()}
                </td>
                <td className="border px-4 py-2">{mov.nota || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}