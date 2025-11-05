import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';

export const PrivateRoute = ({ allowedRoles = [] }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Si se especifican roles permitidos y el usuario no tiene uno de ellos, redirigir al home
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/home" />;
  }

  return <DashboardLayout><Outlet /></DashboardLayout>;
};
