import { Outlet, Link } from "react-router-dom";
import { FaTools, FaClipboardList, FaExchangeAlt, FaHome, FaSignOutAlt, FaBars, FaTimes } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";

export default function DashboardLayout() {
  const { logout, user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`bg-white shadow-md p-4 transition-all duration-300 ease-in-out ${
        isSidebarOpen ? 'w-64' : 'w-16'
      }`}>
        {/* Header con botón de toggle */}
        <div className="flex items-center justify-between mb-6">
          {isSidebarOpen && (
            <h1 className="text-xl font-bold">Inventario</h1>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1 text-gray-600 hover:text-gray-900 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isSidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>
        
        <nav className="space-y-4">
          <Link
            to="/home"
            className={`flex items-center gap-2 hover:text-blue-600 transition-colors p-2 rounded ${
              !isSidebarOpen ? 'justify-center' : ''
            }`}
          >
            <FaHome size={20} />
            {isSidebarOpen && <span>Inicio</span>}
          </Link>
          <Link
            to="/herramientas"
            className={`flex items-center gap-2 hover:text-blue-600 transition-colors p-2 rounded ${
              !isSidebarOpen ? 'justify-center' : ''
            }`}
          >
            <FaTools size={20} />
            {isSidebarOpen && <span>Inventario</span>}
          </Link>
          <Link
            to="/movimientos"
            className={`flex items-center gap-2 hover:text-blue-600 transition-colors p-2 rounded ${
              !isSidebarOpen ? 'justify-center' : ''
            }`}
          >
            <FaExchangeAlt size={20} />
            {isSidebarOpen && <span>Movimientos</span>}
          </Link>
        </nav>
        
        {/* Sección de usuario y logout - siempre visible, pero contenido condicional */}
        <div className="mt-8 pt-4 border-t border-gray-200 flex flex-col items-center space-y-2">
          {isSidebarOpen && user && (
            <p className="text-sm text-gray-600 text-center">
              Bienvenido, <span className="font-semibold">{user.nombre}</span>
            </p>
          )}
          <button
            onClick={logout}
            className={`flex items-center justify-center gap-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors ${
              isSidebarOpen 
                ? 'py-2 px-4 w-full' 
                : 'py-2 px-2 w-10 h-10' // Compacto para colapsado: cuadrado de 40px con ícono centrado
            }`}
          >
            <FaSignOutAlt size={20} />
            {isSidebarOpen && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>
      
      {/* Contenido */}
      <main className={`flex-1 p-6 transition-all duration-300 ${
        isSidebarOpen ? 'ml-0' : 'ml-16'
      }`}>
        <Outlet />
      </main>
    </div>
  );
}