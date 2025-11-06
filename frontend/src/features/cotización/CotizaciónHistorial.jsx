import { useState, useEffect } from "react";
import api from "../../services/api";
import { FaFilePdf, FaSearch, FaFilter } from "react-icons/fa";
import generarReporteCotizacion from "../../utils/generarReporteCotización";
import { useAuth } from "../../contexts/AuthContext";

const CotizaciónHistorial = () => {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtros, setFiltros] = useState({
    fechaDesde: "",
    fechaHasta: "",
    page: 1
  });
  const [paginacion, setPaginacion] = useState({});
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchHistorial();
  }, [filtros.page, filtros.fechaDesde, filtros.fechaHasta]);

  const fetchHistorial = async () => {
    setLoading(true);
    setError(null);
    try {
      // Construir query params
      const params = new URLSearchParams();
      params.append('page', filtros.page);
      params.append('limit', 20);
      if (filtros.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
      if (filtros.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);

      const res = await api.get(`/cotizaciones/historial?${params.toString()}`);
      setCotizaciones(res.data.cotizaciones);
      setPaginacion({
        totalPages: res.data.totalPages,
        currentPage: res.data.currentPage,
        total: res.data.total
      });
    } catch (err) {
      setError("Error al cargar historial");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCotizaciones = cotizaciones.filter((cotizacion) =>
    cotizacion.numeroCotizacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cotizacion.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cotizacion.usuario?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cotizacion.observaciones?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImprimir = async (cotizacion) => {
    try {
      const subtotal = cotizacion.productos.reduce((acc, p) => {
        const precioUnit = parseFloat(p.precioUnitario) || 0;
        const cantidad = parseFloat(p.cantidad) || 0;
        const igvUnit = precioUnit * 0.18;
        const vUnit = precioUnit - igvUnit;
        return acc + (vUnit * cantidad);
      }, 0);
      const descuentoAmount = parseFloat(cotizacion.descuento) || 0;
      const igv = cotizacion.productos.reduce((acc, p) => {
        const precioUnit = parseFloat(p.precioUnitario) || 0;
        const cantidad = parseFloat(p.cantidad) || 0;
        const igvUnit = precioUnit * 0.18;
        return acc + (igvUnit * cantidad);
      }, 0);
      const total = subtotal - descuentoAmount + igv;

      const fechaFormateada = new Date(cotizacion.fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });

      await generarReporteCotizacion({
        cliente: {
          nombre: cotizacion.cliente?.nombre || "",
          documento: cotizacion.cliente?.ruc || cotizacion.cliente?.numero || "",
          direccion: cotizacion.cliente?.direccion || "",
          telefono: cotizacion.cliente?.telefono || "#",
        },
        productos: cotizacion.productos.map((p) => ({
          cantidad: p.cantidad,
          unidad: p.unidad || 'UND',
          descripcion: p.descripcion,
          precioUnit: parseFloat(p.precioUnitario) || 0,
        })),
        subtotal,
        descuento: descuentoAmount,
        igv,
        total,
        fecha: fechaFormateada,
        moneda: cotizacion.moneda,
        numeroCotizacion: cotizacion.numeroCotizacion,
        condicionPago: "CONTADO",
        validez: "15 días",
        observaciones: cotizacion.observaciones || "",
        responsable: cotizacion.usuario?.nombre || "N/A",
      });
    } catch (error) {
      console.error("Error al generar el reporte:", error);
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      fechaDesde: "",
      fechaHasta: "",
      page: 1
    });
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor,
      page: campo !== 'page' ? 1 : valor
    }));
  };

  if (loading)
    return (
      <div className="text-center p-6 text-gray-600 animate-pulse">
        Cargando historial...
      </div>
    );
  if (error)
    return (
      <div className="text-center p-6 bg-red-100 text-red-700 rounded-md shadow-sm">
        {error}
      </div>
    );

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
            Historial de Cotizaciones
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {user?.rol === 'admin' ? 'Todas las cotizaciones del sistema' : 'Tus cotizaciones en modo solo lectura'}
          </p>
        </div>

        <button
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <FaFilter size={14} /> Filtros
        </button>
      </div>

      {/* Panel de Filtros */}
      {mostrarFiltros && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Desde
              </label>
              <input
                type="date"
                value={filtros.fechaDesde}
                onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={filtros.fechaHasta}
                onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={limpiarFiltros}
                className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Búsqueda */}
      <div className="mb-6">
        <div className="relative w-full md:w-96">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por número, cliente, usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 w-full"
          />
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Total de cotizaciones:</span> {paginacion.total || 0}
        </p>
      </div>

      {/* Lista */}
      {filteredCotizaciones.length === 0 ? (
        <div className="text-center py-10 text-gray-600 text-sm md:text-base bg-gray-50 rounded-lg">
          {searchTerm
            ? "No se encontraron cotizaciones que coincidan con la búsqueda."
            : "No hay cotizaciones en el historial."}
        </div>
      ) : (
        <>
          <div className="space-y-3 md:space-y-4">
            {/* Móvil - Tarjetas */}
            <div className="md:hidden space-y-3">
              {filteredCotizaciones.map((cotizacion) => (
                <div
                  key={cotizacion._id}
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-base font-bold text-gray-900">
                      #{cotizacion.numeroCotizacion}
                    </h3>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Solo lectura
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <span className="font-semibold">Cliente:</span>{" "}
                      {cotizacion.cliente.nombre}
                    </p>
                    <p>
                      <span className="font-semibold">Usuario:</span>{" "}
                      {cotizacion.usuario?.nombre || "N/A"}
                    </p>
                    <p>
                      <span className="font-semibold">Fecha:</span>{" "}
                      {new Date(cotizacion.fecha).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="font-semibold">Total:</span> S/{" "}
                      {cotizacion.totalGeneral?.toFixed(2) || "0.00"}
                    </p>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => handleImprimir(cotizacion)}
                      className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 text-xs font-medium"
                    >
                      <FaFilePdf className="inline-block mr-1" /> Ver PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Escritorio - Tabla */}
            <div className="hidden md:block">
              <div className="overflow-x-auto bg-white shadow-sm rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-blue-100 text-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">N° Cotización</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Usuario</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Moneda</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCotizaciones.map((cotizacion) => (
                      <tr
                        key={cotizacion._id}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          #{cotizacion.numeroCotizacion}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {cotizacion.cliente.nombre}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {cotizacion.usuario?.nombre || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(cotizacion.fecha).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {cotizacion.moneda}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          S/ {cotizacion.totalGeneral?.toFixed(2) || "0.00"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => handleImprimir(cotizacion)}
                            className="text-blue-600 hover:text-blue-700 font-medium text-xs"
                          >
                            <FaFilePdf className="inline-block mr-1" /> Ver PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Paginación */}
          {paginacion.totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center gap-4">
              <button
                onClick={() => handleFiltroChange('page', filtros.page - 1)}
                disabled={filtros.page === 1}
                className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600">
                Página {paginacion.currentPage} de {paginacion.totalPages}
              </span>
              <button
                onClick={() => handleFiltroChange('page', filtros.page + 1)}
                disabled={filtros.page === paginacion.totalPages}
                className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CotizaciónHistorial;