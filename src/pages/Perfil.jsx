import { useAuth } from '../contexts/AuthContext'
import Card from '../components/ui/Card'
import { formatDate } from '../utils/formatters'

const Perfil = () => {
  const { user } = useAuth()

  const getIniciais = (name) => {
    if (!name || !name.trim()) return 'U'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Perfil</h1>
        <p className="text-secondary-600 mt-1">Seus dados de usuário</p>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-primary-600 text-white flex items-center justify-center text-2xl font-semibold shrink-0">
            {getIniciais(user?.username || user?.first_name || 'Usuário')}
          </div>
          <div className="space-y-2 flex-1 min-w-0">
            <div>
              <p className="text-sm text-secondary-500">Usuário</p>
              <p className="font-medium text-secondary-900">{user?.username || '—'}</p>
            </div>
            {(user?.first_name || user?.last_name) && (
              <div>
                <p className="text-sm text-secondary-500">Nome</p>
                <p className="font-medium text-secondary-900">
                  {[user.first_name, user.last_name].filter(Boolean).join(' ') || '—'}
                </p>
              </div>
            )}
            {user?.email && (
              <div>
                <p className="text-sm text-secondary-500">E-mail</p>
                <p className="font-medium text-secondary-900">{user.email}</p>
              </div>
            )}
            {user?.date_joined && (
              <div>
                <p className="text-sm text-secondary-500">Membro desde</p>
                <p className="font-medium text-secondary-900">{formatDate(user.date_joined)}</p>
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-secondary-500 mt-4 pt-4 border-t border-secondary-100">
          Para alterar senha ou outros dados do usuário, entre em contato com o administrador do sistema.
        </p>
      </Card>
    </div>
  )
}

export default Perfil
