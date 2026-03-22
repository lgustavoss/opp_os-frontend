import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Loading from '../ui/Loading'

/**
 * Exige autenticação e usuário staff (is_staff), como no backend (CRUD usuários).
 */
const StaffRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) {
    return <Loading fullScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!user?.is_staff) {
    return <Navigate to="/" replace />
  }

  return children
}

export default StaffRoute
