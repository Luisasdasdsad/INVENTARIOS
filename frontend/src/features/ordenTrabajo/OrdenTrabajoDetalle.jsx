import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FaPrint, FaEdit, FaArrowLeft, FaCalendar, FaUser, FaTools, FaBox, FaMapMarkerAlt, FaClipboardList } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function OrdenTrabajoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orden, setOrden] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrden = async () => {
      try {
        const res = await api.get(`/ordenes-trabajo/${id}`);
        setOrden(res.data);
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar la orden de trabajo.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrden();
  }, [id]);

  const handleImprimir = async () => {
     try {
      const { default: generarReporte } = await import("../../utils/generarReporteOrdenTrabajo");
      generarReporte(orden);
      toast.success("Reporte generado");
    } catch (err) {
      console.error("Error al generar reporte:", err);
      toast.error("Error al generar el reporte");
    }
  };

  // Helper para fechas
  const formatLocalDate = (d) => {
    if (!d) return "-";
    try {
      const s = typeof d === 'string' ? d : (d.toISOString ? d.toISOString() : String(d));
      const datePart = s.slice(0, 10);
      const [y, m, day] = datePart.split('-');
      return new Date(parseInt(y), parseInt(m) - 1, parseInt(day)).toLocaleDateString();
    } catch (err) {
      return new Date(d).toLocaleDateString();
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "pendiente": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "en_proceso": return "bg-blue-100 text-blue-800 border-blue-200";
      case "completado": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando detalles...</div>;
  if (error) return <div className="p-8 text-center text-red-600 bg-red-50 rounded m-4">{error}</div>;
  if (!orden) return <div className="p-8 text-center">Orden no encontrada</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{orden.numeroOT}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getEstadoColor(orden.estado)}`}>
              {orden.estado?.toUpperCase().replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleImprimir}
            className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            <FaPrint /> Imprimir
          </button>
          {user?.rol === 'admin' && (
            <Link 
              to={`/ordenes-trabajo/editar/${orden._id}`}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
            >
              <FaEdit /> Editar
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Columna Principal */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Tarjeta: Información General */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
              <FaClipboardList className="text-indigo-500"/> Descripción del Servicio
            </h2>
            <p className="text-gray-700 whitespace-pre-line bg-gray-50 p-4 rounded border border-gray-100">
              {orden.descripcionServicio || "Sin descripción."}
            </p>
            
            {orden.observaciones && (
              <div className="mt-4">
                <h3 className="font-medium text-gray-700 mb-1">Observaciones:</h3>
                <p className="text-sm text-gray-600">{orden.observaciones}</p>
              </div>
            )}
          </div>

          {/* Tarjeta: Productos y Herramientas */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
              <FaBox className="text-orange-500"/> Materiales y Herramientas
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-600 mb-2 border-b pb-1">Productos</h3>
                {orden.productos?.length > 0 ? (
                  <ul className="space-y-2">
                    {orden.productos.map((p, i) => (
                      <li key={i} className="text-sm flex justify-between">
                        <span>{p.producto?.nombre || "Producto eliminado"}</span>
                        <span className="font-bold text-gray-500">x{p.cantidad}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-gray-400 italic">No hay productos asignados.</p>}
              </div>

              <div>
                <h3 className="font-medium text-gray-600 mb-2 border-b pb-1">Herramientas</h3>
                {orden.herramientas?.length > 0 ? (
                  <ul className="space-y-2">
                    {orden.herramientas.map((h, i) => (
                      <li key={i} className="text-sm flex justify-between">
                        <span>{h.herramienta?.nombre || "Herramienta eliminada"}</span>
                        <span className="font-bold text-gray-500">x{h.cantidad}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-gray-400 italic">No hay herramientas asignadas.</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Columna Lateral */}
        <div className="space-y-6">
          
          {/* Tarjeta: Cliente */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h2 className="text-md font-bold text-gray-700 mb-3 flex items-center gap-2">
              <FaUser className="text-blue-500"/> Cliente
            </h2>
            <div className="text-sm space-y-2">
              <p className="font-medium text-gray-900">{orden.cliente?.nombre || "No asignado"}</p>
              {orden.cliente?.ruc && <p className="text-gray-500">RUC: {orden.cliente.ruc}</p>}
              {orden.cliente?.telefono && <p className="text-gray-500">Tel: {orden.cliente.telefono}</p>}
              {orden.cliente?.email && <p className="text-gray-500 truncate" title={orden.cliente.email}>{orden.cliente.email}</p>}
            </div>
          </div>

          {/* Tarjeta: Técnico */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h2 className="text-md font-bold text-gray-700 mb-3 flex items-center gap-2">
              <FaTools className="text-gray-500"/> Técnico Asignado
            </h2>
            <div className="text-sm space-y-2">
              {orden.tecnicoAsignado ? (
                <>
                  <p className="font-medium text-gray-900">{orden.tecnicoAsignado.nombre}</p>
                  <p className="text-gray-500">{orden.tecnicoAsignado.email}</p>
                </>
              ) : (
                <p className="text-gray-400 italic">Sin asignar</p>
              )}
            </div>
            {orden.instruccionesTecnico && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500">Instrucciones:</p>
                <p className="text-xs text-gray-600 mt-1">{orden.instruccionesTecnico}</p>
              </div>
            )}
          </div>

          {/* Tarjeta: Detalles */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h2 className="text-md font-bold text-gray-700 mb-3 flex items-center gap-2">
              <FaCalendar className="text-green-500"/> Fechas y Lugar
            </h2>
            <div className="text-sm space-y-3">
              <div>
                <p className="text-xs text-gray-500">Fecha Inicio</p>
                <p className="font-medium">{formatLocalDate(orden.fechaInicio)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Fecha Fin</p>
                <p className="font-medium">{formatLocalDate(orden.fechaFin)}</p>
              </div>
              {orden.ubicacion && (
                <div>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><FaMapMarkerAlt size={10}/> Ubicación</p>
                  <p className="font-medium">{orden.ubicacion}</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
