import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, FileText, Eye, Download } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Loading from '../../components/ui/Loading'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { clienteService } from '../../services/clienteService'
import { orcamentoService } from '../../services/orcamentoService'
import { formatCNPJCPF, formatCEP, formatTelefone, formatDate, formatCurrency, sanitizeFilename } from '../../utils/formatters'
import { useNavigate } from 'react-router-dom'

const statusOrcamentoLabel = {
  rascunho: 'Rascunho',
  enviado: 'Enviado',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
  vencido: 'Vencido',
  cancelado: 'Cancelado',
}

const ClienteDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cliente, setCliente] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [orcamentos, setOrcamentos] = useState([])
  const [orcamentosLoading, setOrcamentosLoading] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)

  useEffect(() => {
    loadCliente()
  }, [id])

  useEffect(() => {
    if (cliente?.id) loadOrcamentos()
  }, [cliente?.id])

  const loadCliente = async () => {
    try {
      setLoading(true)
      const data = await clienteService.get(id)
      setCliente(data)
    } catch (error) {
      console.error('Erro ao carregar cliente:', error)
      navigate('/clientes')
    } finally {
      setLoading(false)
    }
  }

  const loadOrcamentos = async () => {
    if (!cliente?.id) return
    try {
      setOrcamentosLoading(true)
      const data = await orcamentoService.list({
        cliente: cliente.id,
        incluir_excluidos: 'true',
        page_size: 100,
      })
      setOrcamentos(data.results || [])
    } catch (err) {
      console.error('Erro ao carregar orçamentos do cliente:', err)
      setOrcamentos([])
    } finally {
      setOrcamentosLoading(false)
    }
  }

  const handleGerarPDF = async (orcamento) => {
    try {
      setDownloadingId(orcamento.id)
      const blob = await orcamentoService.gerarOrcamento(orcamento.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const nome = sanitizeFilename(orcamento.cliente_nome ?? '')
      a.download = `${orcamento.numero} - ${nome || 'cliente'}.pdf`
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
    try {
      setDeleting(true)
      const response = await clienteService.delete(id)
      // Agora retorna 200 OK com JSON: {"mensagem": "Cliente marcado como inativo com sucesso"}
      if (response?.mensagem) {
        // Cliente foi marcado como inativo com sucesso
        navigate('/clientes')
      }
    } catch (error) {
      alert('Erro ao deletar cliente. Verifique se não há ordens de serviço associadas.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <Loading fullScreen />
  }

  if (!cliente) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/clientes">
            <button className="p-2 rounded-lg hover:bg-secondary-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-secondary-600" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">
              {cliente.razao_social}
            </h1>
            <p className="text-secondary-600 mt-1">Detalhes do cliente</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/clientes/${id}/editar`}>
            <Button variant="secondary" className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Editar
            </Button>
          </Link>
          <Button
            variant="danger"
            onClick={() => setDeleteModal(true)}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Uma linha com os 3 cards para melhor uso do espaço */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="flex flex-col">
          <h2 className="text-base font-semibold text-secondary-900 mb-3">
            Informações Básicas
          </h2>
          <dl className="space-y-2 text-sm flex-1">
            <div className="flex flex-wrap gap-x-2 gap-y-0.5">
              <dt className="text-secondary-500 shrink-0">CNPJ/CPF:</dt>
              <dd className="text-secondary-900">{formatCNPJCPF(cliente.cnpj_cpf)}</dd>
            </div>
            <div className="flex flex-wrap gap-x-2 gap-y-0.5">
              <dt className="text-secondary-500 shrink-0">Tipo:</dt>
              <dd className="text-secondary-900">{cliente.tipo_documento}</dd>
            </div>
            <div className="flex flex-wrap gap-x-2 gap-y-0.5">
              <dt className="text-secondary-500 shrink-0">Razão Social:</dt>
              <dd className="text-secondary-900">{cliente.razao_social}</dd>
            </div>
            {cliente.nome_fantasia && (
              <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                <dt className="text-secondary-500 shrink-0">Nome Fantasia:</dt>
                <dd className="text-secondary-900">{cliente.nome_fantasia}</dd>
              </div>
            )}
            {cliente.telefone && (
              <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                <dt className="text-secondary-500 shrink-0">Telefone:</dt>
                <dd className="text-secondary-900">{formatTelefone(cliente.telefone)}</dd>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-1">
              <dt className="text-secondary-500 shrink-0">Status:</dt>
              <dd>
                <Badge variant={cliente.ativo ? 'success' : 'danger'}>
                  {cliente.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="flex flex-col">
          <h2 className="text-base font-semibold text-secondary-900 mb-3">
            Endereço
          </h2>
          <dl className="space-y-2 text-sm flex-1">
            {cliente.endereco ? (
              <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                <dt className="text-secondary-500 shrink-0">Endereço:</dt>
                <dd className="text-secondary-900">{cliente.endereco}</dd>
              </div>
            ) : (
              <p className="text-secondary-400 italic">Não informado</p>
            )}
            {cliente.cep && (
              <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                <dt className="text-secondary-500 shrink-0">CEP:</dt>
                <dd className="text-secondary-900">{formatCEP(cliente.cep)}</dd>
              </div>
            )}
            {(cliente.cidade || cliente.estado) && (
              <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                <dt className="text-secondary-500 shrink-0">Cidade/UF:</dt>
                <dd className="text-secondary-900">
                  {[cliente.cidade, cliente.estado].filter(Boolean).join(' / ')}
                </dd>
              </div>
            )}
          </dl>
        </Card>

        <Card className="flex flex-col">
          <h2 className="text-base font-semibold text-secondary-900 mb-3">
            Informações do Sistema
          </h2>
          <dl className="space-y-2 text-sm flex-1">
            <div className="flex flex-wrap gap-x-2 gap-y-0.5">
              <dt className="text-secondary-500 shrink-0">Cadastro:</dt>
              <dd className="text-secondary-900">{formatDate(cliente.data_cadastro)}</dd>
            </div>
            {cliente.usuario_cadastro_nome && (
              <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                <dt className="text-secondary-500 shrink-0">Por:</dt>
                <dd className="text-secondary-900">{cliente.usuario_cadastro_nome}</dd>
              </div>
            )}
            {cliente.data_ultima_alteracao && (
              <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                <dt className="text-secondary-500 shrink-0">Alterado em:</dt>
                <dd className="text-secondary-900">{formatDate(cliente.data_ultima_alteracao)}</dd>
              </div>
            )}
          </dl>
        </Card>
      </div>

      {/* Orçamentos deste cliente */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <h2 className="text-base font-semibold text-secondary-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" />
            Orçamentos deste cliente
          </h2>
          <Link to={`/orcamentos/novo?cliente=${cliente.id}`} className="w-full sm:w-auto">
            <Button variant="primary" size="sm" className="w-full sm:w-auto flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" />
              Novo orçamento
            </Button>
          </Link>
        </div>
        {orcamentosLoading ? (
          <div className="py-8 flex justify-center">
            <Loading />
          </div>
        ) : orcamentos.length === 0 ? (
          <p className="text-secondary-500 text-sm py-4">
            Nenhum orçamento encontrado para este cliente.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b border-secondary-200">
                  <th className="text-left py-3 px-2 font-medium text-secondary-700">Número</th>
                  <th className="text-left py-3 px-2 font-medium text-secondary-700">Data</th>
                  <th className="text-left py-3 px-2 font-medium text-secondary-700">Status</th>
                  <th className="text-right py-3 px-2 font-medium text-secondary-700">Valor total</th>
                  <th className="text-right py-3 px-2 font-medium text-secondary-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {orcamentos.map((orc) => (
                  <tr key={orc.id} className="border-b border-secondary-100 hover:bg-secondary-50/50">
                    <td className="py-3 px-2 font-medium text-secondary-900">{orc.numero}</td>
                    <td className="py-3 px-2 text-secondary-600">{formatDate(orc.data_criacao)}</td>
                    <td className="py-3 px-2">
                      <Badge variant={orc.status === 'aprovado' ? 'success' : orc.status === 'rejeitado' || orc.status === 'cancelado' ? 'danger' : orc.status === 'vencido' ? 'warning' : 'secondary'}>
                        {statusOrcamentoLabel[orc.status] || orc.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-right text-secondary-900">{formatCurrency(orc.valor_total)}</td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/orcamentos/${orc.id}`}>
                          <button
                            type="button"
                            className="p-2 rounded-lg hover:bg-secondary-100 text-secondary-600 hover:text-primary-600 transition-colors"
                            title="Ver orçamento"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleGerarPDF(orc)}
                          disabled={downloadingId === orc.id}
                          className="p-2 rounded-lg hover:bg-secondary-100 text-secondary-600 hover:text-primary-600 transition-colors disabled:opacity-50"
                          title="Baixar PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Confirmar Exclusão"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleteModal(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={deleting}>
              Excluir
            </Button>
          </>
        }
      >
        <p className="text-secondary-700">
          Tem certeza que deseja marcar o cliente{' '}
          <strong>{cliente.razao_social}</strong> como inativo?
        </p>
        <p className="text-sm text-secondary-500 mt-2">
          O cliente será marcado como inativo e não aparecerá mais na listagem padrão.
        </p>
      </Modal>
    </div>
  )
}

export default ClienteDetail

