import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  Eye,
  Download,
  BarChart3,
  Building2,
  Layers,
  Search,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Loading from '../../components/ui/Loading'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { clienteService } from '../../services/clienteService'
import { orcamentoService } from '../../services/orcamentoService'
import { formatCNPJCPF, formatCEP, formatTelefone, formatDate, formatCurrency, sanitizeFilename } from '../../utils/formatters'
import { useNavigate } from 'react-router-dom'
import { usePermissoesModulos } from '../../hooks/usePermissoesModulos'
import { API_PAGE_SIZE } from '../../config/api'
import {
  orcamentoStatusBadgeVariant,
  orcamentoStatusLabel,
} from '../../utils/orcamentoStatus'

const ClienteDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const perm = usePermissoesModulos()
  const [cliente, setCliente] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [orcamentos, setOrcamentos] = useState([])
  const [orcamentosLoading, setOrcamentosLoading] = useState(false)
  const [orcamentosBuscaInput, setOrcamentosBuscaInput] = useState('')
  const [orcamentosBusca, setOrcamentosBusca] = useState('')
  const [orcamentosPage, setOrcamentosPage] = useState(1)
  const [orcamentosTotalCount, setOrcamentosTotalCount] = useState(0)
  const [orcamentosTotalPages, setOrcamentosTotalPages] = useState(1)
  const [downloadingId, setDownloadingId] = useState(null)
  const [resumoOrcamentos, setResumoOrcamentos] = useState(null)
  const [resumoLoading, setResumoLoading] = useState(false)
  const [resumoError, setResumoError] = useState(null)

  useEffect(() => {
    loadCliente()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    setOrcamentosBuscaInput('')
    setOrcamentosBusca('')
    setOrcamentosPage(1)
  }, [id])

  useEffect(() => {
    const t = setTimeout(() => setOrcamentosBusca(orcamentosBuscaInput.trim()), 350)
    return () => clearTimeout(t)
  }, [orcamentosBuscaInput])

  useEffect(() => {
    setOrcamentosPage(1)
  }, [cliente?.id, orcamentosBusca])

  useEffect(() => {
    if (cliente?.id && String(cliente.id) === String(id)) loadOrcamentos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente?.id, id, orcamentosPage, orcamentosBusca])

  useEffect(() => {
    if (!cliente?.id || !perm.orcamentos_pode_visualizar) {
      setResumoOrcamentos(null)
      setResumoError(null)
      setResumoLoading(false)
      return
    }
    let cancelled = false
    const load = async () => {
      try {
        setResumoLoading(true)
        setResumoError(null)
        const data = await clienteService.resumoOrcamentos(cliente.id)
        if (!cancelled) setResumoOrcamentos(data)
      } catch (err) {
        if (!cancelled) {
          const status = err.response?.status
          setResumoOrcamentos(null)
          setResumoError(
            status === 403
              ? 'Sem permissão para ver o resumo de orçamentos.'
              : 'Não foi possível carregar o resumo de orçamentos.'
          )
        }
      } finally {
        if (!cancelled) setResumoLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [cliente?.id, perm.orcamentos_pode_visualizar])

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
    if (!cliente?.id || String(cliente.id) !== String(id)) return
    try {
      setOrcamentosLoading(true)
      const params = {
        cliente: cliente.id,
        todas_empresas: 'true',
        incluir_excluidos: 'true',
        page: orcamentosPage,
        page_size: API_PAGE_SIZE,
      }
      if (orcamentosBusca) {
        params.search = orcamentosBusca
      }
      const data = await orcamentoService.list(params)
      const count = data.count ?? 0
      setOrcamentos(data.results || [])
      setOrcamentosTotalCount(count)
      setOrcamentosTotalPages(count > 0 ? Math.ceil(count / API_PAGE_SIZE) : 1)
    } catch (err) {
      console.error('Erro ao carregar orçamentos do cliente:', err)
      setOrcamentos([])
      setOrcamentosTotalCount(0)
      setOrcamentosTotalPages(1)
    } finally {
      setOrcamentosLoading(false)
    }
  }

  const orcamentosRangeStart =
    orcamentosTotalCount === 0 ? 0 : (orcamentosPage - 1) * API_PAGE_SIZE + 1
  const orcamentosRangeEnd = Math.min(orcamentosPage * API_PAGE_SIZE, orcamentosTotalCount)

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
        {perm.clientes_pode_cadastrar && (
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
        )}
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
            {cliente.inscricao_estadual && (
              <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                <dt className="text-secondary-500 shrink-0">Inscrição estadual:</dt>
                <dd className="text-secondary-900">{cliente.inscricao_estadual}</dd>
              </div>
            )}
            {cliente.email && (
              <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                <dt className="text-secondary-500 shrink-0">E-mail:</dt>
                <dd className="text-secondary-900 break-all">
                  <a
                    href={`mailto:${cliente.email}`}
                    className="text-primary-600 hover:underline"
                  >
                    {cliente.email}
                  </a>
                </dd>
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
            {cliente.usuario_ultima_alteracao_nome && (
              <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                <dt className="text-secondary-500 shrink-0">Última alteração por:</dt>
                <dd className="text-secondary-900">{cliente.usuario_ultima_alteracao_nome}</dd>
              </div>
            )}
          </dl>
        </Card>
      </div>

      {perm.orcamentos_pode_visualizar && (
        <Card>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-secondary-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              Resumo de orçamentos
            </h2>
            <p className="text-xs text-secondary-500 mt-1">
              Todos os orçamentos deste cliente, em todas as empresas (ativos e excluídos da lista).
            </p>
          </div>
          {resumoLoading ? (
            <div className="py-8 flex justify-center">
              <Loading />
            </div>
          ) : resumoError ? (
            <p className="text-sm text-secondary-500 py-2">{resumoError}</p>
          ) : resumoOrcamentos ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border border-secondary-100 bg-secondary-50/60 px-4 py-3">
                  <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                    Total
                  </p>
                  <p className="text-lg font-semibold text-secondary-900 mt-1">
                    {resumoOrcamentos.total_quantidade ?? 0}{' '}
                    <span className="text-sm font-normal text-secondary-600">
                      {resumoOrcamentos.total_quantidade === 1 ? 'orçamento' : 'orçamentos'}
                    </span>
                  </p>
                  <p className="text-sm text-primary-700 font-medium mt-0.5">
                    {formatCurrency(resumoOrcamentos.valor_total_geral)}
                  </p>
                </div>
                <div className="rounded-lg border border-secondary-100 bg-secondary-50/60 px-4 py-3">
                  <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                    Ativos na lista
                  </p>
                  <p className="text-lg font-semibold text-secondary-900 mt-1">
                    {resumoOrcamentos.ativos?.quantidade ?? 0}
                  </p>
                  <p className="text-sm text-secondary-700 mt-0.5">
                    {formatCurrency(resumoOrcamentos.ativos?.valor_total)}
                  </p>
                </div>
                <div className="rounded-lg border border-secondary-100 bg-secondary-50/60 px-4 py-3">
                  <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide">
                    Excluídos da lista
                  </p>
                  <p className="text-lg font-semibold text-secondary-900 mt-1">
                    {resumoOrcamentos.excluidos?.quantidade ?? 0}
                  </p>
                  <p className="text-sm text-secondary-700 mt-0.5">
                    {formatCurrency(resumoOrcamentos.excluidos?.valor_total)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-secondary-800 flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-secondary-500" />
                    Por empresa
                  </h3>
                  {(resumoOrcamentos.por_empresa || []).length === 0 ? (
                    <p className="text-sm text-secondary-500">Nenhum orçamento por empresa.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-secondary-100">
                      <table className="w-full min-w-[280px] text-sm">
                        <thead>
                          <tr className="bg-secondary-50/80 border-b border-secondary-100">
                            <th className="text-left py-2 px-3 font-medium text-secondary-700">
                              Empresa
                            </th>
                            <th className="text-right py-2 px-3 font-medium text-secondary-700">
                              Qtd.
                            </th>
                            <th className="text-right py-2 px-3 font-medium text-secondary-700">
                              Valor total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {resumoOrcamentos.por_empresa.map((row) => (
                            <tr
                              key={row.empresa_id ?? row.empresa_nome}
                              className="border-b border-secondary-50 last:border-0"
                            >
                              <td className="py-2 px-3 text-secondary-900">{row.empresa_nome}</td>
                              <td className="py-2 px-3 text-right text-secondary-700">
                                {row.quantidade}
                              </td>
                              <td className="py-2 px-3 text-right font-medium text-secondary-900">
                                {formatCurrency(row.valor_total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-secondary-800 flex items-center gap-2 mb-2">
                    <Layers className="w-4 h-4 text-secondary-500" />
                    Por status
                  </h3>
                  {(resumoOrcamentos.por_status || []).length === 0 ? (
                    <p className="text-sm text-secondary-500">Nenhum orçamento por status.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-secondary-100">
                      <table className="w-full min-w-[280px] text-sm">
                        <thead>
                          <tr className="bg-secondary-50/80 border-b border-secondary-100">
                            <th className="text-left py-2 px-3 font-medium text-secondary-700">
                              Status
                            </th>
                            <th className="text-right py-2 px-3 font-medium text-secondary-700">
                              Qtd.
                            </th>
                            <th className="text-right py-2 px-3 font-medium text-secondary-700">
                              Valor total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {resumoOrcamentos.por_status.map((row) => (
                            <tr
                              key={row.status}
                              className="border-b border-secondary-50 last:border-0"
                            >
                              <td className="py-2 px-3">
                                <Badge variant={orcamentoStatusBadgeVariant(row.status)}>
                                  {row.status_label || orcamentoStatusLabel(row.status, null)}
                                </Badge>
                              </td>
                              <td className="py-2 px-3 text-right text-secondary-700">
                                {row.quantidade}
                              </td>
                              <td className="py-2 px-3 text-right font-medium text-secondary-900">
                                {formatCurrency(row.valor_total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </Card>
      )}

      {/* Orçamentos deste cliente */}
      <Card>
        <div className="mb-3 space-y-3">
          <div>
            <h2 className="text-base font-semibold text-secondary-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              Orçamentos deste cliente
            </h2>
            <p className="text-xs text-secondary-500 mt-1">
              Inclui orçamentos de todas as empresas (coluna Empresa).
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div className="relative flex-1 min-w-0 w-full sm:max-w-md">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none z-10"
                aria-hidden
              />
              <Input
                id="cliente-detalhe-orcamentos-busca"
                type="search"
                label=""
                value={orcamentosBuscaInput}
                onChange={(e) => setOrcamentosBuscaInput(e.target.value)}
                placeholder="Nº, empresa, status, descrição…"
                className="pl-9 h-10 min-h-[2.5rem] w-full"
                autoComplete="off"
                aria-label="Buscar orçamentos deste cliente"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0 w-full sm:w-auto sm:justify-end">
              {!orcamentosLoading && orcamentosTotalCount > 0 && (
                <p className="text-sm text-secondary-500 text-center sm:text-right whitespace-nowrap">
                  {orcamentosTotalCount}{' '}
                  {orcamentosTotalCount === 1 ? 'orçamento' : 'orçamentos'}
                </p>
              )}
              {perm.orcamentos_pode_cadastrar && (
                <Link
                  to={`/orcamentos/novo?cliente=${cliente.id}`}
                  className="w-full sm:w-auto"
                >
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full sm:w-auto flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Novo orçamento
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
        {orcamentosLoading ? (
          <div className="py-8 flex justify-center">
            <Loading />
          </div>
        ) : orcamentosTotalCount === 0 ? (
          <div className="py-4 space-y-1">
            <p className="text-secondary-600 text-sm font-medium">
              {orcamentosBusca
                ? 'Nenhum orçamento corresponde à busca.'
                : 'Nenhum orçamento encontrado para este cliente.'}
            </p>
            {orcamentosBusca ? (
              <p className="text-secondary-500 text-xs">
                Tente outro termo ou limpe o campo de busca.
              </p>
            ) : null}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto -mx-2">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-secondary-200">
                    <th className="text-left py-3 px-2 font-medium text-secondary-700">Número</th>
                    <th className="text-left py-3 px-2 font-medium text-secondary-700">Empresa</th>
                    <th className="text-left py-3 px-2 font-medium text-secondary-700">Data</th>
                    <th className="text-left py-3 px-2 font-medium text-secondary-700">Status</th>
                    <th className="text-right py-3 px-2 font-medium text-secondary-700">Valor total</th>
                    <th className="text-right py-3 px-2 font-medium text-secondary-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {orcamentos.map((orc) => (
                    <tr
                      key={orc.id}
                      onClick={() => navigate(`/orcamentos/${orc.id}`)}
                      className="border-b border-secondary-100 hover:bg-secondary-50/50 cursor-pointer"
                    >
                      <td className="py-3 px-2 font-medium text-secondary-900">{orc.numero}</td>
                      <td
                        className="py-3 px-2 text-secondary-800 max-w-[160px] truncate"
                        title={
                          orc.empresa_razao_social?.trim()
                            ? orc.empresa_razao_social
                            : (orc.empresa_nome ?? '')
                        }
                      >
                        {orc.empresa_nome ?? '—'}
                      </td>
                      <td className="py-3 px-2 text-secondary-600">{formatDate(orc.data_criacao)}</td>
                      <td className="py-3 px-2">
                        <Badge variant={orcamentoStatusBadgeVariant(orc.status)}>
                          {orcamentoStatusLabel(orc.status, orc.status_nome)}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-right text-secondary-900">{formatCurrency(orc.valor_total)}</td>
                      <td
                        className="py-3 px-2 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
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
            {orcamentosTotalCount > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-4 border-t border-secondary-200">
                <button
                  type="button"
                  onClick={() => setOrcamentosPage((p) => Math.max(1, p - 1))}
                  disabled={orcamentosPage <= 1}
                  className="w-full sm:w-auto order-2 sm:order-1 px-4 py-2 rounded-lg border border-secondary-300 text-sm font-medium text-secondary-700 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <div className="text-sm text-secondary-600 text-center order-1 sm:order-2 sm:flex-1 sm:min-w-0">
                  <span className="font-medium text-secondary-800">
                    Página {orcamentosPage} de {Math.max(orcamentosTotalPages, 1)}
                  </span>
                  <span className="block sm:inline sm:ml-2 text-secondary-500">
                    {orcamentosRangeStart}–{orcamentosRangeEnd} de {orcamentosTotalCount}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setOrcamentosPage((p) => Math.min(orcamentosTotalPages, p + 1))
                  }
                  disabled={orcamentosPage >= orcamentosTotalPages}
                  className="w-full sm:w-auto order-3 px-4 py-2 rounded-lg border border-secondary-300 text-sm font-medium text-secondary-700 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
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

