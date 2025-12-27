import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { FaChevronLeft, FaChevronRight, FaCalendarDay } from 'react-icons/fa';
import ModalConfirmacion from '../../components/ModalConfirmacion';

// FullCalendar imports
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';

const Agenda = () => {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [loading, setLoading] = useState(true);
  
  const [modalEliminar, setModalEliminar] = useState({ show: false, id: null });

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
  const handleSelect = async (selectInfo) => {
    const title = prompt('Por favor ingresa un título para la nueva actividad:');
    if (title) {
      const newEvent = {
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        user: selectInfo.resource.id, // Asignar al usuario de la columna
        allDay: selectInfo.allDay
      };

      try {
        const res = await api.post('/eventos', newEvent);
        setEventos(prev => [...prev, res.data]);
        toast.success("Actividad creada");
      } catch (error) {
        console.error("Error creando evento:", error);
        toast.error("No se pudo crear la actividad");
      }
    }
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
    // Solo el dueño del evento o un admin puede eliminar
    const eventOwnerId = clickInfo.event.extendedProps.userId;
    if (user.id !== eventOwnerId && user.rol !== 'admin' && user.rol !== 'superadmin') {
      toast.error("No tienes permiso para eliminar esta actividad.");
      return;
    }
    handleEliminarActividad(clickInfo.event.id);
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
    title: ev.title,
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
        <div className='bg-white p-4 rounded-lg shadow-md border'>
          <FullCalendar
            plugins={[resourceTimeGridPlugin, interactionPlugin, dayGridPlugin, timeGridPlugin]}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'resourceTimeGridDay,timeGridWeek,dayGridMonth'
            }}
            initialView='resourceTimeGridDay'
            initialDate={fechaSeleccionada}
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            resources={calendarResources}
            events={calendarEvents}
            locale='es'
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

      {/* Modal de Confirmación */}
      <ModalConfirmacion
        show={modalEliminar.show}
        onClose={() => setModalEliminar({ show: false, id: null })}
        onConfirm={() => ejecutarEliminacion(modalEliminar.id)}
        title="¿Eliminar actividad?"
        message="Esta acción no se puede deshacer. ¿Estás seguro de continuar?"
        confirmText="Sí, eliminar"
      />
    </div>
  );
};

export default Agenda;
