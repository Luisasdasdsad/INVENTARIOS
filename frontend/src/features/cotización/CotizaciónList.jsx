import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { FaEdit, FaTrash, FaPlus, FaSearch, FaFilePdf } from "react-icons/fa";
import generarReporteCotizacion from "../../utils/generarReporteCotización";

const CotizaciónList = () => {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchCotizaciones();
  }, []);

  const fetchCotizaciones = async () => {
    setLoading(true);
    setError(null);
    try {
      // 🔄 CAMBIO: Usar la ruta de MIS cotizaciones
      const res = await api.get("/cotizaciones/mis-cotizaciones");
      setCotizaciones(res.data);
    } catch (err) {
      setError("Error al cargar cotizaciones");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCotizaciones = cotizaciones.filter((cotizacion) =>
    cotizacion.numeroCotizacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cotizacion.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cotizacion.observaciones?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (cotizacion) => {
    navigate("/cotización", { state: { cotizacion } });
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta cotización?")) {
      try {
        await api.delete(`/cotizaciones/${id}`);
        setCotizaciones(cotizaciones.filter((c) => c._id !== id));
      } catch (err) {
        console.error("Error al eliminar cotización:", err);
        alert(err.response?.data?.msg || "Error al eliminar la cotización");
      }
    }
  };

  const handleNuevaCotizacion = () => {
    navigate("/cotización");
  };

  const handleImprimir = async (cotizacion) => {
    try {
      // Calcular totales basados en productos
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

      // Formatear fecha
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

  if (loading)
    return (
      <div className="text-center p-6 text-gray-600 animate-pulse">
        Cargando cotizaciones...
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
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
          Mis Cotizaciones
        </h2>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cotización, cliente u observación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 w-full text-sm md:text-base"
            />
          </div>

          <button
            onClick={handleNuevaCotizacion}
            className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium px-4 py-2 rounded-lg shadow-sm transition-colors"
          >
            <FaPlus size={14} /> Nueva Cotización
          </button>
        </div>
      </div>

      {/* Lista */}
      {filteredCotizaciones.length === 0 ? (
        <div className="text-center py-10 text-gray-600 text-sm md:text-base bg-gray-50 rounded-lg">
          {searchTerm
            ? "No se encontraron cotizaciones que coincidan con la búsqueda."
            : "No has creado cotizaciones aún."}
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {/* Móvil - Tarjetas */}
          <div className="md:hidden space-y-3">
            {filteredCotizaciones.map((cotizacion) => (
              <div
                key={cotizacion._id}
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition"
              >
                <h3 className="text-base font-bold text-gray-900 mb-2">
                  Cotización #{cotizacion.numeroCotizacion}
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="font-semibold">Cliente:</span>{" "}
                    {cotizacion.cliente.nombre}
                  </p>
                  <p>
                    <span className="font-semibold">Fecha:</span>{" "}
                    {new Date(cotizacion.fecha).toLocaleDateString()}
                  </p>
                  <p>
                    <span className="font-semibold">Total:</span> S/{" "}
                    {cotizacion.totalGeneral?.toFixed(2) || "0.00"}
                  </p>
                  <p>
                    <span className="font-semibold">Productos:</span>{" "}
                    {cotizacion.productos?.length || 0}
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => handleImprimir(cotizacion)}
                    className="flex-1 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 text-xs font-medium"
                  >
                    <FaFilePdf className="inline-block mr-1" /> Imprimir
                  </button>
                  <button
                    onClick={() => handleEdit(cotizacion)}
                    className="flex-1 bg-yellow-500 text-black py-2 rounded-md hover:bg-yellow-600 text-xs font-medium"
                  >
                    <FaEdit className="inline-block mr-1" /> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(cotizacion._id)}
                    className="flex-1 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 text-xs font-medium"
                  >
                    <FaTrash className="inline-block mr-1" /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Escritorio - Tabla */}
          <div className="hidden md:block">
            <div className="overflow-x-auto bg-white shadow-sm rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-yellow-100 text-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">N° Cotización</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Moneda</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Productos</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Acciones</th>
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
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(cotizacion.fecha).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {cotizacion.moneda}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        S/ {cotizacion.totalGeneral?.toFixed(2) || "0.00"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {cotizacion.productos?.length || 0}
                      </td>
                      <td className="px-4 py-3 text-sm space-x-2">
                        <button
                          onClick={() => handleImprimir(cotizacion)}
                          className="text-blue-600 hover:text-blue-700 font-medium text-xs"
                        >
                          <FaFilePdf className="inline-block mr-1" /> Imprimir
                        </button>
                        <button
                          onClick={() => handleEdit(cotizacion)}
                          className="text-yellow-600 hover:text-yellow-700 font-medium text-xs"
                        >
                          <FaEdit className="inline-block mr-1" /> Editar
                        </button>
                        <button
                          onClick={() => handleDelete(cotizacion._id)}
                          className="text-red-600 hover:text-red-700 font-medium text-xs"
                        >
                          <FaTrash className="inline-block mr-1" /> Eliminar
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