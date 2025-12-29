import axios from 'axios';

// Detectar URL automáticamente:
// 1. Si existe variable de entorno VITE_API_URL (local), úsala.
// 2. Si no, usa la URL de producción de Render por defecto.
let API_URL = import.meta.env.VITE_API_URL || "https://inventarios-axfm.onrender.com/api";

// Corrección de seguridad: Asegurar que la URL siempre termine en '/api'
if (API_URL && !API_URL.endsWith('/api')) {
  API_URL = API_URL.replace(/\/$/, "") + "/api";
}

console.log("🔌 Conectando a Backend:", API_URL); // Log para verificar conexión en consola

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para agregar el token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;