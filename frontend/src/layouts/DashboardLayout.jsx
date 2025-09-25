import { Outlet, Link } from "react-router-dom";
import { FaTools, FaClipboardList, FaExchangeAlt, FaHome, FaSignOutAlt } from "react-icons/fa"; // Importar FaHome y FaSignOutAlt
import { useAuth } from "../contexts/AuthContext"; // Importar useAuth
export default function DashboardLayout() {
  const { logout, user } = useAuth(); // Obtener la función logout y el usuario del contexto
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-4">
        <h1 className="text-xl font-bold mb-6">Inventario</h1>
        <nav className="space-y-4">
          <Link to="/home" className="flex items-center gap-2 hover:text-blue-600">
            <FaHome /> Inicio
          </Link>
          <Link to="/herramientas" className="flex items-center gap-2 hover:text-blue-600">
            <FaTools /> Herramientas
          </Link>
          <Link to="/movimientos" className="flex items-center gap-2 hover:text-blue-600">
            <FaExchangeAlt /> Movimientos
          </Link>
        </nav>
        <div className="mt-8 pt-4 border-t border-gray-200">
          {user && <p className="text-sm text-gray-600 mb-2">Bienvenido, <span className="font-semibold">{user.nombre}</span></p>}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors"
          >
            <FaSignOutAlt /> Cerrar Sesión
          </button>
        </div>
      </aside>
      {/* Contenido */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}