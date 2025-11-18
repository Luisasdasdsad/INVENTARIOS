import { useState, useEffect } from "react";
import api from "../../services/api";
import { FaSearch, FaPlay, FaCheck, FaClock } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";

const OrdenTrabajoList = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    fetchOrdenes();
  }, []);

  const fetchOrdenes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/orden-trabajo/listar");
      // El backend ya filtra según el rol del usuario
      setOrdenes(res.data);
    } catch (err) {
      setError("Error al cargar órdenes de trabajo");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrdenes = ordenes.filter((orden) =>
    orden.numeroOT.toLowerCase().includes(searchTerm.toLowerCase()) ||
    orden.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    orden.observaciones?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCambiarEstado = async (id, nuevoEstado) => {
    try {
      await api.put(`/orden-trabajo/estado/${id}`, { estado: nuevoEstado });
      setOrdenes(ordenes.map(orden =>
        orden._id === id ? { ...orden, estado: nuevoEstado } : orden
      ));
    } catch (err) {
      console.error("Error al cambiar estado:", err);
      alert(err.response?.data?.message || "Error al cambiar estado");
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "pendiente": return "bg-yellow-100 text-yellow-800";
      case "en_proceso": return "bg-blue-100 text-blue-800";
      case "completado": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case "pendiente": return <FaClock />;
      case "en_proceso": return <FaPlay />;
      case "completado": return <FaCheck />;
      default: return <FaClock />;
    }
  };

  if (loading)
    return (
      <div className="text-center p-6 text-gray-600 animate-pulse">
        Cargando órdenes de trabajo...
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
          Mis Órdenes de Trabajo
        </h2>

        <div className="relative w-full sm:w-72">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar orden, cliente u observación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 w-full text-sm md:text-base"
          />
        </div>
      </div>

      {/* Lista */}
      {filteredOrdenes.length === 0 ? (
        <div className="text-center py-10 text-gray-600 text-sm md:text-base bg-gray-50 rounded-lg">
          {searchTerm
            ? "No se encontraron órdenes que coincidan con la búsqueda."
            : "No tienes órdenes de trabajo asignadas."}
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {/* Móvil - Tarjetas */}
          <div className="md:hidden space-y-3">
            {filteredOrdenes.map((orden) => (
              <div
                key={orden._id}
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-base font-bold text-gray-900">
                    OT #{orden.numeroOT}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getEstadoColor(orden.estado)}`}>
                    {getEstadoIcon(orden.estado)} {orden.estado.replace("_", " ")}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="font-semibold">Cliente:</span> {orden.cliente}
                  </p>
                  <p>
                    <span className="font-semibold">Productos:</span> {orden.productos?.length || 0}
                  </p>
                  {orden.fechaInicio && (
                    <p>
                      <span className="font-semibold">Inicio:</span> {new Date(orden.fechaInicio).toLocaleDateString()}
                    </p>
                  )}
                  {orden.fechaFin && (
                    <p>
                      <span className="font-semibold">Fin:</span> {new Date(orden.fechaFin).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  {orden.estado === "pendiente" && (
                    <button
                      onClick={() => handleCambiarEstado(orden._id, "en_proceso")}
                      className="flex-1 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 text-xs font-medium"
                    >
                      <FaPlay className="inline-block mr-1" /> Iniciar
                    </button>
                  )}
                  {orden.estado === "en_proceso" && (
                    <button
                      onClick={() => handleCambiarEstado(orden._id, "completado")}
                      className="flex-1 bg-green-500 text-white py-2 rounded-md hover:bg-green-600 text-xs font-medium"
                    >
                      <FaCheck className="inline-block mr-1" /> Completar
                    </button>
                  )}
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
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">N° OT</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Productos</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Fecha Inicio</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Fecha Fin</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrdenes.map((orden) => (
                    <tr
                      key={orden._id}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        #{orden.numeroOT}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {orden.cliente}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getEstadoColor(orden.estado)}`}>
                          {getEstadoIcon(orden.estado)} {orden.estado.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {orden.productos?.length || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {orden.fechaInicio ? new Date(orden.fechaInicio).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {orden.fechaFin ? new Date(orden.fechaFin).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm space-x-2">
                        {orden.estado === "pendiente" && (
                          <button
                            onClick={() => handleCambiarEstado(orden._id, "en_proceso")}
                            className="text-blue-600 hover:text-blue-700 font-medium text-xs"
                          >
                            <FaPlay className="inline-block mr-1" /> Iniciar
                          </button>
                        )}
                        {orden.estado === "en_proceso" && (
                          <button
                            onClick={() => handleCambiarEstado(orden._id, "completado")}
                            className="text-green-600 hover:text-green-700 font-medium text-xs"
                          >
                            <FaCheck className="inline-block mr-1" /> Completar
                          </button>
                        )}
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

export default OrdenTrabajoList;
