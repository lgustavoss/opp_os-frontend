import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Loading from '../../components/ui/Loading'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import Checkbox from '../../components/ui/Checkbox'
import { clienteService } from '../../services/clienteService'
import { formatCNPJCPF } from '../../utils/formatters'

const ClientesList = () => {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [incluirInativos, setIncluirInativos] = useState(false)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, cliente: null })
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadClientes()
  }, [page, search, incluirInativos])

  const loadClientes = async () => {
    try {
      setLoading(true)
      const params = { page }
      
      // Adiciona parâmetro para incluir inativos se necessário
      if (incluirInativos) {
        params.incluir_inativos = true
      }
      
      if (search) {
        // Remove formatação da busca para verificar se é apenas números
        const searchCleaned = search.replace(/\D/g, '')
        const originalCleaned = search.replace(/\s/g, '')
        
        // Se a busca contém apenas números (CNPJ/CPF), busca por cnpj_cpf
        // Caso contrário, busca por razão social
        if (searchCleaned.length > 0 && searchCleaned === originalCleaned) {
          params.cnpj_cpf = searchCleaned
        } else {
          params.razao_social = search
        }
      }
      
      const data = await clienteService.list(params)
      setClientes(data.results || [])
      setTotalPages(Math.ceil((data.count || 0) / 20))
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      console.error('Status:', error.response?.status)
      console.error('Detalhes do erro:', error.response?.data)
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Erro de autenticação será tratado pelo interceptor do axios
        return
      }
      // Não mostra alerta para não interromper o fluxo, apenas loga o erro
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.cliente) return

    try {
      setDeleting(true)
      const response = await clienteService.delete(deleteModal.cliente.id)
      // Agora retorna 200 OK com JSON: {"mensagem": "Cliente marcado como inativo com sucesso"}
      if (response?.mensagem) {
        // Cliente foi marcado como inativo com sucesso
        setDeleteModal({ isOpen: false, cliente: null })
        loadClientes()
      }
    } catch (error) {
      console.error('Erro ao deletar cliente:', error)
      alert('Erro ao deletar cliente. Verifique se não há ordens de serviço associadas.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading && clientes.length === 0) {
    return <Loading fullScreen />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Clientes</h1>
          <p className="text-secondary-600 mt-1">
            Gerencie seus clientes
          </p>
        </div>
        <Link to="/clientes/novo">
          <Button variant="primary" className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Novo Cliente
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1 max-w-md">
            <Input
              type="text"
              placeholder="Buscar por CNPJ/CPF ou Razão Social..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              label="Incluir inativos"
              checked={incluirInativos}
              onChange={(e) => {
                setIncluirInativos(e.target.checked)
                setPage(1)
              }}
            />
            {search && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearch('')
                  setPage(1)
                }}
              >
                Limpar
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : clientes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-secondary-500">
              {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block w-full max-w-full overflow-hidden">
              <div className="w-full max-w-full overflow-hidden">
                <table className="w-full table-fixed">
                  <colgroup>
                    <col className="w-[12%]" />
                    <col className="w-[28%]" />
                    <col className="w-[20%]" />
                    <col className="w-[10%]" />
                    <col className="w-[15%]" />
                    <col className="w-[15%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-secondary-200">
                      <th className="text-left py-3 px-2 text-sm font-semibold text-secondary-700">
                        CNPJ/CPF
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-semibold text-secondary-700">
                        Razão Social
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-semibold text-secondary-700">
                        Nome Fantasia
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-semibold text-secondary-700">
                        Status
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-semibold text-secondary-700">
                        Cidade/UF
                      </th>
                      <th className="text-right py-3 px-2 text-sm font-semibold text-secondary-700">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.map((cliente) => (
                      <tr
                        key={cliente.id}
                        className="border-b border-secondary-100 hover:bg-secondary-50 transition-colors"
                      >
                        <td className="py-3 px-2 text-sm text-secondary-900 truncate">
                          {formatCNPJCPF(cliente.cnpj_cpf)}
                        </td>
                        <td className="py-3 px-2 text-sm text-secondary-900 truncate" title={cliente.razao_social}>
                          {cliente.razao_social}
                        </td>
                        <td className="py-3 px-2 text-sm text-secondary-600 truncate" title={cliente.nome_fantasia || ''}>
                          {cliente.nome_fantasia || '-'}
                        </td>
                        <td className="py-3 px-2">
                          <Badge
                            variant={cliente.ativo ? 'success' : 'danger'}
                            className="whitespace-nowrap"
                          >
                            {cliente.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-sm text-secondary-600 truncate">
                          {cliente.cidade && cliente.estado
                            ? `${cliente.cidade}/${cliente.estado}`
                            : '-'}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center justify-end gap-1">
                            <Link to={`/clientes/${cliente.id}`}>
                              <button className="p-2 rounded-lg hover:bg-primary-50 text-primary-600 transition-colors">
                                <Eye className="w-4 h-4" />
                              </button>
                            </Link>
                            <Link to={`/clientes/${cliente.id}/editar`}>
                              <button className="p-2 rounded-lg hover:bg-secondary-100 text-secondary-600 transition-colors">
                                <Edit className="w-4 h-4" />
                              </button>
                            </Link>
                            <button
                              onClick={() =>
                                setDeleteModal({ isOpen: true, cliente })
                              }
                              className="p-2 rounded-lg hover:bg-danger-50 text-danger-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {clientes.map((cliente) => (
                <Card key={cliente.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-secondary-900">
                          {cliente.razao_social}
                        </h3>
                        {cliente.nome_fantasia && (
                          <p className="text-sm text-secondary-600 mt-1">
                            {cliente.nome_fantasia}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={cliente.ativo ? 'success' : 'danger'}
                        className="ml-2"
                      >
                        {cliente.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-secondary-500">CNPJ/CPF: </span>
                        <span className="text-secondary-900">
                          {formatCNPJCPF(cliente.cnpj_cpf)}
                        </span>
                      </div>
                      {cliente.cidade && cliente.estado && (
                        <div>
                          <span className="text-secondary-500">Cidade/UF: </span>
                          <span className="text-secondary-900">
                            {cliente.cidade}/{cliente.estado}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-secondary-200">
                      <Link to={`/clientes/${cliente.id}`}>
                        <button className="p-2 rounded-lg hover:bg-primary-50 text-primary-600 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                      </Link>
                      <Link to={`/clientes/${cliente.id}/editar`}>
                        <button className="p-2 rounded-lg hover:bg-secondary-100 text-secondary-600 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                      </Link>
                      <button
                        onClick={() =>
                          setDeleteModal({ isOpen: true, cliente })
                        }
                        className="p-2 rounded-lg hover:bg-danger-50 text-danger-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-secondary-200">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg border border-secondary-300 text-sm font-medium text-secondary-700 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="text-sm text-secondary-600">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg border border-secondary-300 text-sm font-medium text-secondary-700 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, cliente: null })}
        title="Confirmar Exclusão"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleteModal({ isOpen: false, cliente: null })}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={deleting}
            >
              Excluir
            </Button>
          </>
        }
      >
        <p className="text-secondary-700">
          Tem certeza que deseja marcar o cliente{' '}
          <strong>{deleteModal.cliente?.razao_social}</strong> como inativo?
        </p>
        <p className="text-sm text-secondary-500 mt-2">
          O cliente será marcado como inativo e não aparecerá mais na listagem padrão.
        </p>
      </Modal>
    </div>
  )
}

export default ClientesList

