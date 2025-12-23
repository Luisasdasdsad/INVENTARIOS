import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaCalendarDay, FaSpinner } from 'react-icons/fa';

export default function CalendarioOrdenesPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar órdenes al montar
  useEffect(() => {
    const fetchOrdenes = async () => {
      try {
        const response = await api.get('/ordenes-trabajo');
        setOrdenes(response.data);
      } catch (err) {
        console.error("Error cargando calendario:", err);
        setError("No se pudieron cargar las órdenes de trabajo.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrdenes();
  }, []);

  // Funciones auxiliares de fecha
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    // 0 = Domingo, 1 = Lunes, etc.
    return new Date(year, month, 1).getDay();
  };

  const changeMonth = (increment) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + increment);
      return newDate;
    });
  };

  const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const isDateInRange = (checkDate, startDateStr, endDateStr) => {
    if (!startDateStr) return false;
    
    // Convertir string ISO (UTC) a fecha local usando los componentes UTC
    // Esto evita el desfase de zona horaria (ej: que el 26 se vea como 25)
    const getLocalFromUTC = (isoString) => {
      const d = new Date(isoString);
      return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    };

    const s = getLocalFromUTC(startDateStr);
    const e = endDateStr ? getLocalFromUTC(endDateStr) : s;
    
    // checkDate ya es local 00:00:00
    const check = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());

    return check >= s && check <= e;
  };

  // Renderizado del calendario
  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Celdas vacías antes del primer día del mes
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 md:h-32 bg-gray-50 border border-gray-100"></div>);
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isToday = isSameDay(date, new Date());

      // Filtrar órdenes para este día
      const dayOrdenes = ordenes.filter(ot => 
        isDateInRange(date, ot.fechaInicio, ot.fechaFin)
      );

      days.push(
        <div key={day} className={`h-24 md:h-32 border border-gray-200 p-1 overflow-y-auto transition-colors hover:bg-gray-50 ${isToday ? 'bg-blue-50' : 'bg-white'}`}>
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-semibold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
              {day}
            </span>
            {dayOrdenes.length > 0 && (
              <span className="text-xs font-bold text-gray-400 hidden md:inline">{dayOrdenes.length}</span>
            )}
          </div>
          
          <div className="space-y-1">
            {dayOrdenes.map(ot => (
              <Link 
                to={`/ordenes-trabajo/${ot._id}`} 
                key={ot._id} 
                className={`block text-[10px] md:text-xs p-1 rounded border truncate shadow-sm transition-transform hover:scale-105 ${
                  ot.estado === 'completado' ? 'bg-green-100 text-green-800 border-green-200' :
                  ot.estado === 'en_proceso' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                  'bg-yellow-100 text-yellow-800 border-yellow-200'
                }`}
                title={`OT-${ot.numeroOT}: ${ot.cliente?.nombre || 'Cliente'} - ${ot.descripcionServicio}`}
              >
                <div className="font-bold truncate">OT-{ot.numeroOT}</div>
                <div className="truncate hidden md:block">{ot.cliente?.nombre || 'Cliente'}</div>
              </Link>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  // Renderizado vista móvil (Agenda)
  const renderMobileAgenda = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const agendaItems = [];
    let hasOrders = false;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isToday = isSameDay(date, new Date());

      const dayOrdenes = ordenes.filter(ot => 
        isDateInRange(date, ot.fechaInicio, ot.fechaFin)
      );

      if (dayOrdenes.length > 0) {
        hasOrders = true;
        agendaItems.push(
          <div key={day} className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className={`px-4 py-2 border-b border-gray-100 flex justify-between items-center ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
              <span className={`font-semibold capitalize ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>
                {date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}
              </span>
              {isToday && <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">HOY</span>}
            </div>
            <div className="divide-y divide-gray-100">
              {dayOrdenes.map(ot => (
                <Link 
                  to={`/ordenes-trabajo/${ot._id}`} 
                  key={ot._id} 
                  className="block p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-indigo-600 text-sm">#{ot.numeroOT}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                      ot.estado === 'completado' ? 'bg-green-100 text-green-800' :
                      ot.estado === 'en_proceso' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {ot.estado?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-gray-900">{ot.cliente?.nombre || 'Cliente'}</div>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">{ot.descripcionServicio}</div>
                </Link>
              ))}
            </div>
          </div>
        );
      }
    }

    if (!hasOrders) {
      return (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500">No hay órdenes programadas para este mes.</p>
        </div>
      );
    }

    return <div className="space-y-2">{agendaItems}</div>;
  };

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  if (loading) return <div className="flex justify-center items-center h-64"><FaSpinner className="animate-spin text-blue-600 text-2xl" /></div>;
  if (error) return <div className="p-4 text-red-600 bg-red-50 rounded">{error}</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
            <FaCalendarDay size={24} />
          </div>
          <span>Calendario de Trabajo</span>
        </h2>
        
        <div className="flex items-center gap-4 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-gray-600 transition-all">
            <FaChevronLeft />
          </button>
          <span className="px-4 py-1 font-bold text-lg text-gray-700 min-w-[160px] text-center capitalize select-none">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-gray-600 transition-all">
            <FaChevronRight />
          </button>
        </div>

        <button 
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all"
          >
            Hoy
        </button>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-6 mb-6 px-2 justify-end">
        <div className="flex items-center gap-2 text-sm text-gray-600"><span className="w-3 h-3 bg-amber-500 rounded-full"></span> Pendiente</div>
        <div className="flex items-center gap-2 text-sm text-gray-600"><span className="w-3 h-3 bg-blue-500 rounded-full"></span> En Proceso</div>
        <div className="flex items-center gap-2 text-sm text-gray-600"><span className="w-3 h-3 bg-green-500 rounded-full"></span> Completado</div>
      </div>

      {/* Grid Calendario */}
      <div className="hidden md:block bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]"> {/* Ancho mínimo para evitar deformación en móvil */}
            {/* Cabecera Días */}
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
              {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((day, i) => (
                <div key={day} className="py-4 text-center font-semibold text-gray-500 text-xs uppercase tracking-wider">
                  <span>{day}</span>
                </div>
              ))}
            </div>

            {/* Grid Días */}
            <div className="grid grid-cols-7 auto-rows-fr bg-gray-200 gap-px border-b border-gray-200">
              {renderCalendarDays()}
            </div>
          </div>
        </div>
      </div>

      {/* Agenda (Móvil) */}
      <div className="md:hidden">
        {renderMobileAgenda()}
      </div>
    </div>
  );
}
