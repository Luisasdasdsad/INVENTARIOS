import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import Modal from "../../components/Modal/Modal";
import { FaEdit, FaTrash, FaPlus, FaSearch, FaFilePdf } from "react-icons/fa";

const CotizaciónList = () => {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCotizaciones();
  }, []);

  const fetchCotizaciones = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/cotizaciones");
      setCotizaciones(res.data);
    } catch (err) {
      setError("Error al cargar cotizaciones");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCotizaciones = cotizaciones.filter(cotizacion =>
    cotizacion.numeroCotizacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cotizacion.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cotizacion.observaciones?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (cotizacion) => {
    navigate('/cotización', { state: { cotizacion } });
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta cotización?")) {
      try {
        await api.delete(`/cotizaciones/${id}`);
        setCotizaciones(cotizaciones.filter(c => c._id !== id));
      } catch (err) {
        console.error("Error al eliminar cotización:", err);
      }
    }
  };

  const handleNuevaCotizacion = () => {
    navigate('/cotización');
  };

  if (loading) return <div className="text-center p-4 md:p-8 text-gray-600">Cargando cotizaciones...</div>;
  if (error) return <div className="text-center p-4 md:p-8 text-red-500 bg-red-50 rounded-md m-2 md:m-4">Error: {error}</div>;

  return (
    <div className="p-2 md:p-4 lg:p-6 max-w-7xl w-full mx-auto">
      {/* Header Mejorado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800 whitespace-nowrap">Cotizaciones</h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Buscar por número, cliente u observaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm md:text-base"
              />
            </div>
          </div>
        </div>
        <button
          onClick={handleNuevaCotizacion}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-md hover:bg-blue-700 transition-colors min-h-[44px] w-full sm:w-auto text-xs md:text-sm"
        >
          <FaPlus size={14} /> Nueva Cotización
        </button>
      </div>

      {filteredCotizaciones.length === 0 ? (
        <div className="text-center py-8 md:py-12 text-gray-600 text-sm md:text-base">
          {searchTerm ? 'No hay cotizaciones que coincidan con la búsqueda.' : 'No hay cotizaciones registradas.'}
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {/* Mobile: Cards Mejoradas */}
          <div className="md:hidden space-y-3">
            {filteredCotizaciones.map((cotizacion) => (
              <div key={cotizacion._id} className="bg-white p-3 rounded-lg shadow-sm border divide-y divide-gray-200">
                <div className="space-y-2 mb-3">
                  <h3 className="text-base font-semibold text-gray-900">Cotización #{cotizacion.numeroCotizacion}</h3>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p><span className="font-medium">Cliente:</span> {cotizacion.cliente.nombre}</p>
                    <p><span className="font-medium">Fecha:</span> {new Date(cotizacion.fecha).toLocaleDateString()}</p>
                    <p><span className="font-medium">Moneda:</span> {cotizacion.moneda}</p>
                    <p><span className="font-medium">Total:</span> S/ {cotizacion.totalGeneral?.toFixed(2) || '0.00'}</p>
                    <p><span className="font-medium">Productos:</span> {cotizacion.productos?.length || 0}</p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 pt-3">
                  <button
                    onClick={() => handleEdit(cotizacion)}
                    className="flex-1 flex items-center justify-center gap-1 bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 text-xs min-h-[40px]"
                  >
                    <FaEdit size={12} /> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(cotizacion._id)}
                    className="flex-1 flex items-center justify-center gap-1 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 text-xs min-h-[40px]"
                  >
                    <FaTrash size={12} /> Eliminar
                  </button>
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Cotización</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Moneda</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Productos</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCotizaciones.map((cotizacion) => (
                    <tr key={cotizacion._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{cotizacion.numeroCotizacion}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {cotizacion.cliente.nombre}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {new Date(cotizacion.fecha).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {cotizacion.moneda}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        S/ {cotizacion.totalGeneral?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {cotizacion.productos?.length || 0}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(cotizacion)}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1 text-xs"
                        >
                          <FaEdit size={10} /> Editar
                        </button>
                        <button
                          onClick={() => handleDelete(cotizacion._id)}
                          className="text-red-600 hover:text-red-900 flex items-center gap-1 text-xs"
                        >
                          <FaTrash size={10} /> Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CotizaciónList;
