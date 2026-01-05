import { Outlet, Link, useNavigate } from "react-router-dom";
import { FaTools, FaClipboardList, FaExchangeAlt, FaHome, FaSignOutAlt, FaBars, FaTimes, FaUsers, FaFileAlt, FaHistory, FaPlus, FaUser, FaFileInvoiceDollar, FaTruck, FaBell, FaUserCircle, FaUserCog, FaShoppingCart, FaCalendarAlt, FaChevronDown, FaChevronRight, FaBox, FaCogs } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";
import { useNotifications } from "../contexts/NotificationContext";
import { Toaster } from 'react-hot-toast';

export default function DashboardLayout() {
  const { logout, user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { unreadCount, notificaciones, marcarLeida } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null); // Estado para acordeón
  const navigate = useNavigate();

  // Detectar si es móvil
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    // Solo cerramos el sidebar al cargar la página si es móvil, no en cada resize
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }

    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
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

  // Manejar clic en una notificación
  const handleNotificationClick = async (notif) => {
    if (!notif.leido) {
      await marcarLeida(notif._id);
    }
    setShowNotifications(false);
    
    // Redirigir según el tipo de notificación
    if (notif.tipo === 'compra') {
      navigate('/compras');
    } else {
      navigate('/ordenes-trabajo');
    }
  };

  // Calcular conteos específicos para el sidebar
  const unreadCompras = notificaciones.filter(n => !n.leido && n.tipo === 'compra').length;
  const unreadOTs = notificaciones.filter(n => !n.leido && n.tipo !== 'compra').length;

  // Función para alternar submenús
  const toggleSubmenu = (menu) => {
    if (!isSidebarOpen) setIsSidebarOpen(true); // Abrir sidebar si está colapsado
    setActiveSubmenu(activeSubmenu === menu ? null : menu);
  };

  // Componente auxiliar para Grupos de Navegación (Acordeón)
  const NavGroup = ({ title, icon: Icon, id, children, badgeCount }) => {
    const isActive = activeSubmenu === id;
    return (
      <div className="mb-1">
        <button
          onClick={() => toggleSubmenu(id)}
          className={`w-full flex items-center justify-between hover:bg-primary-50 hover:text-primary-700 transition-all duration-200 rounded-xl ${
            !isSidebarOpen ? 'justify-center py-3 px-1' : 'p-3'
          } ${isActive ? 'bg-primary-50 text-primary-700' : 'text-secondary-600'}`}
        >
          <div className="flex items-center gap-3">
            {isSidebarOpen ? (
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-primary-100' : 'bg-gray-100'}`}>
                <Icon size={16} className={isActive ? "text-primary-600" : "text-gray-500"} />
              </div>
            ) : (
              <Icon size={18} className={isActive ? "text-primary-600" : "text-gray-500"} />
            )}
            {isSidebarOpen && <span className="font-medium text-sm">{title}</span>}
            {isSidebarOpen && badgeCount > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{badgeCount}</span>}
          </div>
          {isSidebarOpen && (isActive ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />)}
        </button>
        <div className={`overflow-hidden transition-all duration-300 ${isActive && isSidebarOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="mt-1 space-y-1 pl-2 border-l-2 border-gray-100 ml-4">
            {children}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-secondary-50 to-secondary-100">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#363636', color: '#fff' },
          success: { style: { background: '#10B981', color: '#fff' } },
          error: { style: { background: '#EF4444', color: '#fff' } },
        }}
      />
      {/* Overlay para móvil */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-secondary-900 bg-opacity-50 z-40 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`bg-white shadow-large p-6 transition-all duration-300 ease-in-out z-50 border-r border-secondary-200 flex flex-col h-full overflow-y-auto ${
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

          {/* Agenda Virtual */}
          <Link
            to="/agenda"
            onClick={handleNavClick}
            className={`flex items-center gap-3 hover:bg-teal-50 hover:text-teal-700 transition-all duration-200 rounded-xl ${
              !isSidebarOpen ? 'justify-center py-3 px-1' : 'p-3'
            }`}
          >
            {isSidebarOpen ? (
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                <FaCalendarAlt size={16} className="text-teal-600" />
              </div>
            ) : (
              <FaCalendarAlt size={18} className="text-teal-600" />
            )}
            {isSidebarOpen && <span className="font-medium">Agenda</span>}
          </Link>

          {/* GRUPO: INVENTARIO */}
          {user && (['admin', 'superadmin', 'tecnico', 'ingeniero', 'jefe_inventario', 'administracion'].includes(user.rol)) && (
            <NavGroup title="Inventario" icon={FaBox} id="inventario">
              <Link to="/herramientas" onClick={handleNavClick} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-secondary-600 hover:text-primary-600 transition-colors">
                <FaTools size={14} /> <span className="text-sm">Herramientas</span>
              </Link>
              <Link to="/movimientos" onClick={handleNavClick} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-secondary-600 hover:text-primary-600 transition-colors">
                <FaExchangeAlt size={14} /> <span className="text-sm">Movimientos</span>
              </Link>
              <Link to="/productos" onClick={handleNavClick} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-secondary-600 hover:text-primary-600 transition-colors">
                <FaClipboardList size={14} /> <span className="text-sm">Productos</span>
              </Link>
            </NavGroup>
          )}

          {/* --- SECCIÓN COTIZACIONES (Oculta para técnicos y jefe de inventario) --- */}
          {user?.rol !== 'tecnico' && user?.rol !== 'ingeniero' && user?.rol !== 'jefe_inventario' && (
            <NavGroup title="Ventas" icon={FaFileInvoiceDollar} id="ventas">
              {/* Nueva Cotización - Solo Admin */}
              {['admin', 'superadmin', 'administracion'].includes(user.rol) && (
                <Link to="/cotización" onClick={handleNavClick} className="flex items-center gap-3 p-2 rounded-lg hover:bg-green-50 text-secondary-600 hover:text-green-700 transition-colors">
                  <FaPlus size={14} /> <span className="text-sm">Nueva Cotización</span>
                </Link>
              )}
              <Link to="/cotizaciones" onClick={handleNavClick} className="flex items-center gap-3 p-2 rounded-lg hover:bg-yellow-50 text-secondary-600 hover:text-yellow-700 transition-colors">
                <FaFileAlt size={14} /> <span className="text-sm">Mis Cotizaciones</span>
              </Link>
              <Link to="/historial-cotizaciones" onClick={handleNavClick} className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 text-secondary-600 hover:text-blue-700 transition-colors">
                <FaHistory size={14} /> <span className="text-sm">Historial</span>
              </Link>
              <Link to="/facturas" onClick={handleNavClick} className="flex items-center gap-3 p-2 rounded-lg hover:bg-green-50 text-secondary-600 hover:text-green-700 transition-colors">
                <FaFileInvoiceDollar size={14} /> <span className="text-sm">Facturas</span>
              </Link>
            </NavGroup>
          )}

          {/* --- SECCIÓN COMPRAS (Nueva Sección Independiente) --- */}
          <NavGroup title="Compras" icon={FaShoppingCart} id="compras" badgeCount={unreadCompras}>
            <Link to="/compras" onClick={handleNavClick} className="flex items-center gap-3 p-2 rounded-lg hover:bg-orange-50 text-secondary-600 hover:text-orange-700 transition-colors justify-between">
              <div className="flex items-center gap-3">
                <FaClipboardList size={14} /> <span className="text-sm">Requerimientos</span>
              </div>
              {unreadCompras > 0 && (
                <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCompras}
                </span>
              )}
            </Link>
          </NavGroup>

          {/* --- SECCIÓN ORDEN DE TRABAJO (Oculta para jefe de inventario) --- */}
          {user?.rol !== 'jefe_inventario' && (
            <NavGroup title="Orden de Trabajo" icon={FaClipboardList} id="ots" badgeCount={unreadOTs}>
              <Link to="/ordenes-trabajo" onClick={handleNavClick} className="flex items-center gap-3 p-2 rounded-lg hover:bg-indigo-50 text-secondary-600 hover:text-indigo-700 transition-colors justify-between">
                <div className="flex items-center gap-3">
                  <FaClipboardList size={14} /> <span className="text-sm">Órdenes</span>
                </div>
                {unreadOTs > 0 && (
                  <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadOTs}
                  </span>
                )}
              </Link>
              <Link to="/ordenes-trabajo/calendario" onClick={handleNavClick} className="flex items-center gap-3 p-2 rounded-lg hover:bg-indigo-50 text-secondary-600 hover:text-indigo-700 transition-colors">
                <FaCalendarAlt size={14} /> <span className="text-sm">Calendario</span>
              </Link>
            </NavGroup>
          )}

          {/* --- SECCIÓN GESTIÓN (Admin) --- */}
          {user && ['admin', 'superadmin', 'administracion'].includes(user.rol) && (
            <NavGroup title="Gestión" icon={FaCogs} id="gestion">
              <Link to="/clientes" onClick={handleNavClick} className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary-50 text-secondary-600 hover:text-primary-700 transition-colors">
                <FaUsers size={14} /> <span className="text-sm">Clientes</span>
              </Link>
              <Link to="/proveedores" onClick={handleNavClick} className="flex items-center gap-3 p-2 rounded-lg hover:bg-teal-50 text-secondary-600 hover:text-teal-700 transition-colors">
                <FaTruck size={14} /> <span className="text-sm">Proveedores</span>
              </Link>
            </NavGroup>
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
                {user.rol === 'superadmin' ? '⚡ Super Admin' : user.rol === 'admin' ? '👑 Administrador' : user.rol === 'jefe_inventario' ? '📦 Jefe de Inventario' : user.rol === 'administracion' ? '💼 Administración' : user.rol === 'tecnico' ? '🔧 Técnico' : user.rol === 'ingeniero' ? '📐 Ingeniero' : '👷 Trabajador'}
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
        
        {/* HEADER SUPERIOR CON NOTIFICACIONES */}
        <header className="flex justify-between items-center mb-6 bg-white p-3 md:p-4 rounded-xl shadow-sm border border-secondary-100">
          <div className="flex items-center">
            {/* Botón móvil integrado en el header */}
            {isMobile && !isSidebarOpen && (
              <button
                onClick={toggleSidebar}
                className="p-2 mr-3 text-secondary-600 hover:bg-secondary-50 rounded-lg"
              >
                <FaBars size={20} />
              </button>
            )}
            <h2 className="text-lg font-semibold text-secondary-800">Panel de Control</h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Área de Notificaciones */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserMenu(false);
                }}
                className="p-2 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-all relative focus:outline-none"
              >
                <FaBell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white transform translate-x-1/4 -translate-y-1/4">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Menú Desplegable */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-secondary-100 z-50 overflow-hidden animate-fade-in-down">
                  <div className="p-4 border-b border-secondary-100 flex justify-between items-center bg-secondary-50">
                    <h3 className="font-semibold text-secondary-800">Notificaciones</h3>
                    <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-full">{unreadCount} nuevas</span>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {notificaciones.length === 0 ? (
                      <div className="p-8 text-center text-secondary-500 text-sm">
                        <p>No tienes notificaciones pendientes.</p>
                      </div>
                    ) : (
                      notificaciones.map(notif => (
                        <div 
                          key={notif._id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-4 border-b border-secondary-50 cursor-pointer hover:bg-secondary-50 transition-colors flex gap-3 ${!notif.leido ? 'bg-blue-50/50' : ''}`}
                        >
                          <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notif.leido ? 'bg-primary-500' : 'bg-transparent'}`}></div>
                          <div>
                            <p className={`text-sm ${!notif.leido ? 'font-semibold text-secondary-900' : 'text-secondary-700'}`}>
                              {notif.mensaje}
                            </p>
                            <p className="text-xs text-secondary-400 mt-1">
                              {new Date(notif.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Menú de Usuario */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
                className="p-2 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-all focus:outline-none"
                title="Opciones de Usuario"
              >
                <FaUserCircle size={24} />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl border border-secondary-100 z-50 overflow-hidden animate-fade-in-down">
                  <div className="py-1">
                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/perfil'); }}
                      className="block w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
                    >
                      Editar usuario
                    </button>
                    <button
                      onClick={() => { setShowUserMenu(false); logout(); }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Salir
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}