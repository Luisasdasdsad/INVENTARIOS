import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api.js'; // Importa tu instancia de axios configurada
import { useNavigate } from 'react-router-dom'; // Para redirigir

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Validar el token con el backend
      api.get('/auth/validate')
        .then(res => {
          setIsAuthenticated(true);
          setUser(res.data.user);
        })
        .catch(() => {
          // Token inválido o expirado, limpiar
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    try {
      const res = await api.post('/auth/login', credentials);
      localStorage.setItem('token', res.data.token);
      setIsAuthenticated(true);
      setUser(res.data.user); // Asumiendo que el backend devuelve el usuario
      navigate('/home'); // Redirige al dashboard después del login
      return res.data;
    } catch (error) {
      console.error("Error en el login:", error);
      setIsAuthenticated(false);
      setUser(null);
      throw error; // Propaga el error para que el componente de login lo maneje
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login'); // Redirige a la página de login después del logout
  };

  // Si estás cargando, puedes mostrar un spinner o un mensaje
  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando autenticación...</div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};