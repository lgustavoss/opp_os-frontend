import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Loading from '../ui/Loading'
import { permissoesDoUsuario } from '../../utils/moduloPermissoes'

/**
 * @param {'clientes'|'orcamentos'|'configuracoes'} modulo
 * @param {'visualizar'|'cadastrar'|'configurar'} nivel — cadastrar = criar/editar; configurar = empresas
 */
const ModuloRoute = ({ modulo, nivel = 'visualizar', children }) => {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) {
    return <Loading fullScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const p = permissoesDoUsuario(user)
  if (p.isStaff) {
    return children
  }

  let ok = false
  if (modulo === 'clientes') {
    ok = nivel === 'cadastrar' ? p.clientes_pode_cadastrar : p.clientes_pode_visualizar
  } else if (modulo === 'orcamentos') {
    ok = nivel === 'cadastrar' ? p.orcamentos_pode_cadastrar : p.orcamentos_pode_visualizar
  } else if (modulo === 'configuracoes') {
    ok = nivel === 'configurar' ? p.configuracoes_pode_configurar : p.configuracoes_pode_visualizar
  }

  if (!ok) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ModuloRoute
