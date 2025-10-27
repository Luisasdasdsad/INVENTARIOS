import { Outlet, Link } from "react-router-dom";
import { FaTools, FaClipboardList, FaExchangeAlt, FaHome, FaSignOutAlt, FaBars, FaTimes, FaUsers } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";

export default function DashboardLayout() {
  const { logout, user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Cerrar sidebar en móvil al hacer clic en un link
  const handleNavClick = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Overlay para móvil */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`bg-white shadow-md p-4 transition-all duration-300 ease-in-out z-50 ${
        isMobile 
          ? `fixed inset-y-0 left-0 transform ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`
          : isSidebarOpen ? 'w-64' : 'w-16'
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
            onClick={handleNavClick}
            className={`flex items-center gap-2 hover:text-blue-600 transition-colors p-2 rounded ${
              !isSidebarOpen ? 'justify-center' : ''
            }`}
          >
            <FaHome size={20} />
            {isSidebarOpen && <span>Inicio</span>}
          </Link>
          {user && user.rol === 'admin' && (
            <Link
              to="/herramientas"
              onClick={handleNavClick}
              className={`flex items-center gap-2 hover:text-blue-600 transition-colors p-2 rounded ${
                !isSidebarOpen ? 'justify-center' : ''
              }`}
            >
              <FaTools size={20} />
              {isSidebarOpen && <span>Inventario</span>}
            </Link>
          )}
          <Link
            to="/movimientos"
            onClick={handleNavClick}
            className={`flex items-center gap-2 hover:text-blue-600 transition-colors p-2 rounded ${
              !isSidebarOpen ? 'justify-center' : ''
            }`}
          >
            <FaExchangeAlt size={20} />
            {isSidebarOpen && <span>Movimientos</span>}
          </Link>
          <Link
            to="/productos"
            onClick={handleNavClick}
            className={`flex items-center gap-2 hover:text-blue-600 transition-colors p-2 rounded ${
              !isSidebarOpen ? 'justify-center' : ''
            }`}
          >
            <FaClipboardList size={20} />
            {isSidebarOpen && <span>Productos</span>}
          </Link>
          <Link
            to="/cotización"
            onClick={handleNavClick}
            className={`flex items-center gap-2 hover:text-blue-600 transition-colors p-2 rounded ${
            !isSidebarOpen ? 'justify-center' : ''
            }`}
          >
            <FaClipboardList size={20} />
            {isSidebarOpen && <span>Nueva Cotización</span>}
          </Link>
          <Link
            to="/cotizaciones"
            onClick={handleNavClick}
            className={`flex items-center gap-2 hover:text-blue-600 transition-colors p-2 rounded ${
            !isSidebarOpen ? 'justify-center' : ''
            }`}
          >
            <FaClipboardList size={20} />
            {isSidebarOpen && <span>Ver Cotizaciones</span>}
          </Link>
          <Link
            to="/clientes"
            onClick={handleNavClick}
            className={`flex items-center gap-2 hover:text-blue-600 transition-colors p-2 rounded ${
            !isSidebarOpen ? 'justify-center' : ''
            }`}
          >
            <FaUsers size={20} />
            {isSidebarOpen && <span>Clientes</span>}
          </Link>
        </nav>
        
        {/* Sección de usuario y logout */}
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
                ? 'py-1 px-3 text-sm' 
                : 'p-2 w-10 h-10'
            }`}
          >
            <FaSignOutAlt size={18} />
            {isSidebarOpen && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>
      
      {/* Contenido principal */}
      <main className={`flex-1 p-2 md:p-6 transition-all duration-300 ${
        isMobile ? 'ml-0' : isSidebarOpen ? 'ml-0' : 'ml-16'
      }`}>
        {/* Botón para abrir sidebar en móvil */}
        {isMobile && !isSidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="fixed top-4 left-4 z-30 p-2 bg-white rounded-md shadow-md text-gray-600 hover:text-gray-900"
          >
            <FaBars size={20} />
          </button>
        )}
        <Outlet />
      </main>
    </div>
  );
}