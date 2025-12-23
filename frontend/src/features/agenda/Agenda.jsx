import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../../components/Modal/Modal';
import { toast } from 'react-hot-toast';
import moment from 'moment';

// Función para generar un color único y consistente basado en el ID del usuario
const getUserColor = (userId) => {
  if (!userId) return '#6b7280'; // Gris si no hay usuario
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  // HSL garantiza colores vibrantes y legibles (Saturación 70%, Luminosidad 45%)
  return `hsl(${h}, 70%, 45%)`;
};

const Agenda = () => {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEventData, setNewEventData] = useState({ title: '', start: null, end: null, allDay: false });
  const { user } = useAuth();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/eventos');
      
      const formattedEvents = res.data.map(event => {
        // Obtenemos el primer nombre del usuario para mostrarlo (ej: "Juan")
        const userName = event.user?.nombre?.split(' ')[0] || 'Sistema';
        const userColor = getUserColor(event.user?._id);

        return {
          id: event._id,
          // Mostramos "Nombre: Título" en el calendario para identificar de quién es
          title: `${userName}: ${event.title}`,
          start: event.start,
          end: event.end,
          allDay: event.allDay,
          backgroundColor: userColor,
          borderColor: userColor,
          extendedProps: {
              user: event.user,
              description: event.description,
              originalTitle: event.title // Guardamos el título original limpio para editar
          }
        };
      });
      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("No se pudieron cargar los eventos.");
    }
  };

  const handleDateSelect = (selectInfo) => {
    setSelectedEvent(null);
    setNewEventData({
        title: '',
        start: selectInfo.start,
        end: selectInfo.end,
        allDay: selectInfo.allDay
    });
    setShowModal(true);
  };

  const handleEventClick = (clickInfo) => {
    const evt = clickInfo.event;
    // Usamos el título original (sin el nombre del usuario) para el formulario
    const cleanTitle = evt.extendedProps.originalTitle || evt.title;

    setSelectedEvent({
        _id: evt.id,
        title: cleanTitle,
        start: evt.start,
        end: evt.end,
        allDay: evt.allDay,
        user: evt.extendedProps.user,
        description: evt.extendedProps.description
    });
    setNewEventData({
        title: cleanTitle,
        start: evt.start,
        end: evt.end,
        allDay: evt.allDay
    });
    setShowModal(true);
  };

  const handleEventDrop = async (dropInfo) => {
      const { event } = dropInfo;
      
      if (event.extendedProps.user?._id !== user.id && user.rol !== 'admin' && user.rol !== 'superadmin') {
          dropInfo.revert();
          toast.error("No tienes permiso para mover este evento.");
          return;
      }

      try {
          // Al mover, mantenemos el título original limpio
          const cleanTitle = event.extendedProps.originalTitle || event.title;
          await api.put(`/eventos/${event.id}`, {
              title: cleanTitle,
              start: event.start,
              end: event.end,
              allDay: event.allDay
          });
          toast.success("Evento reprogramado.");
      } catch (error) {
          console.error(error);
          dropInfo.revert();
          toast.error("Error al mover el evento.");
      }
  };

  const handleSaveEvent = async () => {
    if (!newEventData.title.trim()) {
      toast.error("El título es obligatorio.");
      return;
    }

    try {
      if (selectedEvent) {
        await api.put(`/eventos/${selectedEvent._id}`, newEventData);
        toast.success("Evento actualizado.");
      } else {
        await api.post('/eventos', newEventData);
        toast.success("Evento creado.");
      }
      setShowModal(false);
      fetchEvents(); 
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error(error.response?.data?.msg || "Error al guardar.");
    }
  };

  const handleDeleteEvent = async () => {
    if (!window.confirm("¿Eliminar este evento?")) return;
    try {
      await api.delete(`/eventos/${selectedEvent._id}`);
      setEvents(prev => prev.filter(e => e.id !== selectedEvent._id));
      toast.success("Evento eliminado.");
      setShowModal(false);
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar.");
    }
  };

  return (
    <div className="p-4 md:p-6 bg-white rounded-lg shadow-md h-[85vh] flex flex-col">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Agenda Virtual</h2>
      
      <div className="flex-1 overflow-hidden">
        <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            initialView="dayGridMonth"
            editable={true}
            selectable={true}
            selectMirror={true}
            // Aumentamos el límite para ver más usuarios en un solo día
            dayMaxEvents={6} 
            weekends={true}
            events={events}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventDrop}
            locale={esLocale}
            height="100%"
        />
      </div>

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <div className="p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">
                {selectedEvent ? 'Editar Evento' : 'Nuevo Evento'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Título de la Actividad</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newEventData.title}
                  onChange={e => setNewEventData({...newEventData, title: e.target.value})}
                  placeholder="Ej: Instalación en Obra X"
                  autoFocus
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                <div>
                    <span className="block font-semibold">Inicio:</span>
                    {moment(newEventData.start).format('DD/MM/YYYY HH:mm')}
                </div>
                <div>
                    <span className="block font-semibold">Fin:</span>
                    {moment(newEventData.end).format('DD/MM/YYYY HH:mm')}
                </div>
              </div>

              {selectedEvent && (
                  <div className="text-xs text-gray-500">
                      Creado por: <span className="font-medium text-gray-800">{selectedEvent.user?.nombre || 'Sistema'}</span>
                  </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              {selectedEvent && (user.id === selectedEvent.user?._id || ['admin', 'superadmin'].includes(user.rol)) && (
                <button 
                    onClick={handleDeleteEvent}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 font-medium transition-colors"
                >
                    Eliminar
                </button>
              )}
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveEvent}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Agenda;
