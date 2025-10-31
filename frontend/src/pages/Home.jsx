import { FaTools, FaExchangeAlt, FaClipboardList, FaUsers, FaChartLine, FaPlus } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Home() {
  const { user } = useAuth();

  const quickActions = [
    {
      title: "Nueva Cotización",
      description: "Crear una nueva cotización para clientes",
      icon: FaPlus,
      path: "/cotización",
      color: "primary"
    },
    {
      title: "Ver Cotizaciones",
      description: "Consultar cotizaciones existentes",
      icon: FaClipboardList,
      path: "/cotizaciones",
      color: "secondary"
    },
    {
      title: "Gestionar Clientes",
      description: "Administrar base de datos de clientes",
      icon: FaUsers,
      path: "/clientes",
      color: "success"
    },
    ...(user?.rol === 'admin' ? [{
      title: "Inventario",
      description: "Gestionar herramientas y productos",
      icon: FaTools,
      path: "/herramientas",
      color: "warning"
    }] : []),
    {
      title: "Movimientos",
      description: "Ver historial de movimientos",
      icon: FaExchangeAlt,
      path: "/movimientos",
      color: "accent"
    }
  ];

  return (
    <div className="fade-in">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full mb-4 shadow-soft">
          <FaChartLine className="text-white text-2xl" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-2">
          Bienvenido a Inventario
        </h1>
        <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
          Sistema integral de gestión para tu inventario de obras. Gestiona herramientas, cotizaciones y movimientos de manera eficiente.
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link
              key={index}
              to={action.path}
              className="card group hover:scale-105 transition-transform duration-200"
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 bg-${action.color}-100 rounded-xl flex items-center justify-center group-hover:bg-${action.color}-200 transition-colors duration-200`}>
                  <Icon className={`text-${action.color}-600 text-xl`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-secondary-900 mb-1">{action.title}</h3>
                  <p className="text-sm text-secondary-600">{action.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <FaClipboardList className="text-primary-600 text-xl" />
          </div>
          <h3 className="font-semibold text-secondary-900 mb-1">Cotizaciones</h3>
          <p className="text-2xl font-bold text-primary-600">--</p>
          <p className="text-sm text-secondary-500">Activas este mes</p>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <FaTools className="text-success-600 text-xl" />
          </div>
          <h3 className="font-semibold text-secondary-900 mb-1">Herramientas</h3>
          <p className="text-2xl font-bold text-success-600">--</p>
          <p className="text-sm text-secondary-500">En inventario</p>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <FaExchangeAlt className="text-warning-600 text-xl" />
          </div>
          <h3 className="font-semibold text-secondary-900 mb-1">Movimientos</h3>
          <p className="text-2xl font-bold text-warning-600">--</p>
          <p className="text-sm text-secondary-500">Este mes</p>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="mt-8 text-center">
        <p className="text-secondary-600">
          ¡Hola <span className="font-semibold text-primary-600">{user?.nombre}</span>! 
          Comienza explorando las opciones disponibles.
        </p>
      </div>
    </div>
  );
}
