import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Proyectos from './pages/Proyectos';
import ProyectoDetalle from './pages/ProyectoDetalle';
import Clientes from './pages/Clientes';
import ClienteDetalle from './pages/ClienteDetalle';
import Colaboradores from './pages/Colaboradores';
import ColaboradorDetalle from './pages/ColaboradorDetalle';
import Egresos from './pages/Egresos';
import Impuestos from './pages/Impuestos';
import FlujoCaja from './pages/FlujoCaja';
import Liquidaciones from './pages/Liquidaciones';
import { useAuth } from './context/AuthContext';

function PrivateRoute({ children }) {
  const { isAuth } = useAuth();
  return isAuth ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"             element={<Dashboard />} />

        <Route path="proyectos"             element={<Proyectos />} />
        <Route path="proyectos/:id"         element={<ProyectoDetalle />} />

        <Route path="clientes"              element={<Clientes />} />
        <Route path="clientes/:id"          element={<ClienteDetalle />} />

        <Route path="colaboradores"         element={<Colaboradores />} />
        <Route path="colaboradores/:id"     element={<ColaboradorDetalle />} />

        <Route path="egresos"               element={<Egresos />} />
        <Route path="impuestos"             element={<Impuestos />} />
        <Route path="flujo-caja"            element={<FlujoCaja />} />
        <Route path="liquidaciones"         element={<Liquidaciones />} />
      </Route>
    </Routes>
  );
}
