import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { FaSearch, FaPlay, FaCheck, FaClock, FaPrint, FaPlus, FaTrash, FaEdit, FaWhatsapp, FaEnvelope } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from 'react-hot-toast';

// Formatear fechas ignorando desplazamientos de zona horaria: usar la porción YYYY-MM-DD
const formatLocalDate = (d) => {
  if (!d) return "-";
  try {
    const s = typeof d === 'string' ? d : (d.toISOString ? d.toISOString() : String(d));
    const datePart = s.slice(0, 10); // YYYY-MM-DD
    const [y, m, day] = datePart.split('-');
    if (!y || !m || !day) return new Date(d).toLocaleDateString();
    return new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(day, 10)).toLocaleDateString();
  } catch (err) {
    return new Date(d).toLocaleDateString();
  }
};

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
      const res = await api.get("/ordenes-trabajo");
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
    (orden.cliente?.nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    orden.observaciones?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCambiarEstado = async (id, nuevoEstado) => {
    try {
      await api.patch(`/ordenes-trabajo/${id}/estado`, { estado: nuevoEstado });
      setOrdenes(ordenes.map(orden =>
        orden._id === id ? { ...orden, estado: nuevoEstado } : orden
      ));
      toast.success(`Estado actualizado a: ${nuevoEstado.replace('_', ' ')}`);
    } catch (err) {
      console.error("Error al cambiar estado:", err);
      toast.error(err.response?.data?.message || "Error al cambiar estado");
    }
  };

  const handleEliminarOrden = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta orden de trabajo? Esta acción no se puede deshacer.")) {
      try {
        await api.delete(`/ordenes-trabajo/${id}`);
        // Actualizar el estado para remover la orden eliminada de la lista
        setOrdenes(ordenes.filter(orden => orden._id !== id));
        toast.success("Orden eliminada correctamente");
      } catch (err) {
        console.error("Error al eliminar la orden:", err);
        toast.error(err.response?.data?.message || "Error al eliminar la orden de trabajo");
      }
    }
  };

  const handleImprimirOrden = async (orden) => {
    try {
      // Obtener detalles completos de la orden si es necesario
      const res = await api.get(`/ordenes-trabajo/${orden._id}`);
      const { default: generarReporte } = await import("../../utils/generarReporteOrdenTrabajo");
      generarReporte(res.data);
      toast.success("Reporte generado");
    } catch (err) {
      console.error("Error al generar reporte:", err);
      toast.error("Error al generar el reporte");
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

  // Helper para generar enlace de WhatsApp
  const getWhatsAppLink = (numero) => {
    if (!numero) return null;
    const cleanNum = numero.replace(/\D/g, ''); // Quitar no numéricos
    const fullNum = cleanNum.length === 9 ? `51${cleanNum}` : cleanNum; // Asumir Perú si es 9 dígitos
    return `https://wa.me/${fullNum}`;
  };

  // Helper para generar enlace directo a Gmail
  const getGmailLink = (email) => {
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${email}`;
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
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
            Mis Órdenes de Trabajo
          </h2>

          {/* Botón Crear - visible para admin */}
          {user && (user.rol === 'admin' || user.rol === 'ingeniero') && (
            <Link
              to="/ordenes-trabajo/crear"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-sm transition-colors"
            >
              <FaPlus size={14} /> Nueva Orden
            </Link>
          )}
        </div>

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
                    <span className="font-semibold">Cliente:</span> {orden.cliente ? `${orden.cliente.nombre} (${orden.cliente.tipoDoc} ${orden.cliente.tipoDoc === 'RUC' ? orden.cliente.ruc : orden.cliente.numero})` : 'No asignado'}
                  </p>
                  {/* Iconos de contacto en Móvil */}
                  {orden.cliente && (
                    <div className="flex gap-3 mt-1 pl-1">
                      {(orden.cliente.celular || orden.cliente.telefono) && (
                        <a 
                          href={getWhatsAppLink(orden.cliente.celular || orden.cliente.telefono)}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-green-500 hover:text-green-600 flex items-center gap-1 text-xs font-medium"
                        >
                          <FaWhatsapp size={16} /> WhatsApp
                        </a>
                      )}
                      {orden.cliente.email && (
                        <a 
                          href={getGmailLink(orden.cliente.email)}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600 flex items-center gap-1 text-xs font-medium"
                        >
                          <FaEnvelope size={16} /> Correo
                        </a>
                      )}
                    </div>
                  )}
                  <p className="mt-1">
                    <span className="font-semibold">Responsable:</span> {orden.tecnicoAsignado ? orden.tecnicoAsignado.nombre : 'Sin asignar'}
                  </p>
                  {orden.tecnicoAsignado && (
                    <div className="flex gap-3 mt-1 pl-1">
                      {(orden.tecnicoAsignado.celular || orden.tecnicoAsignado.telefono) && (
                        <a 
                          href={getWhatsAppLink(orden.tecnicoAsignado.celular || orden.tecnicoAsignado.telefono)}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-green-500 hover:text-green-600 flex items-center gap-1 text-xs font-medium"
                        >
                          <FaWhatsapp size={16} /> WhatsApp
                        </a>
                      )}
                      {orden.tecnicoAsignado.email && (
                        <a 
                          href={getGmailLink(orden.tecnicoAsignado.email)}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600 flex items-center gap-1 text-xs font-medium"
                        >
                          <FaEnvelope size={16} /> Correo
                        </a>
                      )}
                    </div>
                  )}
                  <p>
                    <span className="font-semibold">Productos/Herramientas:</span> {orden.productos?.length || 0}
                  </p>
                  {orden.fechaInicio && (
                    <p>
                      <span className="font-semibold">Inicio:</span> {formatLocalDate(orden.fechaInicio)}
                    </p>
                  )}
                  {orden.fechaFin && (
                    <p>
                      <span className="font-semibold">Fin:</span> {formatLocalDate(orden.fechaFin)}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => handleImprimirOrden(orden)}
                    className="flex-1 bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600 text-xs font-medium"
                  >
                    <FaPrint className="inline-block mr-1" /> Imprimir
                  </button>
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
                  {/* Botón de Eliminar solo para Admin */}
                  {user?.rol === 'admin' && (
                    <>
                      <Link to={`/ordenes-trabajo/editar/${orden._id}`} className="flex-1 bg-yellow-500 text-white py-2 rounded-md hover:bg-yellow-600 text-xs font-medium text-center">
                        <FaEdit className="inline-block mr-1" /> Editar
                      </Link>
                      <button
                        onClick={() => handleEliminarOrden(orden._id)}
                        className="flex-1 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 text-xs font-medium"
                      >
                        <FaTrash className="inline-block mr-1" /> Eliminar
                      </button>
                    </>
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
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Responsable</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Herramientas/Productos</th>
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
                        <div>
                          {orden.cliente ? `${orden.cliente.nombre} (${orden.cliente.tipoDoc} ${orden.cliente.tipoDoc === 'RUC' ? orden.cliente.ruc : orden.cliente.numero})` : 'No asignado'}
                        </div>
                        {/* Iconos de contacto en Escritorio */}
                        {orden.cliente && (
                          <div className="flex gap-2 mt-1">
                            {(orden.cliente.celular || orden.cliente.telefono) && (
                              <a 
                                href={getWhatsAppLink(orden.cliente.celular || orden.cliente.telefono)}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-green-500 hover:text-green-600"
                                title={`WhatsApp: ${orden.cliente.celular || orden.cliente.telefono}`}
                              >
                                <FaWhatsapp size={18} />
                              </a>
                            )}
                            {orden.cliente.email && (
                              <a 
                                href={getGmailLink(orden.cliente.email)}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-600" 
                                title={`Enviar correo a: ${orden.cliente.email}`}
                              >
                                <FaEnvelope size={18} />
                              </a>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {orden.tecnicoAsignado ? (
                          <div>
                            <div className="font-medium">{orden.tecnicoAsignado.nombre}</div>
                            <div className="flex gap-2 mt-1">
                              {(orden.tecnicoAsignado.celular || orden.tecnicoAsignado.telefono) && (
                                <a 
                                  href={getWhatsAppLink(orden.tecnicoAsignado.celular || orden.tecnicoAsignado.telefono)}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-green-500 hover:text-green-600"
                                  title={`WhatsApp: ${orden.tecnicoAsignado.celular || orden.tecnicoAsignado.telefono}`}
                                >
                                  <FaWhatsapp size={18} />
                                </a>
                              )}
                              {orden.tecnicoAsignado.email && (
                                <a 
                                  href={getGmailLink(orden.tecnicoAsignado.email)}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:text-blue-600" 
                                  title={`Enviar correo a: ${orden.tecnicoAsignado.email}`}
                                >
                                  <FaEnvelope size={18} />
                                </a>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getEstadoColor(orden.estado)}`}>
                          {getEstadoIcon(orden.estado)} {orden.estado.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {orden.productos?.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {orden.productos.map((p, i) => (
                              <div key={i} className="text-xs truncate max-w-[200px]" title={p.producto?.nombre}>
                                • {p.producto?.nombre || "Producto eliminado"} (x{p.cantidad})
                              </div>
                            ))}
                          </div>
                        ) : orden.herramientas?.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {orden.herramientas.map((h, i) => (
                              <div key={i} className="text-xs truncate max-w-[200px]" title={h.herramienta?.nombre}>
                                • {h.herramienta?.nombre || "Herramienta eliminada"} (x{h.cantidad})
                              </div>
                            ))}
                          </div>
                        ) : (
                          "0"
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatLocalDate(orden.fechaInicio)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatLocalDate(orden.fechaFin)}
                      </td>
                      <td className="px-4 py-3 text-sm space-x-2">
                        <button
                          onClick={() => handleImprimirOrden(orden)}
                          className="text-gray-600 hover:text-gray-700 font-medium text-xs"
                        >
                          <FaPrint className="inline-block mr-1" /> Imprimir
                        </button>
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
                        {/* Botón de Eliminar solo para Admin */}
                        {user?.rol === 'admin' && (
                          <>
                            <Link to={`/ordenes-trabajo/editar/${orden._id}`} className="text-yellow-600 hover:text-yellow-700 font-medium text-xs">
                              <FaEdit className="inline-block mr-1" /> Editar
                            </Link>
                            <button
                              onClick={() => handleEliminarOrden(orden._id)}
                              className="text-red-600 hover:text-red-700 font-medium text-xs"
                            >
                              <FaTrash className="inline-block mr-1" /> Eliminar
                            </button>
                          </>
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
