import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ProtectedRoute from '../components/common/ProtectedRoute'
import Layout from '../components/layout/Layout'
import Loading from '../components/ui/Loading'

// Pages
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import ClientesList from '../pages/clientes/ClientesList'
import ClienteForm from '../pages/clientes/ClienteForm'
import ClienteDetail from '../pages/clientes/ClienteDetail'
import OrcamentosList from '../pages/orcamentos/OrcamentosList'
import OrcamentoForm from '../pages/orcamentos/OrcamentoForm'
import OrcamentoDetail from '../pages/orcamentos/OrcamentoDetail'
import EmpresasList from '../pages/empresas/EmpresasList'
import EmpresaForm from '../pages/empresas/EmpresaForm'
import Perfil from '../pages/Perfil'

const AppRoutes = () => {
  const { loading } = useAuth()

  if (loading) {
    return <Loading fullScreen />
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clientes"
        element={
          <ProtectedRoute>
            <Layout>
              <ClientesList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clientes/novo"
        element={
          <ProtectedRoute>
            <Layout>
              <ClienteForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clientes/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <ClienteDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clientes/:id/editar"
        element={
          <ProtectedRoute>
            <Layout>
              <ClienteForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orcamentos"
        element={
          <ProtectedRoute>
            <Layout>
              <OrcamentosList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orcamentos/novo"
        element={
          <ProtectedRoute>
            <Layout>
              <OrcamentoForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orcamentos/:id/editar"
        element={
          <ProtectedRoute>
            <Layout>
              <OrcamentoForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orcamentos/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <OrcamentoDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/empresas/nova"
        element={
          <ProtectedRoute>
            <Layout>
              <EmpresaForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/empresas/:id/editar"
        element={
          <ProtectedRoute>
            <Layout>
              <EmpresaForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/empresas"
        element={
          <ProtectedRoute>
            <Layout>
              <EmpresasList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/configuracoes/nova" element={<Navigate to="/empresas/nova" replace />} />
      <Route path="/configuracoes" element={<Navigate to="/empresas" replace />} />
      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <Layout>
              <Perfil />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// Componente para rotas públicas (redireciona se já autenticado)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return children
}

export default AppRoutes

