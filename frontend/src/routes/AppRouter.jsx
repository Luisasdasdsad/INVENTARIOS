import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import AuthLayout from "../layouts/AuthLayout";
import HerramientasList from "../features/herramientas/HerramientasList";
import MovimientosList from "../features/movimientos/MovimientosList";
import Home from "../pages/Home";
import LoginPage from "../pages/Auth/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import RegistrarMovimientoPage from "../features/movimientos/RegistrarMovimientoPage";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import HerramientaForm from "../features/herramientas/HerramientaForm";

// Componente para proteger rutas
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <p className="text-center p-4">Cargando...</p>; // O un spinner de carga
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider> {/* Envuelve toda la aplicación con el proveedor de autenticación */}
        <Routes>
          {/* Rutas de Autenticación */}
          <Route path="/" element={<AuthLayout />}>
            <Route index element={<Navigate to="/login" />} /> {/* Redirige la raíz a login */}
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
          </Route>

          {/* Rutas Protegidas (Dashboard) */}
          <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
            <Route path="home" element={<Home />} /> {/* Ruta para el componente Home */}
            <Route path="herramientas" element={<HerramientasList />} />
            <Route path="movimientos" element={<MovimientosList />} />
            <Route path="movimientos/registrar" element={<RegistrarMovimientoPage />} />
            
            {/* Aquí puedes añadir más rutas protegidas si las necesitas */}
          </Route>

          {/* Ruta para 404 */}
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}