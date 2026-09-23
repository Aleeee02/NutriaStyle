import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AdminLayout } from "./components/AdminLayout";
import { RequireAdmin, RequireAuth, RequireStaff } from "./components/RouteGuards";

import Home from "./pages/Home";
import Barberos from "./pages/Barberos";
import Tarifas from "./pages/Tarifas";
import Promociones from "./pages/Promociones";
import { Privacidad, Terminos } from "./pages/Legal";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import AuthCallback from "./pages/AuthCallback";
import CompletarPerfil from "./pages/CompletarPerfil";
import Canjear from "./pages/Canjear";
import Asistencia from "./pages/Asistencia";
import Reservas from "./pages/Reservas";
import Fidelizacion from "./pages/Fidelizacion";

import AdminDashboard from "./pages/admin/Dashboard";
import AdminServicios from "./pages/admin/Servicios";
import AdminServicioForm from "./pages/admin/ServicioForm";
import AdminEmpleados from "./pages/admin/Empleados";
import AdminEmpleadoForm from "./pages/admin/EmpleadoForm";
import AdminEmpleadoHorarios from "./pages/admin/EmpleadoHorarios";
import AdminUsuarios from "./pages/admin/Usuarios";
import AdminReservas from "./pages/admin/ReservasAdmin";
import AdminConfiguracion from "./pages/admin/Configuracion";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/barberos" element={<Layout><Barberos /></Layout>} />
      <Route path="/tarifas" element={<Layout><Tarifas /></Layout>} />
      <Route path="/promociones" element={<Layout><Promociones /></Layout>} />
      <Route path="/privacidad" element={<Layout><Privacidad /></Layout>} />
      <Route path="/terminos" element={<Layout><Terminos /></Layout>} />
      <Route path="/login" element={<Layout><Login /></Layout>} />
      <Route path="/registro" element={<Layout><Registro /></Layout>} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/asistencia"
        element={
          <RequireStaff>
            <Layout>
              <Asistencia />
            </Layout>
          </RequireStaff>
        }
      />
      <Route
        path="/canjear"
        element={
          <RequireStaff>
            <Layout>
              <Canjear />
            </Layout>
          </RequireStaff>
        }
      />
      <Route
        path="/completar-perfil"
        element={
          <RequireAuth>
            <Layout>
              <CompletarPerfil />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/reservas"
        element={
          <RequireAuth>
            <Layout>
              <Reservas />
            </Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/fidelizacion"
        element={
          <RequireAuth>
            <Layout>
              <Fidelizacion />
            </Layout>
          </RequireAuth>
        }
      />

      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/servicios"
        element={
          <RequireAdmin>
            <AdminLayout>
              <AdminServicios />
            </AdminLayout>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/servicios/nuevo"
        element={
          <RequireAdmin>
            <AdminLayout>
              <AdminServicioForm />
            </AdminLayout>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/servicios/:id/editar"
        element={
          <RequireAdmin>
            <AdminLayout>
              <AdminServicioForm />
            </AdminLayout>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/empleados"
        element={
          <RequireAdmin>
            <AdminLayout>
              <AdminEmpleados />
            </AdminLayout>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/empleados/nuevo"
        element={
          <RequireAdmin>
            <AdminLayout>
              <AdminEmpleadoForm />
            </AdminLayout>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/empleados/:id/editar"
        element={
          <RequireAdmin>
            <AdminLayout>
              <AdminEmpleadoForm />
            </AdminLayout>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/empleados/:id/horarios"
        element={
          <RequireAdmin>
            <AdminLayout>
              <AdminEmpleadoHorarios />
            </AdminLayout>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/usuarios"
        element={
          <RequireAdmin>
            <AdminLayout>
              <AdminUsuarios />
            </AdminLayout>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/reservas"
        element={
          <RequireAdmin>
            <AdminLayout>
              <AdminReservas />
            </AdminLayout>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/configuracion"
        element={
          <RequireAdmin>
            <AdminLayout>
              <AdminConfiguracion />
            </AdminLayout>
          </RequireAdmin>
        }
      />
    </Routes>
  );
}
