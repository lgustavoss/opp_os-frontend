import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, UserX } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Loading from '../../components/ui/Loading'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { usuarioService } from '../../services/usuarioService'
import { API_PAGE_SIZE } from '../../config/api'
import { formatDate } from '../../utils/formatters'

const UsuariosList = () => {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deactivateModal, setDeactivateModal] = useState({ open: false, user: null })
  const [deactivating, setDeactivating] = useState(false)

  useEffect(() => {
    loadUsuarios()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const loadUsuarios = async () => {
    try {
      setLoading(true)
      const data = await usuarioService.list({ page })
      const list = data.results ?? (Array.isArray(data) ? data : [])
      setUsuarios(list)
      const count = data.count ?? list.length
      setTotalPages(Math.max(1, Math.ceil(count / API_PAGE_SIZE)))
    } catch (e) {
      console.error(e)
      setUsuarios([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeactivate = async () => {
    if (!deactivateModal.user) return
    try {
      setDeactivating(true)
      await usuarioService.remove(deactivateModal.user.id)
      setDeactivateModal({ open: false, user: null })
      loadUsuarios()
    } catch (err) {
      alert(err.response?.data?.erro || 'Não foi possível desativar o usuário.')
    } finally {
      setDeactivating(false)
    }
  }

  if (loading && usuarios.length === 0) {
    return <Loading fullScreen />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Usuários</h1>
          <p className="text-secondary-600 mt-1">
            Cadastro e permissões (apenas administradores)
          </p>
        </div>
        <Link to="/usuarios/novo">
          <Button variant="primary" className="flex items-center gap-2 w-full sm:w-auto justify-center">
            <Plus className="w-4 h-4" />
            Novo usuário
          </Button>
        </Link>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-secondary-200 text-left">
                <th className="py-3 px-2 font-medium text-secondary-700">Nome</th>
                <th className="py-3 px-2 font-medium text-secondary-700">E-mail</th>
                <th className="py-3 px-2 font-medium text-secondary-700">Perfil</th>
                <th className="py-3 px-2 font-medium text-secondary-700">Status</th>
                <th className="py-3 px-2 font-medium text-secondary-700">Cadastro</th>
                <th className="py-3 px-2 font-medium text-secondary-700 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-secondary-100 hover:bg-secondary-50/50">
                  <td className="py-3 px-2 text-secondary-900">{u.nome_exibicao || '-'}</td>
                  <td className="py-3 px-2 text-secondary-700">{u.email}</td>
                  <td className="py-3 px-2">
                    {u.is_staff ? (
                      <Badge variant="primary">Staff</Badge>
                    ) : (
                      <Badge variant="secondary">Usuário</Badge>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <Badge variant={u.is_active ? 'success' : 'danger'}>
                      {u.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-secondary-600">{formatDate(u.date_joined)}</td>
                  <td className="py-3 px-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Link to={`/usuarios/${u.id}/editar`}>
                        <button
                          type="button"
                          className="p-2 rounded-lg hover:bg-secondary-100 text-secondary-600"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </Link>
                      {u.is_active && (
                        <button
                          type="button"
                          onClick={() => setDeactivateModal({ open: true, user: u })}
                          className="p-2 rounded-lg hover:bg-secondary-100 text-secondary-600"
                          title="Desativar"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {usuarios.length === 0 && !loading && (
          <p className="text-center text-secondary-500 py-8">Nenhum usuário encontrado.</p>
        )}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-4 border-t border-secondary-100">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <span className="self-center text-sm text-secondary-600">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        )}
      </Card>

      <Modal
        isOpen={deactivateModal.open}
        onClose={() => !deactivating && setDeactivateModal({ open: false, user: null })}
        title="Desativar usuário"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeactivateModal({ open: false, user: null })}
              disabled={deactivating}
            >
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDeactivate} isLoading={deactivating}>
              Desativar
            </Button>
          </>
        }
      >
        <p className="text-sm text-secondary-700">
          O usuário <strong>{deactivateModal.user?.email}</strong> não poderá mais entrar no sistema.
          Confirma?
        </p>
      </Modal>
    </div>
  )
}

export default UsuariosList
