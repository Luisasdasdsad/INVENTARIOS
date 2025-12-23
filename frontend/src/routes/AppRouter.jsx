import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import HerramientasList from "../features/herramientas/HerramientasList";
import MovimientosList from "../features/movimientos/MovimientosList";
import Home from "../pages/Home";
import LoginPage from "../pages/Auth/LoginPage";
import RegisterPage from "../pages/Auth/RegisterPage";
import RegistrarMovimientoPage from "../features/movimientos/RegistrarMovimientoPage";
import { AuthProvider } from "../contexts/AuthContext";
import { PrivateRoute } from "../components/PrivateRoute";
import Cotización from "../features/cotización/Cotización";
import { NotificationProvider } from "../contexts/NotificationContext";
import CotizaciónList from "../features/cotización/CotizaciónList";
import CotizaciónHistorial from "../features/cotización/CotizaciónHistorial"; 
import OrdenTrabajoList from "../features/ordenTrabajo/OrdenTrabajoList"; 
import CrearOrdenTrabajo from "../features/ordenTrabajo/CrearOrdenTrabajo";
import CrearOrdenTrabajoManual from "../features/ordenTrabajo/CrearOrdenTrabajoManual";
import CalendarioOrdenesPage from "../features/ordenTrabajo/CalendarioOrdenesPage";
import OrdenTrabajoDetalle from "../features/ordenTrabajo/OrdenTrabajoDetalle";
import ProductoList from "../features/productos/ProductoList";
import ClienteList from "../features/clientes/ClienteList";
import PerfilForm from "../features/perfil/PerfilForm";
import ProveedorList from "../features/proveedores/ProveedorList";
import FacturaList from "../features/facturas/FacturaList";
import ComprasList from "../features/compras/ComprasList";
import Agenda from "../features/agenda/Agenda";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
        <Routes>
          {/* Rutas de Autenticación */}
          <Route path="/" element={<AuthLayout />}>
            <Route index element={<Navigate to="/login" />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
          </Route>

          {/* Rutas Protegidas (Dashboard) */}
          <Route path="/" element={<PrivateRoute />}>
            <Route path="home" element={<Home />} />
            <Route path="herramientas" element={<HerramientasList />} />
            <Route path="movimientos" element={<MovimientosList />} />
            <Route path="movimientos/registrar" element={<RegistrarMovimientoPage />} />
            <Route path="perfil" element={<PerfilForm />} />
            <Route path="compras" element={<ComprasList />} />
            <Route path="agenda" element={<Agenda />} />

            {/* 🔄 Cotizaciones separadas en dos rutas */}
            <Route path="cotizaciones" element={<CotizaciónList />} /> {/* Mis cotizaciones editables */}
            <Route path="cotización" element={<Cotización />} /> {/* Crear/Editar cotización */}
            <Route path="historial-cotizaciones" element={<CotizaciónHistorial />} /> {/* 🆕 Historial solo lectura */}
            <Route path="ordenes-trabajo" element={<OrdenTrabajoList />} /> {/* 🆕 Órdenes de Trabajo */}
            <Route path="ordenes-trabajo/crear" element={<CrearOrdenTrabajo />} />
            <Route path="ordenes-trabajo/calendario" element={<CalendarioOrdenesPage />} />
            <Route path="ordenes-trabajo/:id" element={<OrdenTrabajoDetalle />} />
            <Route path="facturas" element={<FacturaList />} />
            <Route path="ordenes-trabajo/editar/:id" element={<CrearOrdenTrabajoManual />} />
          </Route>

          {/* Rutas Protegidas con Roles Específicos */}
          <Route path="/" element={<PrivateRoute allowedRoles={['admin', 'tecnico', 'jefe_inventario', 'administracion']} />}>
          <Route path="productos" element={<ProductoList />} />
          </Route>
          <Route path="/" element={<PrivateRoute allowedRoles={['admin', 'superadmin', 'administracion']} />}>
          <Route path="clientes" element={<ClienteList />} />
          <Route path="proveedores" element={<ProveedorList />} />
          <Route path="cotizaciones" element={<Cotización />} />
          </Route>

          {/* Ruta para 404 */}
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}