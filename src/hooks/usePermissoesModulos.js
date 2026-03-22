import { useAuth } from '../contexts/AuthContext'
import { permissoesDoUsuario } from '../utils/moduloPermissoes'

export function usePermissoesModulos() {
  const { user } = useAuth()
  return permissoesDoUsuario(user)
}
