import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { FaPlus } from 'react-icons/fa';
import ModalConfirmacion from '../../components/ModalConfirmacion';

// FullCalendar imports
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import listPlugin from '@fullcalendar/list'; // Para la vista de lista en móvil
import esLocale from '@fullcalendar/core/locales/es';

const Agenda = () => {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [loading, setLoading] = useState(true);
  
  const [modalEliminar, setModalEliminar] = useState({ show: false, id: null });
  const [modalNuevoEvento, setModalNuevoEvento] = useState({ show: false, startStr: '', endStr: '', allDay: false, title: '', selectedUserId: null });
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
    if (!user) return;
    if (showLoading) setLoading(true);
    try {
      const userId = user._id || user.id;

      // 1. Cargar Eventos (Accesible para todos)
      const resEventos = await api.get('/eventos');
      const eventosData = resEventos.data;

      // Filtrar: Admin ve todo, usuarios normales solo ven sus propios eventos
      if (user.rol === 'admin' || user.rol === 'superadmin') {
        setEventos(eventosData);
      } else {
        setEventos(eventosData.filter(ev => (ev.user?._id || ev.user) === userId));
      }

      // 2. Intentar Cargar Usuarios (Puede fallar si no es admin)
      try {
        const resUsuarios = await api.get('/eventos/usuarios');
        
        if (user.rol === 'admin' || user.rol === 'superadmin') {
          setUsuarios(resUsuarios.data);
        } else {
          // Si no es admin, solo mostrarse a sí mismo en los recursos
          setUsuarios(resUsuarios.data.filter(u => u._id === userId));
        }
      } catch (err) {
        console.warn("No se pudo cargar lista de usuarios completa. Usando modo limitado.");
        
        // Construir lista de usuarios basada en los eventos y el usuario actual
        const usuariosMap = new Map();
        
        // Agregar usuario actual
        if (user) {
            usuariosMap.set(userId, { 
                _id: userId, 
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
    // Intentar capturar el recurso (usuario) de la columna seleccionada
    const resourceId = selectInfo.resource?.id;
    const currentUserId = user?._id || user?.id;

    setModalNuevoEvento({ 
      show: true, 
      startStr: selectInfo.startStr,
      endStr: selectInfo.endStr,
      allDay: selectInfo.allDay,
      title: '', 
      selectedUserId: resourceId || currentUserId // Priorizar columna, sino usuario actual
    });
  };

  const handleCrearEvento = async () => {
    const { title, startStr, endStr, allDay, selectedUserId } = modalNuevoEvento;
    if (!title || !title.trim()) return toast.error("El título es obligatorio");

    const newEvent = {
      title,
      start: startStr,
      end: endStr,
      user: selectedUserId || (user?._id || user?.id),
      allDay: allDay
    };

    try {
      const res = await api.post('/eventos', newEvent);
      setEventos(prev => [...prev, res.data]);
      toast.success("Actividad creada");
      setModalNuevoEvento({ show: false, startStr: '', endStr: '', allDay: false, title: '', selectedUserId: null });
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
      startStr: start.toISOString(),
      endStr: end.toISOString(),
      allDay: false,
      title: '',
      selectedUserId: user?._id || user?.id
    });
  };

  // Mover o redimensionar un evento
  const handleEventChange = async (changeInfo) => {
    const { event } = changeInfo;
    const newResourceId = event.getResources()[0]?.id;

    // Si no se puede determinar el nuevo recurso (usuario), revertir.
    if (!newResourceId) {
      toast.error("No se pudo asignar a un nuevo usuario. Intente de nuevo.");
      changeInfo.revert();
      return;
    }

    const updatedEvent = {
      start: event.startStr,
      end: event.endStr,
      user: newResourceId // Asignar el ID del nuevo recurso (columna de usuario)
    };

    try {
      await api.put(`/eventos/${event.id}`, updatedEvent);
      // Refrescar los datos para asegurar que el cambio de usuario se refleje visualmente
      fetchData(false);
      toast.success(`Actividad reasignada y actualizada.`);
    } catch (error) {
      console.error("Error actualizando evento:", error);
      toast.error("No se pudo actualizar la actividad");
      changeInfo.revert(); // Revertir el cambio en el calendario
    }
  };

  // Clic en un evento para eliminarlo
  const handleEventClick = (clickInfo) => {
    const { id, title, start, end, extendedProps } = clickInfo.event;
    
    // Helper para formatear fecha a string compatible con input datetime-local (YYYY-MM-DDTHH:mm)
    const formatDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().slice(0, 16);
    };

    setModalDetalle({
      show: true,
      id,
      title,
      start: formatDate(start),
      end: formatDate(end || start),
      userId: extendedProps.userId
    });
  };

  const handleActualizarDetalle = async () => {
    if (!modalDetalle.title.trim()) return toast.error("El título es obligatorio");
    if (new Date(modalDetalle.start) >= new Date(modalDetalle.end)) {
      return toast.error("La fecha de fin debe ser posterior a la de inicio");
    }

    try {
      const payload = { title: modalDetalle.title, start: modalDetalle.start, end: modalDetalle.end };
      await api.put(`/eventos/${modalDetalle.id}`, payload);
      
      setEventos(prev => prev.map(ev => ev._id === modalDetalle.id ? { ...ev, ...payload } : ev));
      toast.success("Actividad actualizada");
      setModalDetalle(prev => ({ ...prev, show: false }));
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar");
    }
  };

  const handleEliminarDesdeDetalle = () => {
    const currentUserId = user?._id || user?.id;
    if (currentUserId !== modalDetalle.userId && user?.rol !== 'admin' && user?.rol !== 'superadmin') {
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

  if (!user) return <div className="p-8 text-center text-gray-500">Cargando usuario...</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header y Navegación de Fecha */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Agenda del Equipo</h1>
          <p className="text-gray-500 text-sm">Haz clic en un horario para crear una actividad, o arrastra las existentes para modificarlas.</p>
        </div>
        {/* Botón Manual para crear actividad sin depender del clic en calendario */}
        <button
          onClick={handleFabClick}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2 shadow-sm transition-colors"
        >
          <FaPlus /> Nueva Actividad
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Cargando equipo...</div>
      ) : (
        <div className={`bg-white rounded-lg shadow-md border ${isMobile ? 'p-2' : 'p-4'}`}>
          <FullCalendar
            key={isMobile ? 'mobile' : 'desktop'}
            plugins={[resourceTimeGridPlugin, interactionPlugin, dayGridPlugin, timeGridPlugin, listPlugin]}
            schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
            headerToolbar={{
              left: isMobile ? 'prev,next' : 'prev,next today',
              center: 'title',
              right: isMobile ? 'listWeek,timeGridDay,dayGridMonth' : 'resourceTimeGridDay,timeGridWeek,dayGridMonth'
            }}
            initialView={isMobile ? 'listWeek' : 'resourceTimeGridDay'}
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
            
            {(user.rol === 'admin' || user.rol === 'superadmin') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Asignar a:</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={modalNuevoEvento.selectedUserId || ''}
                  onChange={(e) => setModalNuevoEvento({ ...modalNuevoEvento, selectedUserId: e.target.value })}
                >
                  <option value={user?._id || user?.id}>Asignar a mí ({user?.nombre || 'Yo'})</option>
                  {usuarios.filter(u => u._id !== (user?._id || user?.id)).map(u => (
                    <option key={u._id} value={u._id}>{u.nombre}</option>
                  ))}
                </select>
              </div>
            )}

            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Título de la actividad..."
              value={modalNuevoEvento.title}
              onChange={(e) => setModalNuevoEvento({ ...modalNuevoEvento, title: e.target.value })}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCrearEvento();
                if (e.key === 'Escape') setModalNuevoEvento({ show: false, startStr: '', endStr: '', allDay: false, title: '', selectedUserId: null });
              }}
            />
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setModalNuevoEvento({ show: false, startStr: '', endStr: '', allDay: false, title: '', selectedUserId: null })}
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

            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inicio</label>
                <div className="flex flex-col gap-2">
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={modalDetalle.start?.split('T')[0] || ''}
                    onChange={(e) => setModalDetalle({ ...modalDetalle, start: `${e.target.value}T${modalDetalle.start.split('T')[1]}` })}
                  />
                  <input
                    type="time"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={modalDetalle.start?.split('T')[1] || ''}
                    onChange={(e) => setModalDetalle({ ...modalDetalle, start: `${modalDetalle.start.split('T')[0]}T${e.target.value}` })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
                <div className="flex flex-col gap-2">
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={modalDetalle.end?.split('T')[0] || ''}
                    onChange={(e) => setModalDetalle({ ...modalDetalle, end: `${e.target.value}T${modalDetalle.end.split('T')[1]}` })}
                  />
                  <input
                    type="time"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={modalDetalle.end?.split('T')[1] || ''}
                    onChange={(e) => setModalDetalle({ ...modalDetalle, end: `${modalDetalle.end.split('T')[0]}T${e.target.value}` })}
                  />
                </div>
              </div>
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
