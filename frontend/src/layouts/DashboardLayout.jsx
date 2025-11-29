import { Outlet, Link } from "react-router-dom";
import { FaTools, FaClipboardList, FaExchangeAlt, FaHome, FaSignOutAlt, FaBars, FaTimes, FaUsers, FaFileAlt, FaHistory, FaPlus, FaUser } from "react-icons/fa";
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
    <div className="flex min-h-screen bg-gradient-to-br from-secondary-50 to-secondary-100">
      {/* Overlay para móvil */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-secondary-900 bg-opacity-50 z-40 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`bg-white shadow-large p-6 transition-all duration-300 ease-in-out z-50 border-r border-secondary-200 ${
        isMobile
          ? `fixed inset-y-0 left-0 transform ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`
          : isSidebarOpen ? 'w-72' : 'w-20'
      }`}>
        {/* Logo y Header */}
        <div className="flex items-center justify-between mb-8">
          {isSidebarOpen && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-soft">
                <FaTools className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-800 to-primary-800 bg-clip-text text-transparent">
                  Inventario
                </h1>
                <p className="text-xs text-secondary-500">Sistema de Gestión</p>
              </div>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            {isSidebarOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
          </button>
        </div>
        
        <nav className="space-y-2">
          {/* Inicio */}
          <Link
            to="/home"
            onClick={handleNavClick}
            className={`flex items-center gap-3 hover:bg-primary-50 hover:text-primary-700 transition-all duration-200 rounded-xl ${
              !isSidebarOpen ? 'justify-center py-3 px-1' : 'p-3'
            }`}
          >
            {isSidebarOpen ? (
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <FaHome size={16} className="text-primary-600" />
              </div>
            ) : (
              <FaHome size={18} className="text-primary-600" />
            )}
            {isSidebarOpen && <span className="font-medium">Inicio</span>}
          </Link>
          {/* Separador de Inventario */}
          {isSidebarOpen && (
            <div className="pt-4 pb-2">
              <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider px-3">
                Inventario
              </p>
            </div>
          )}
          {/* Inventario - Solo Admin */}
          {user && user.rol === 'admin' && (
            <Link
              to="/herramientas"
              onClick={handleNavClick}
              className={`flex items-center gap-3 hover:bg-primary-50 hover:text-primary-700 transition-all duration-200 rounded-xl ${
                !isSidebarOpen ? 'justify-center py-3 px-1' : 'p-3'
              }`}
            >
              {isSidebarOpen ? (
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FaTools size={16} className="text-primary-600" />
                </div>
              ) : (
                <FaTools size={18} className="text-primary-600" />
              )}
              {isSidebarOpen && <span className="font-medium">Inventario</span>}
            </Link>
          )}

          {/* Movimientos */}
          <Link
            to="/movimientos"
            onClick={handleNavClick}
            className={`flex items-center gap-3 hover:bg-primary-50 hover:text-primary-700 transition-all duration-200 rounded-xl ${
              !isSidebarOpen ? 'justify-center py-3 px-1' : 'p-3'
            }`}
          >
            {isSidebarOpen ? (
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <FaExchangeAlt size={16} className="text-primary-600" />
              </div>
            ) : (
              <FaExchangeAlt size={18} className="text-primary-600" />
            )}
            {isSidebarOpen && <span className="font-medium">Movimientos</span>}
          </Link>

          {/* Productos - Admin y Responsable de Inventario */}
          {user && (user.rol === 'admin' || user.rol === 'responsable_inventario') && (
            <Link
              to="/productos"
              onClick={handleNavClick}
              className={`flex items-center gap-3 hover:bg-primary-50 hover:text-primary-700 transition-all duration-200 rounded-xl ${
                !isSidebarOpen ? 'justify-center py-3 px-1' : 'p-3'
              }`}
            >
              {isSidebarOpen ? (
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FaClipboardList size={16} className="text-primary-600" />
                </div>
              ) : (
                <FaClipboardList size={18} className="text-primary-600" />
              )}
              {isSidebarOpen && <span className="font-medium">Productos</span>}
            </Link>
          )}

          {/* --- SECCIÓN COTIZACIONES (Oculta para técnicos) --- */}
          {user?.rol !== 'tecnico' && (
            <>
              {/* Separador de Cotizaciones */}
              {isSidebarOpen && (
                <div className="pt-4 pb-2">
                  <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider px-3">
                    Cotizaciones
                  </p>
                </div>
              )}

              {/* Nueva Cotización - Solo Admin */}
              {user.rol === 'admin' && (
                <Link
                  to="/cotización"
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 hover:bg-green-50 hover:text-green-700 transition-all duration-200 rounded-xl ${
                    !isSidebarOpen ? 'justify-center py-3 px-1' : 'p-3'
                  }`}
                >
                  {isSidebarOpen ? (
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <FaPlus size={16} className="text-green-600" />
                    </div>
                  ) : (
                    <FaPlus size={18} className="text-green-600" />
                  )}
                  {isSidebarOpen && <span className="font-medium">Nueva Cotización</span>}
                </Link>
              )}

              {/* Mis Cotizaciones */}
              <Link
                to="/cotizaciones"
                onClick={handleNavClick}
                className={`flex items-center gap-3 hover:bg-yellow-50 hover:text-yellow-700 transition-all duration-200 rounded-xl ${
                  !isSidebarOpen ? 'justify-center py-3 px-1' : 'p-3'
                }`}
              >
                {isSidebarOpen ? (
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <FaFileAlt size={16} className="text-yellow-600" />
                  </div>
                ) : (
                  <FaFileAlt size={18} className="text-yellow-600" />
                )}
                {isSidebarOpen && <span className="font-medium">Mis Cotizaciones</span>}
              </Link>

              {/* Historial de Cotizaciones */}
              <Link
                to="/historial-cotizaciones"
                onClick={handleNavClick}
                className={`flex items-center gap-3 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 rounded-xl ${
                  !isSidebarOpen ? 'justify-center py-3 px-1' : 'p-3'
                }`}
              >
                {isSidebarOpen ? (
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FaHistory size={16} className="text-blue-600" />
                  </div>
                ) : (
                  <FaHistory size={18} className="text-blue-600" />
                )}
                {isSidebarOpen && (
                  <div className="flex flex-col">
                    <span className="font-medium">Historial</span>
                    <span className="text-xs text-secondary-500">Solo lectura</span>
                  </div>
                )}
              </Link>
            </>
          )}
          {/* --- FIN SECCIÓN COTIZACIONES --- */}

          {/*
            CÓDIGO ORIGINAL ELIMINADO:
            Se movieron los enlaces de cotizaciones dentro del bloque condicional de arriba
            para agrupar toda la lógica y que se oculte la sección completa.
          */}

          {/* Separador de Orden de trabajo */}
          {isSidebarOpen && (
            <div className="pt-4 pb-2">
              <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider px-3">
                Orden de trabajo
              </p>
            </div>
          )}

          {/* 🆕 Órdenes de Trabajo - Todos los usuarios */}
          <Link
            to="/ordenes-trabajo"
            onClick={handleNavClick}
            className={`flex items-center gap-3 hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-200 rounded-xl ${
              !isSidebarOpen ? 'justify-center py-3 px-1' : 'p-3'
            }`}
          >
            {isSidebarOpen ? (
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <FaClipboardList size={16} className="text-indigo-600" />
              </div>
            ) : (
              <FaClipboardList size={18} className="text-indigo-600" />
            )}
            {isSidebarOpen && <span className="font-medium">Órdenes de Trabajo</span>}
          </Link>

          {/* Asignar OT eliminado: las OTs se asignan al crear */}

          {/* Clientes - Solo Admin */}
          {user && user.rol === 'admin' && (
            <Link
              to="/clientes"
              onClick={handleNavClick}
              className={`flex items-center gap-3 hover:bg-primary-50 hover:text-primary-700 transition-all duration-200 rounded-xl ${
                !isSidebarOpen ? 'justify-center py-3 px-1' : 'p-3'
              }`}
            >
              {isSidebarOpen ? (
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FaUsers size={16} className="text-primary-600" />
                </div>
              ) : (
                <FaUsers size={18} className="text-primary-600" />
              )}
              {isSidebarOpen && <span className="font-medium">Clientes</span>}
            </Link>
          )}

          {/* Perfil - Todos los usuarios */}
          <Link
            to="/perfil"
            onClick={handleNavClick}
            className={`flex items-center gap-3 hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 rounded-xl ${
              !isSidebarOpen ? 'justify-center py-3 px-1' : 'p-3'
            }`}
          >
            {isSidebarOpen ? (
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <FaUser size={16} className="text-purple-600" />
              </div>
            ) : (
              <FaUser size={18} className="text-purple-600" />
            )}
            {isSidebarOpen && <span className="font-medium">Mi Perfil</span>}
          </Link>
        </nav>
        
        {/* Sección de usuario y logout */}
        <div className="mt-auto pt-6 border-t border-secondary-200 flex flex-col items-center space-y-3">
          {isSidebarOpen && user && (
            <div className="text-center">
              <p className="text-sm text-secondary-600">
                Bienvenido,
              </p>
              <p className="font-semibold text-secondary-800">{user.nombre}</p>
              <p className="text-xs text-secondary-500 mt-1">
                {user.rol === 'admin' ? '👑 Administrador' : user.rol === 'responsable_inventario' ? '📦 Resp. Inventario' : '🔧 Técnico'}
              </p>
            </div>
          )}
          <button
            onClick={logout}
            className={`flex items-center justify-center gap-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors py-1 px-3 text-sm ${
              isSidebarOpen
                ? 'w-full justify-start'
                : 'w-10 h-10 p-2'
            }`}
          >
            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
              <path d="M497 273L329 441c-15 15-41 4.5-41-17v-96H152c-13.3 0-24-10.7-24-24v-96c0-13.3 10.7-24 24-24h136V88c0-21.4 25.9-32 41-17l168 168c9.3 9.4 9.3 24.6 0 34zM192 436v-40c0-6.6-5.4-12-12-12H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h84c6.6 0 12-5.4 12-12V76c0-6.6-5.4-12-12-12H96c-53 0-96 43-96 96v192c0 53 43 96 96 96h84c6.6 0 12-5.4 12-12z"></path>
            </svg>
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