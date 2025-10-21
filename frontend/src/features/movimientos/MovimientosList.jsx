import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import { FaFilePdf, FaSignInAlt, FaSignOutAlt, FaDownload, FaRedo, FaPrint } from 'react-icons/fa';
import { generarReporteMovimientos as generarReporteMovimientosPDF, generarReporteMovimientoIndividual } from '../../utils/generarReporteMovimiento.js';


export default function MovimientosList() {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [filtros, setFiltros] = useState({ movimientos: '', tipoHerramienta: '', fechaInicio: '', fechaFin:'' });
  const navigate = useNavigate();

  

  useEffect(() => {
    const fetchMovimientos = async () => {
      try {
        console.log('Iniciando fetch de movimientos...');
        const res = await api.get('/movimientos');
        console.log('Movimientos cargados:', res.data ? res.data.length : 0);
        setMovimientos(res.data || []);
      } catch (err) {
        console.error('Error en fetchMovimientos:', err);
        setError('Error al cargar movimientos: ' + (err.message || 'Desconocido'));
      } finally {
        setLoading(false);
      }
    };

    fetchMovimientos();
  }, []);

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  const recargarDatos = () => {
    setLoading(true);
    setError(null);
    const fetchMovimientos = async () => {
      try {
        const res = await api.get('/movimientos');
        setMovimientos(res.data || []);
      } catch (err) {
        setError('Error al cargar movimientos: ' + (err.message || 'Desconocido'));
      } finally {
        setLoading(false);
      }
    };
    fetchMovimientos();
  };

  const handleGenerarReporteMovimientos = () => {
    // Aplicar filtros si están definidos
    let movimientosFiltrados = [...movimientos];

  // Filtrar por tipo de movimiento
    if (filtros.movimientos) {
      movimientosFiltrados = movimientosFiltrados.filter(
        (m) => m.tipo === filtros.movimientos
      );
    }

  // Filtrar por tipo de herramienta
    if (filtros.tipoHerramienta) {
      movimientosFiltrados = movimientosFiltrados.filter(
        (m) => m.herramienta?.tipo === filtros.tipoHerramienta
      );
    }

  // Filtrar por rango de fechas
    if (filtros.fechaInicio || filtros.fechaFin) {
      const inicio = filtros.fechaInicio ? new Date(filtros.fechaInicio) : null;
      const fin = filtros.fechaFin ? new Date(filtros.fechaFin) : null;

      movimientosFiltrados = movimientosFiltrados.filter((m) => {
        const fechaMov = new Date(m.createdAt);
        if (inicio && fechaMov < inicio) return false;
        if (fin && fechaMov > fin) return false;
        return true;
      });
    }

    if (movimientosFiltrados.length === 0) {
      alert("No hay movimientos que coincidan con los filtros seleccionados.");
      return;
    }

    generarReporteMovimientosPDF(movimientosFiltrados);
  }

  console.log('Renderizando MovimientosList - Loading:', loading, 'Error:', error, 'Movimientos count:', movimientos.length);

  if (loading) {
    return (
      <div className="p-4 md:p-6 bg-white rounded shadow max-w-7xl mx-auto">
        <div className="text-center py-8">
          <p className="text-gray-600">Cargando movimientos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 bg-white rounded shadow max-w-7xl mx-auto">
        <div className="text-center py-4">
          <p className="text-red-600 mb-4 text-sm md:text-base">{error}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button 
              onClick={recargarDatos}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2 text-sm min-h-[44px]"
            >
              <FaRedo size={14} /> Reintentar
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 flex items-center justify-center gap-2 text-sm min-h-[44px]"
            >
              Recargar Página
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-4 lg:p-6 bg-white rounded shadow max-w-7xl mx-auto">
      {/* Header Responsive */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 md:mb-6 gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">Lista de Movimientos</h2>
        
        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <button
            onClick={() => navigate('/movimientos/registrar?tipo=entrada')}
            className="flex items-center justify-center gap-2 bg-green-600 text-white px-3 py-2 md:px-4 md:py-2 rounded hover:bg-green-700 transition-colors min-h-[44px] text-sm w-full sm:w-auto"
          >
            <FaSignInAlt size={14} /> Entrada
          </button>
          <button
            onClick={() => navigate('/movimientos/registrar?tipo=salida')}
            className="flex items-center justify-center gap-2 bg-red-600 text-white px-3 py-2 md:px-4 md:py-2 rounded hover:bg-red-700 transition-colors min-h-[44px] text-sm w-full sm:w-auto"
          >
            <FaSignOutAlt size={14} /> Salida
          </button>
          <button
            onClick={handleGenerarReporteMovimientos}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-2 md:px-4 md:py-2 rounded hover:bg-blue-700 transition-colors min-h-[44px] text-sm w-full sm:w-auto">
            <FaFilePdf size={14} />
            Generar PDF
          </button>
        </div>
      </div>

      {/* Filtros para PDF - Responsive */}
      <div className="mb-4 md:mb-6 p-3 md:p-4 bg-gray-50 rounded border">
        <h3 className="font-semibold mb-2 text-sm md:text-base"> Reporte PDF (opcional):</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <div>
            <label className="block text-xs md:text-sm font-medium mb-1">Movimientos:</label>
            <select
              name="movimientos"
              value={filtros.movimientos}
              onChange={handleFiltroChange}
              className="w-full px-3 py-2 border rounded text-sm md:text-base"
            >
              <option value="">Todos</option>
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
            </select>
          </div>
          <div>
            <label className="block text-xs md:text-sm font-medium mb-1">Tipo:</label>
            <select
              name="tipoHerramienta"
              value={filtros.tipoHerramienta}
              onChange={handleFiltroChange}
              className="w-full px-3 py-2 border rounded text-sm md:text-base"
            >
              <option value="">Todos</option>
              <option value="herramientas">Herramientas</option>
              <option value="útiles de escritorio">Útiles de escritorio</option>
              <option value="equipos de computo">Equipos de computo</option>
              <option value="muebles">Muebles</option>
              <option value="útiles de aseo">Útiles de aseo</option>
              <option value="materiales">Materiales</option>
              <option value="equipos de protección personal (EPPS)">Equipos de protección personal (EPPS)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs md:text-sm font-medium mb-1">Desde:</label>
            <input
              type="date"
              name="fecha"
              value={filtros.fecha}
              onChange={handleFiltroChange}
              className="w-full px-3 py-2 border rounded text-sm md:text-base"
            />
          </div>
          <div>
            <label className='block text-xs md:text-sm font-medium mb-1'>Hasta:</label>
            <input 
              type = "date"
              name = "fechaFin"
              value = {filtros.fechaFin}
              onChange = {handleFiltroChange}
              className = "w-full px-3 py-2 border rounded text-sm md:text-base"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">Deja vacío para todos los movimientos.</p>
      </div>

      {movimientos.length === 0 ? (
        <div className="p-4 bg-yellow-50 border rounded text-center">
          <p className="text-sm md:text-base mb-3">No hay movimientos registrados.</p>
          <button 
            onClick={() => navigate('/movimientos/registrar?tipo=entrada')} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm md:text-base min-h-[44px]"
          >
            Registrar Primer Movimiento
          </button>
        </div>
      ) : (
        <>
          {/* Mobile: Cards */}
          <div className="md:hidden space-y-3">
            {movimientos.map((mov) => (
              <div key={mov._id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <span
                    className={`px-2 py-1 rounded text-white text-xs font-semibold ${
                      mov.tipo === 'entrada' ? 'bg-green-600' : 'bg-red-600'
                    }`}
                  >
                    {mov.tipo.charAt(0).toUpperCase() + mov.tipo.slice(1)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(mov.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {mov.herramienta ? mov.herramienta.nombre : 'Herramienta eliminada'}
                    </h3>
                    {mov.herramienta && (
                      <p className="text-xs text-gray-600">Código: {mov.herramienta.codigo}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="font-medium">Cantidad:</span>
                      <p>{mov.cantidad} {mov.herramienta?.unidad || '-'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Usuario:</span>
                      <p>{mov.usuario?.nombre || 'Desconocido'}</p>
                    </div>
                  </div>

                  {mov.nota && (
                    <div>
                      <span className="font-medium text-xs">Nota:</span>
                      <p className="text-xs text-gray-600 mt-1">{mov.nota}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Tabla */}
          <div className="hidden md:block">
            <div className="overflow-x-auto bg-white shadow-sm rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Movimiento</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Herramienta</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidad</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nota</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {movimientos.map((mov) => (
                    <tr key={mov._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-white text-xs font-semibold ${
                            mov.tipo === 'entrada' ? 'bg-green-600' : 'bg-red-600'
                          }`}
                        >
                          {mov.tipo.charAt(0).toUpperCase() + mov.tipo.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {mov.herramienta ? mov.herramienta.nombre : 'Herramienta eliminada'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm">{mov.cantidad}</td>
                      <td className="px-4 py-3 text-sm">{mov.herramienta?.unidad || '-'}</td>
                      <td className="px-4 py-3 text-sm">{mov.usuario?.nombre || 'Desconocido'}</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {new Date(mov.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {mov.nota ? (
                          <span className="text-gray-600">{mov.nota}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => generarReporteMovimientoIndividual(mov)}
                          className="bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700 text-xs flex items-center gap-1"
                          title="Imprimir movimiento individual"
                        >
                          <FaPrint size={10} /> PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Información de resultados */}
      {movimientos.length > 0 && (
        <div className="mt-4 text-center">
          <p className="text-xs md:text-sm text-gray-600">
            Mostrando {movimientos.length} movimiento{movimientos.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}