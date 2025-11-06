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
import CotizaciónList from "../features/cotización/CotizaciónList";
import CotizaciónHistorial from "../features/cotización/CotizaciónHistorial"; // 🆕 NUEVO
import ProductoList from "../features/productos/ProductoList";
import ClienteList from "../features/clientes/ClienteList";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
            
            {/* 🔄 Cotizaciones separadas en dos rutas */}
            <Route path="cotizaciones" element={<CotizaciónList />} /> {/* Mis cotizaciones editables */}
            <Route path="cotización" element={<Cotización />} /> {/* Crear/Editar cotización */}
            <Route path="historial-cotizaciones" element={<CotizaciónHistorial />} /> {/* 🆕 Historial solo lectura */}
          </Route>

          {/* Rutas Protegidas con Roles Específicos */}
          <Route path="/" element={<PrivateRoute allowedRoles={['admin']} />}>
            <Route path="productos" element={<ProductoList />} />
            <Route path="clientes" element={<ClienteList />} />
          </Route>

          {/* Ruta para 404 */}
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}