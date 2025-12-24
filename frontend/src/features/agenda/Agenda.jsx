import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { FaPlus, FaTrash, FaChevronDown, FaChevronUp, FaCircle, FaChevronLeft, FaChevronRight, FaCalendarDay } from 'react-icons/fa';

const Agenda = () => {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [loading, setLoading] = useState(true);
  
  // Estado para el formulario de nueva actividad rápida
  const [nuevaActividad, setNuevaActividad] = useState("");
  const [expandedEventId, setExpandedEventId] = useState(null);

  useEffect(() => {
    fetchData();
  }, [fechaSeleccionada]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Cargar Eventos (Accesible para todos)
      const resEventos = await api.get('/eventos');
      const eventosData = resEventos.data;
      setEventos(eventosData);

      // 2. Intentar Cargar Usuarios (Puede fallar si no es admin)
      try {
        const resUsuarios = await api.get('/eventos/usuarios');
        setUsuarios(resUsuarios.data);
      } catch (err) {
        console.warn("No se pudo cargar lista de usuarios completa. Usando modo limitado.");
        
        // Construir lista de usuarios basada en los eventos y el usuario actual
        const usuariosMap = new Map();
        
        // Agregar usuario actual
        if (user) {
            usuariosMap.set(user.id, { 
                _id: user.id, 
                nombre: user.nombre, 
                rol: user.rol, 
                estadoLaboral: 'disponible' // Valor por defecto si no se puede leer
            });
        }

        // Agregar usuarios encontrados en los eventos
        eventosData.forEach(ev => {
            if (ev.user && ev.user._id && !usuariosMap.has(ev.user._id)) {
                usuariosMap.set(ev.user._id, {
                    _id: ev.user._id,
                    nombre: ev.user.nombre || 'Usuario',
                    rol: 'Miembro', // No tenemos el rol real
                    estadoLaboral: 'disponible' // No tenemos el estado real
                });
            }
        });
        
        setUsuarios(Array.from(usuariosMap.values()));
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
      toast.error("Error al cargar la agenda.");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar eventos para la fecha seleccionada
  const getEventosPorUsuario = (usuarioId) => {
    return eventos.filter(ev => {
      const fechaEvento = new Date(ev.start);
      const fechaSel = new Date(fechaSeleccionada);
      return (
        ev.user?._id === usuarioId &&
        fechaEvento.getDate() === fechaSel.getDate() &&
        fechaEvento.getMonth() === fechaSel.getMonth() &&
        fechaEvento.getFullYear() === fechaSel.getFullYear()
      );
    });
  };

  // Cambiar estado laboral (Disposición)
  const handleEstadoChange = async (nuevoEstado) => {
    try {
      // Actualizamos localmente primero para feedback inmediato
      setUsuarios(prev => prev.map(u => u._id === user.id ? { ...u, estadoLaboral: nuevoEstado } : u));
      
      await api.put(`/usuarios/${user.id}`, { estadoLaboral: nuevoEstado });
      toast.success("Estado actualizado");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.msg || "No se pudo actualizar el estado");
      fetchData(); // Revertir si falla
    }
  };

  // Agregar actividad rápida
  const handleAgregarActividad = async (e) => {
    e.preventDefault();
    if (!nuevaActividad.trim()) return;

    try {
      // Crear fecha de inicio (ahora mismo o inicio del día seleccionado)
      const start = new Date(fechaSeleccionada);
      const now = new Date();
      // Si es hoy, usamos la hora actual, si no, las 9:00 AM
      if (start.toDateString() === now.toDateString()) {
        start.setHours(now.getHours(), now.getMinutes());
      } else {
        start.setHours(9, 0);
      }
      
      const end = new Date(start);
      end.setHours(start.getHours() + 1); // Duración por defecto 1h

      const res = await api.post('/eventos', {
        title: nuevaActividad,
        start,
        end,
        allDay: false,
        description: "Actividad rápida"
      });

      setEventos([...eventos, res.data]);
      setNuevaActividad("");
      toast.success("Actividad agregada");
    } catch (error) {
      console.error(error);
      toast.error("Error al agregar actividad");
    }
  };

  const handleEliminarActividad = async (id) => {
    if (!window.confirm("¿Borrar esta actividad?")) return;
    try {
      await api.delete(`/eventos/${id}`);
      setEventos(eventos.filter(e => e._id !== id));
      toast.success("Eliminada");
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const toggleExpand = (id) => {
    setExpandedEventId(expandedEventId === id ? null : id);
  };

  // Helper para mostrar roles formateados
  const getRolLabel = (rol) => {
    switch (rol) {
      case 'superadmin': return 'Super Admin';
      case 'admin': return 'Administrador';
      case 'tecnico': return 'Técnico';
      case 'ingeniero': return 'Ingeniero';
      case 'trabajador': return 'Trabajador';
      case 'jefe_inventario': return 'Jefe de Inventario';
      case 'administracion': return 'Administración';
      default: return rol ? rol.charAt(0).toUpperCase() + rol.slice(1) : '';
    }
  };

  // Configuración de estados
  const estados = {
    disponible: { label: "Disponible", color: "bg-green-500", text: "text-green-700", bg: "bg-green-50" },
    poco_atareado: { label: "Poco Atareado", color: "bg-yellow-500", text: "text-yellow-700", bg: "bg-yellow-50" },
    muy_atareado: { label: "Muy Atareado", color: "bg-red-500", text: "text-red-700", bg: "bg-red-50" },
    no_disponible: { label: "No Disponible", color: "bg-gray-500", text: "text-gray-700", bg: "bg-gray-50" }
  };

  const cambiarDia = (dias) => {
    const nuevaFecha = new Date(fechaSeleccionada);
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);
    setFechaSeleccionada(nuevaFecha);
  };

  const esHoy = new Date().toDateString() === fechaSeleccionada.toDateString();

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header y Navegación de Fecha */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Actividades del Equipo</h1>
          <p className="text-gray-500 text-sm">Gestiona tu disposición y tareas diarias</p>
        </div>

        <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 p-1">
          <button onClick={() => cambiarDia(-1)} className="p-2 hover:bg-gray-100 rounded-md text-gray-600">
            <FaChevronLeft />
          </button>
          <div className="px-4 py-1 flex items-center gap-2 font-medium text-gray-700 min-w-[200px] justify-center">
            <FaCalendarDay className="text-indigo-500" />
            {esHoy ? "Hoy, " : ""}
            {fechaSeleccionada.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <button onClick={() => cambiarDia(1)} className="p-2 hover:bg-gray-100 rounded-md text-gray-600">
            <FaChevronRight />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Cargando equipo...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Tarjeta del Usuario Actual (Siempre primero) */}
          {usuarios.filter(u => u._id === user.id).map(miUsuario => (
            <div key={miUsuario._id} className="bg-white rounded-xl shadow-md border-t-4 border-indigo-500 overflow-hidden flex flex-col h-full">
              <div className="p-4 border-b border-gray-100 bg-indigo-50/30">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                      {miUsuario.nombre.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{miUsuario.nombre} (Tú)</h3>
                      <p className="text-xs text-gray-500">{getRolLabel(miUsuario.rol)}</p>
                    </div>
                  </div>
                </div>

                {/* Selector de Estado */}
                <div className="mt-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Tu Disposición:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(estados).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => handleEstadoChange(key)}
                        className={`text-xs px-2 py-1.5 rounded-md border transition-all flex items-center justify-center gap-1.5 ${
                          miUsuario.estadoLaboral === key 
                            ? `${config.bg} ${config.text} border-${config.color.replace('bg-', '')} ring-1 ring-${config.color.replace('bg-', '')}` 
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <FaCircle className={`text-[8px] ${config.color.replace('bg-', 'text-')}`} />
                        {config.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Lista de Actividades */}
              <div className="p-4 flex-1 bg-gray-50/50">
                <div className="mb-4">
                  <form onSubmit={handleAgregarActividad} className="flex gap-2">
                    <input
                      type="text"
                      value={nuevaActividad}
                      onChange={(e) => setNuevaActividad(e.target.value)}
                      placeholder="¿Qué harás hoy?"
                      className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors">
                      <FaPlus />
                    </button>
                  </form>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {getEventosPorUsuario(miUsuario._id).length === 0 ? (
                    <p className="text-center text-sm text-gray-400 py-4 italic">No tienes actividades registradas para este día.</p>
                  ) : (
                    getEventosPorUsuario(miUsuario._id).map(ev => (
                      <div key={ev._id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden group">
                        <div 
                          onClick={() => toggleExpand(ev._id)}
                          className="p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-sm font-medium text-gray-800">{ev.title}</span>
                          <div className="flex items-center gap-2">
                             <button 
                              onClick={(e) => { e.stopPropagation(); handleEliminarActividad(ev._id); }}
                              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            >
                              <FaTrash size={12} />
                            </button>
                            {expandedEventId === ev._id ? <FaChevronUp size={10} className="text-gray-400"/> : <FaChevronDown size={10} className="text-gray-400"/>}
                          </div>
                        </div>
                        {expandedEventId === ev._id && (
                          <div className="px-3 pb-3 pt-0 text-xs text-gray-600 border-t border-gray-100 bg-gray-50">
                            <div className="mt-2">
                              <p><strong>Hora:</strong> {new Date(ev.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                              {ev.description && <p className="mt-1">{ev.description}</p>}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Tarjetas de Otros Usuarios */}
          {usuarios.filter(u => u._id !== user.id).map(otroUsuario => {
            const estadoConfig = estados[otroUsuario.estadoLaboral || 'disponible'];
            const actividades = getEventosPorUsuario(otroUsuario._id);

            return (
              <div key={otroUsuario._id} className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
                <div className="p-4 border-b border-gray-100 flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
                      {otroUsuario.nombre.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm">{otroUsuario.nombre}</h3>
                      <p className="text-xs text-gray-500">{getRolLabel(otroUsuario.rol)}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full border flex items-center gap-1 ${estadoConfig.bg} ${estadoConfig.text} border-${estadoConfig.color.replace('bg-', '')}-200`}>
                    <FaCircle className={`text-[6px] ${estadoConfig.color.replace('bg-', 'text-')}`} />
                    {estadoConfig.label}
                  </span>
                </div>

                <div className="p-4 flex-1 bg-gray-50/30">
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {actividades.length === 0 ? (
                      <p className="text-center text-xs text-gray-400 py-4 italic">Sin actividades.</p>
                    ) : (
                      actividades.map(ev => (
                        <div key={ev._id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                          <div 
                            onClick={() => toggleExpand(ev._id)}
                            className="p-2.5 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                          >
                            <span className="text-sm text-gray-700">{ev.title}</span>
                            {expandedEventId === ev._id ? <FaChevronUp size={10} className="text-gray-400"/> : <FaChevronDown size={10} className="text-gray-400"/>}
                          </div>
                          {expandedEventId === ev._id && (
                            <div className="px-3 pb-2 pt-0 text-xs text-gray-500 border-t border-gray-100 bg-gray-50">
                              <p className="mt-1">Hora: {new Date(ev.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Agenda;
