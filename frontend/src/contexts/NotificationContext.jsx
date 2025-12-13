import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notificaciones, setNotificaciones] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotificaciones = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notificaciones');
      setNotificaciones(res.data.notificaciones);
      setUnreadCount(res.data.noLeidas);
    } catch (error) {
      console.error("Error cargando notificaciones", error);
    }
  };

  // Cargar al inicio y cuando cambia el usuario
  useEffect(() => {
    fetchNotificaciones();
    
    // Opcional: Polling cada 60 segundos para ver si hay nuevas
    const interval = setInterval(fetchNotificaciones, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const marcarLeida = async (id) => {
    try {
      await api.put(`/notificaciones/${id}/leer`);
      // Actualizar estado localmente para rapidez
      setNotificaciones(prev => prev.map(n => n._id === id ? { ...n, leido: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <NotificationContext.Provider value={{ notificaciones, unreadCount, fetchNotificaciones, marcarLeida }}>
      {children}
    </NotificationContext.Provider>
  );
};

