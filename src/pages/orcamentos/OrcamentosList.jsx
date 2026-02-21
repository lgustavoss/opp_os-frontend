import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Eye, Edit, Trash2, Download } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Loading from '../../components/ui/Loading'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { orcamentoService } from '../../services/orcamentoService'
import { useAuth } from '../../contexts/AuthContext'
import { formatCurrency, formatDate, sanitizeFilename } from '../../utils/formatters'

const statusOptions = [
  { value: '', label: 'Todos os Status' },
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'rejeitado', label: 'Rejeitado' },
  { value: 'vencido', label: 'Vencido' },
  { value: 'cancelado', label: 'Cancelado' },
]

const OrcamentosList = () => {
  const { empresaAtual } = useAuth()
  const [orcamentos, setOrcamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [totalCount, setTotalCount] = useState(0)
  const [viewExcluidos, setViewExcluidos] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, orcamento: null })
  const [deleting, setDeleting] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)

  useEffect(() => {
    setPage(1)
  }, [empresaAtual?.id])

  useEffect(() => {
    loadOrcamentos()
  }, [empresaAtual?.id, page, statusFilter, viewExcluidos])

  const loadOrcamentos = async () => {
    try {
      setLoading(true)
      setLoadError(null)
      const params = { page }
      if (statusFilter) {
        params.status = statusFilter
      }
      if (viewExcluidos) {
        params.excluidos_apenas = 'true'
      }
      const data = await orcamentoService.list(params)
      setOrcamentos(data.results || [])
      setTotalCount(data.count ?? 0)
      setTotalPages(Math.ceil((data.count || 0) / 20))
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error)
      const status = error.response?.status
      const backendMsg = error.response?.data?.detail || error.response?.data?.message || error.response?.data?.erro
      setLoadError(
        backendMsg ||
        (status === 500
          ? 'Erro 500 no servidor. Verifique o console do backend (Django) para ver o traceback.'
          : 'Não foi possível carregar os orçamentos. Verifique se o backend está rodando e acessível.')
      )
      setOrcamentos([])
    } finally {
      setLoading(false)
    }
  }

  const handleGerarPDF = async (orcamento) => {
    try {
      setDownloadingId(orcamento.id)
      const blob = await orcamentoService.gerarOrcamento(orcamento.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const razaoSocial = sanitizeFilename(orcamento.cliente_nome ?? '')
      a.download = `${orcamento.numero} - ${razaoSocial || 'cliente'}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('Erro ao gerar PDF do orçamento.')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.orcamento) return

    try {
      setDeleting(true)
      await orcamentoService.delete(deleteModal.orcamento.id)
      setDeleteModal({ isOpen: false, orcamento: null })
      loadOrcamentos()
    } catch (error) {
      console.error('Erro ao deletar orçamento:', error)
      alert('Erro ao deletar orçamento.')
    } finally {
      setDeleting(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      rascunho: { variant: 'secondary', label: 'Rascunho' },
      enviado: { variant: 'primary', label: 'Enviado' },
      aprovado: { variant: 'success', label: 'Aprovado' },
      rejeitado: { variant: 'danger', label: 'Rejeitado' },
      vencido: { variant: 'warning', label: 'Vencido' },
      cancelado: { variant: 'danger', label: 'Cancelado' },
    }
    const statusInfo = statusMap[status] || { variant: 'secondary', label: status }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  if (loading && orcamentos.length === 0) {
    return <Loading fullScreen />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            Orçamentos
          </h1>
          <p className="text-secondary-600 mt-1">
            Gerencie seus orçamentos
          </p>
        </div>
        {!viewExcluidos && (
          <Link to="/orcamentos/novo" className="w-full sm:w-auto block sm:inline-block">
            <Button variant="primary" className="w-full sm:w-auto flex items-center justify-center gap-2">
              <Plus className="w-5 h-5 shrink-0" />
              Novo Orçamento
            </Button>
          </Link>
        )}
      </div>

      <Card>
        {/* Barra de filtros */}
        <div className="flex flex-col gap-4 pb-4 border-b border-secondary-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4 sm:gap-x-6 sm:gap-y-4">
              {/* Exibir: Ativos / Excluídos */}
              <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:items-center sm:gap-3">
                <label className="text-sm font-medium text-secondary-700 whitespace-nowrap">
                  Exibir
                </label>
                <div className="flex sm:inline-flex border border-secondary-200 rounded-lg p-0.5 h-10 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setViewExcluidos(false)
                      setPage(1)
                    }}
                    className={`flex-1 sm:flex-initial flex items-center justify-center h-full px-4 rounded-md text-sm font-medium transition-colors min-w-0 sm:min-w-[88px] ${
                      !viewExcluidos
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'text-secondary-600 hover:bg-secondary-100'
                    }`}
                  >
                    Ativos
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewExcluidos(true)
                      setPage(1)
                    }}
                    className={`flex-1 sm:flex-initial flex items-center justify-center h-full px-4 rounded-md text-sm font-medium transition-colors min-w-0 sm:min-w-[88px] ${
                      viewExcluidos
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'text-secondary-600 hover:bg-secondary-100'
                    }`}
                  >
                    Excluídos
                  </button>
                </div>
              </div>
              {/* Status - em mobile: label em cima, select full width */}
              <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-center sm:gap-3 sm:w-auto sm:min-w-[200px]">
                <label className="text-sm font-medium text-secondary-700 whitespace-nowrap sm:shrink-0">
                  Status
                </label>
                <div className="w-full sm:flex-1 sm:min-w-[160px] sm:w-48 [&_button]:h-10 [&_button]:min-h-[2.5rem] [&_button]:py-0 [&_button]:flex [&_button]:items-center">
                  <Select
                    label=""
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value)
                      setPage(1)
                    }}
                    options={statusOptions}
                    placeholder="Todos os Status"
                  />
                </div>
              </div>
            </div>
            {!loading && orcamentos.length > 0 && (
              <p className="text-sm text-secondary-500 shrink-0 self-center sm:self-auto">
                {totalCount} {totalCount === 1 ? 'orçamento' : 'orçamentos'}
              </p>
            )}
          </div>
          {viewExcluidos && (
            <p className="text-sm text-secondary-500">
              Orçamentos marcados como excluídos não aparecem na listagem principal.
            </p>
          )}
        </div>

        {/* Conteúdo */}
        {loading ? (
          <div className="py-12">
            <Loading />
          </div>
        ) : loadError ? (
          <div className="py-12 text-center">
            <p className="text-danger-600 font-medium mb-2">Erro ao carregar orçamentos</p>
            <p className="text-sm text-secondary-600 mb-4 max-w-md mx-auto">{loadError}</p>
            <Button variant="secondary" size="sm" onClick={loadOrcamentos}>
              Tentar novamente
            </Button>
          </div>
        ) : orcamentos.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-secondary-600 font-medium">
              {viewExcluidos
                ? 'Nenhum orçamento excluído'
                : 'Nenhum orçamento cadastrado'}
            </p>
            <p className="text-sm text-secondary-500 mt-1 mb-4">
              {viewExcluidos
                ? 'Orçamentos que forem excluídos aparecerão aqui.'
                : 'Clique em "Novo Orçamento" para criar o primeiro.'}
            </p>
            {!viewExcluidos && (
              <Link to="/orcamentos/novo">
                <Button variant="primary" size="sm">
                  Novo Orçamento
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Tabela - Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-secondary-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-secondary-700">
                      Número
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-secondary-700">
                      Cliente
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-secondary-700">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-secondary-700">
                      Data de Criação
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-secondary-700">
                      Valor Total
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-secondary-700">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orcamentos.map((orcamento) => (
                    <tr
                      key={orcamento.id}
                      className="border-b border-secondary-100 hover:bg-secondary-50 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm font-medium text-secondary-900">
                        {orcamento.numero}
                      </td>
                      <td className="py-3 px-4 text-sm text-secondary-900">
                        {orcamento.cliente_nome ?? '-'}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(orcamento.status)}</td>
                      <td className="py-3 px-4 text-sm text-secondary-600">
                        {formatDate(orcamento.data_criacao)}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-secondary-900 text-right">
                        {formatCurrency(orcamento.valor_total)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleGerarPDF(orcamento)}
                            disabled={downloadingId === orcamento.id}
                            className="p-2 rounded-lg hover:bg-secondary-100 text-secondary-600 transition-colors disabled:opacity-50"
                            title="Baixar PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <Link to={`/orcamentos/${orcamento.id}`}>
                            <button
                              className="p-2 rounded-lg hover:bg-primary-50 text-primary-600 transition-colors"
                              title="Ver detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                          {!viewExcluidos && (
                            <button
                              onClick={() =>
                                setDeleteModal({ isOpen: true, orcamento })
                              }
                              className="p-2 rounded-lg hover:bg-danger-50 text-danger-600 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards - Mobile */}
            <div className="md:hidden space-y-4">
              {orcamentos.map((orcamento) => (
                <Card key={orcamento.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-secondary-900 truncate">
                          {orcamento.numero}
                        </h3>
                        <p className="text-sm text-secondary-600 truncate mt-0.5">
                          {orcamento.cliente_nome ?? '-'}
                        </p>
                      </div>
                      {getStatusBadge(orcamento.status)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-secondary-500">
                        {formatDate(orcamento.data_criacao)}
                      </span>
                      <span className="font-semibold text-primary-600">
                        {formatCurrency(orcamento.valor_total)}
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-secondary-200">
                      <button
                        onClick={() => handleGerarPDF(orcamento)}
                        disabled={downloadingId === orcamento.id}
                        className="p-2 rounded-lg hover:bg-secondary-100 text-secondary-600 transition-colors disabled:opacity-50"
                        title="Baixar PDF"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <Link to={`/orcamentos/${orcamento.id}`}>
                        <button
                          className="p-2 rounded-lg hover:bg-primary-50 text-primary-600 transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </Link>
                      {!viewExcluidos && (
                        <button
                          onClick={() =>
                            setDeleteModal({ isOpen: true, orcamento })
                          }
                          className="p-2 rounded-lg hover:bg-danger-50 text-danger-600 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-secondary-200">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-full sm:w-auto order-2 sm:order-1 px-4 py-2 rounded-lg border border-secondary-300 text-sm font-medium text-secondary-700 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="text-sm text-secondary-600 order-1 sm:order-2">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-full sm:w-auto order-3 px-4 py-2 rounded-lg border border-secondary-300 text-sm font-medium text-secondary-700 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
        onClose={() => setDeleteModal({ isOpen: false, orcamento: null })}
        title="Confirmar Exclusão"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleteModal({ isOpen: false, orcamento: null })}
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
          Tem certeza que deseja marcar o orçamento{' '}
          <strong>{deleteModal.orcamento?.numero}</strong> como excluído?
        </p>
        <p className="text-sm text-secondary-500 mt-2">
          O orçamento será marcado como excluído e deixará de aparecer na listagem principal. Ele poderá ser consultado na aba &quot;Excluídos&quot;.
        </p>
      </Modal>
    </div>
  )
}

export default OrcamentosList

