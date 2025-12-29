import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { FaChevronLeft, FaChevronRight, FaCalendarDay, FaPlus } from 'react-icons/fa';
import ModalConfirmacion from '../../components/ModalConfirmacion';

// FullCalendar imports
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import esLocale from '@fullcalendar/core/locales/es';

const Agenda = () => {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [loading, setLoading] = useState(true);
  
  const [modalEliminar, setModalEliminar] = useState({ show: false, id: null });
  const [modalNuevoEvento, setModalNuevoEvento] = useState({ show: false, selectInfo: null, title: '' });
  const [modalDetalle, setModalDetalle] = useState({ show: false, id: null, title: '', start: null, end: null, userId: null });

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchData();

    // Actualización automática cada 5 segundos (Polling) para ver cambios en tiempo real
    const interval = setInterval(() => {
      fetchData(false); // false para actualización silenciosa
    }, 5000);

    return () => clearInterval(interval);
  }, [user]); // No necesitamos fechaSeleccionada aquí, FullCalendar la maneja

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
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
      if (showLoading) toast.error("Error al cargar la agenda.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // --- Handlers de FullCalendar ---

  // Crear evento al seleccionar un rango de tiempo
  const handleSelect = (selectInfo) => {
    setModalNuevoEvento({ show: true, selectInfo, title: '' });
  };

  const handleCrearEvento = async () => {
    const { title, selectInfo } = modalNuevoEvento;
    if (!title || !title.trim()) return toast.error("El título es obligatorio");

    const newEvent = {
      title,
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      user: selectInfo.resource ? selectInfo.resource.id : user.id,
      allDay: selectInfo.allDay
    };

    try {
      const res = await api.post('/eventos', newEvent);
      setEventos(prev => [...prev, res.data]);
      toast.success("Actividad creada");
      setModalNuevoEvento({ show: false, selectInfo: null, title: '' });
    } catch (error) {
      console.error("Error creando evento:", error);
      toast.error("No se pudo crear la actividad");
    }
  };

  // Handler para botón flotante (Móvil) - Crea evento en la siguiente hora
  const handleFabClick = () => {
    const now = new Date();
    const start = new Date(now); 
    // Ajustar a la siguiente hora en punto para facilitar
    start.setMinutes(0, 0, 0);
    start.setHours(start.getHours() + 1);
    
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hora de duración por defecto

    setModalNuevoEvento({
      show: true,
      selectInfo: {
        startStr: start.toISOString(),
        endStr: end.toISOString(),
        allDay: false,
        resource: { id: user.id } // Asigna al usuario actual
      },
      title: ''
    });
  };

  // Mover o redimensionar un evento
  const handleEventChange = async (changeInfo) => {
    const { event } = changeInfo;
    const updatedEvent = {
      start: event.startStr,
      end: event.endStr,
      user: event.getResources()[0]?.id || user.id // Obtener el recurso (usuario)
    };

    try {
      await api.put(`/eventos/${event.id}`, updatedEvent);
      toast.success("Actividad actualizada");
    } catch (error) {
      console.error("Error actualizando evento:", error);
      toast.error("No se pudo actualizar la actividad");
      changeInfo.revert(); // Revertir el cambio en el calendario
    }
  };

  // Clic en un evento para eliminarlo
  const handleEventClick = (clickInfo) => {
    const { id, title, start, end, extendedProps } = clickInfo.event;
    setModalDetalle({
      show: true,
      id,
      title,
      start,
      end,
      userId: extendedProps.userId
    });
  };

  const handleActualizarDetalle = async () => {
    if (!modalDetalle.title.trim()) return toast.error("El título es obligatorio");
    try {
      await api.put(`/eventos/${modalDetalle.id}`, { title: modalDetalle.title });
      setEventos(prev => prev.map(ev => ev._id === modalDetalle.id ? { ...ev, title: modalDetalle.title } : ev));
      toast.success("Actividad actualizada");
      setModalDetalle(prev => ({ ...prev, show: false }));
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar");
    }
  };

  const handleEliminarDesdeDetalle = () => {
    if (user.id !== modalDetalle.userId && user.rol !== 'admin' && user.rol !== 'superadmin') {
      toast.error("No tienes permiso para eliminar esta actividad.");
      return;
    }
    setModalDetalle(prev => ({ ...prev, show: false }));
    handleEliminarActividad(modalDetalle.id);
  };


  const handleEliminarActividad = (id) => {
    setModalEliminar({ show: true, id });
  };

  const ejecutarEliminacion = async (id) => {
    try {
      await api.delete(`/eventos/${id}`);
      setEventos(prev => prev.filter(e => e._id !== id));
      toast.success("Eliminada");
      setModalEliminar({ show: false, id: null });
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar");
    }
  };

  // --- Transformación de datos para FullCalendar ---
  const calendarResources = usuarios.map(u => ({
    id: u._id,
    title: u.nombre
  }));

  const calendarEvents = eventos.map(ev => ({
    id: ev._id,
    resourceId: ev.user?._id,
    title: (isMobile && ev.user?.nombre) ? `${ev.title} (${ev.user.nombre})` : ev.title,
    start: new Date(ev.start),
    end: new Date(ev.end),
    allDay: ev.allDay,
    backgroundColor: ev.completed ? '#a0aec0' : '#4f46e5', // Gris si está completado, indigo si no
    borderColor: ev.completed ? '#718096' : '#3c34d3',
    extendedProps: {
      userId: ev.user?._id,
      description: ev.description
    }
  }));

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header y Navegación de Fecha */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Agenda del Equipo</h1>
          <p className="text-gray-500 text-sm">Haz clic en un horario para crear una actividad, o arrastra las existentes para modificarlas.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Cargando equipo...</div>
      ) : (
        <div className={`bg-white rounded-lg shadow-md border ${isMobile ? 'p-2' : 'p-4'}`}>
          <FullCalendar
            key={isMobile ? 'mobile' : 'desktop'}
            plugins={[resourceTimeGridPlugin, interactionPlugin, dayGridPlugin, timeGridPlugin]}
            schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
            headerToolbar={{
              left: isMobile ? 'prev,next' : 'prev,next today',
              center: 'title',
              right: isMobile ? 'timeGridDay,timeGridWeek,dayGridMonth' : 'resourceTimeGridDay,timeGridWeek,dayGridMonth'
            }}
            initialView={isMobile ? 'timeGridDay' : 'resourceTimeGridDay'}
            initialDate={fechaSeleccionada}
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            resources={calendarResources}
            events={calendarEvents}
            locale={esLocale}
            slotMinTime="08:00:00"
            slotMaxTime="20:00:00"
            allDaySlot={false}
            height="auto"
            // Handlers
            select={handleSelect}
            eventClick={handleEventClick}
            eventChange={handleEventChange} // Se activa al arrastrar o redimensionar
          />
        </div>
      )}

      {/* Botón Flotante para Móvil */}
      {isMobile && (
        <button
          onClick={handleFabClick}
          className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg z-40 hover:bg-indigo-700 transition-colors flex items-center justify-center"
          title="Nueva Actividad"
        >
          <FaPlus size={24} />
        </button>
      )}

      {/* Modal de Confirmación */}
      <ModalConfirmacion
        show={modalEliminar.show}
        onClose={() => setModalEliminar({ show: false, id: null })}
        onConfirm={() => ejecutarEliminacion(modalEliminar.id)}
        title="¿Eliminar actividad?"
        message="Esta acción no se puede deshacer. ¿Estás seguro de continuar?"
        confirmText="Sí, eliminar"
      />

      {/* Modal Nuevo Evento */}
      {modalNuevoEvento.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nueva Actividad</h3>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Título de la actividad..."
              value={modalNuevoEvento.title}
              onChange={(e) => setModalNuevoEvento({ ...modalNuevoEvento, title: e.target.value })}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCrearEvento();
                if (e.key === 'Escape') setModalNuevoEvento({ show: false, selectInfo: null, title: '' });
              }}
            />
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setModalNuevoEvento({ show: false, selectInfo: null, title: '' })}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={handleCrearEvento}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle Evento (Ver/Editar/Eliminar) */}
      {modalDetalle.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalles de la Actividad</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={modalDetalle.title}
                onChange={(e) => setModalDetalle({ ...modalDetalle, title: e.target.value })}
              />
            </div>

            <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded border">
               <p className="mb-1"><strong>Inicio:</strong> {modalDetalle.start?.toLocaleString()}</p>
               <p><strong>Fin:</strong> {modalDetalle.end?.toLocaleString()}</p>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t mt-4">
               <button
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 mr-auto"
                onClick={handleEliminarDesdeDetalle}
              >
                Eliminar
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => setModalDetalle({ ...modalDetalle, show: false })}
              >
                Cerrar
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                onClick={handleActualizarDetalle}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agenda;
