import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Download, Edit } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Loading from '../../components/ui/Loading'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { orcamentoService } from '../../services/orcamentoService'
import { statusOrcamentoService } from '../../services/statusOrcamentoService'
import { localEstoqueService } from '../../services/localEstoqueService'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  sanitizeFilename,
} from '../../utils/formatters'
import { usePermissoesModulos } from '../../hooks/usePermissoesModulos'
import {
  orcamentoStatusBadgeVariant,
  orcamentoStatusLabel,
} from '../../utils/orcamentoStatus'

const OrcamentoDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const perm = usePermissoesModulos()
  const [orcamento, setOrcamento] = useState(null)
  const [loading, setLoading] = useState(true)
  const [itemModal, setItemModal] = useState(false)
  const [statusModal, setStatusModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [itemForm, setItemForm] = useState({
    tipo: 'servico',
    descricao: '',
    quantidade: '',
    valor_unitario: '',
  })
  const [statusChoices, setStatusChoices] = useState([])
  const [locaisEstoque, setLocaisEstoque] = useState([])
  const [statusModalPhase, setStatusModalPhase] = useState('list')
  const [pendingStatusId, setPendingStatusId] = useState(null)
  const [localEstoqueEscolhido, setLocalEstoqueEscolhido] = useState('')

  useEffect(() => {
    loadOrcamento()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const list = await statusOrcamentoService.listAllOrdered({ ativo: true })
        if (!cancelled) setStatusChoices(list)
      } catch (e) {
        console.error(e)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await localEstoqueService.list()
        const rows = data.results || data || []
        if (!cancelled) setLocaisEstoque(Array.isArray(rows) ? rows : [])
      } catch {
        if (!cancelled) setLocaisEstoque([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const loadOrcamento = async () => {
    try {
      setLoading(true)
      const data = await orcamentoService.get(id)
      setOrcamento(data)
    } catch (error) {
      console.error('Erro ao carregar orçamento:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      await orcamentoService.adicionarItem(id, {
        tipo: itemForm.tipo,
        descricao: itemForm.descricao,
        quantidade: parseInt(itemForm.quantidade),
        valor_unitario: parseFloat(itemForm.valor_unitario),
      })
      setItemModal(false)
      setItemForm({ tipo: 'servico', descricao: '', quantidade: '', valor_unitario: '' })
      loadOrcamento()
    } catch (error) {
      alert('Erro ao adicionar item. Verifique os dados.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateStatus = async (status, localEstoqueId = null) => {
    setSaving(true)
    try {
      await orcamentoService.atualizarStatus(id, status, localEstoqueId)
      setStatusModal(false)
      setStatusModalPhase('list')
      setPendingStatusId(null)
      loadOrcamento()
    } catch (error) {
      const msg =
        error.response?.data?.erro ||
        error.response?.data?.local_estoque?.[0] ||
        (typeof error.response?.data === 'object' && error.response?.data?.detail
          ? String(error.response.data.detail)
          : null) ||
        'Erro ao atualizar status.'
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setSaving(false)
    }
  }

  const handleClickStatusOpcao = (st) => {
    if (st.movimenta_estoque_saida && locaisEstoque.length > 1) {
      setPendingStatusId(st.id)
      const padrao = locaisEstoque.find((l) => l.padrao)
      setLocalEstoqueEscolhido(String(padrao?.id ?? locaisEstoque[0]?.id ?? ''))
      setStatusModalPhase('local')
      return
    }
    handleUpdateStatus(st.id, null)
  }

  const confirmarStatusComLocal = () => {
    const lid = parseInt(localEstoqueEscolhido, 10)
    if (!pendingStatusId || Number.isNaN(lid)) return
    handleUpdateStatus(pendingStatusId, lid)
  }

  const handleGerarOrcamento = async () => {
    try {
      setDownloadingPdf(true)
      const blob = await orcamentoService.gerarOrcamento(id)
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
      alert('Erro ao gerar PDF. Tente novamente.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const getStatusBadge = (orc) => (
    <Badge variant={orcamentoStatusBadgeVariant(orc.status)}>
      {orcamentoStatusLabel(orc.status, orc.status_nome)}
    </Badge>
  )

  if (loading) {
    return <Loading fullScreen />
  }

  if (!orcamento) {
    return null
  }

  return (
    <div className="space-y-6">
      {orcamento.ativo === false && (
        <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg text-warning-800 text-sm">
          Este orçamento está marcado como excluído. Ele não aparece na listagem principal e pode ser visualizado na aba &quot;Excluídos&quot;.
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/orcamentos">
            <button className="p-2 rounded-lg hover:bg-secondary-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-secondary-600" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">
              {orcamento.numero}
            </h1>
            <p className="text-secondary-600 mt-1">Detalhes do orçamento</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {orcamento.ativo !== false && perm.orcamentos_pode_cadastrar && (
            <Button
              type="button"
              variant="secondary"
              className="flex items-center gap-2"
              onClick={() => navigate(`/orcamentos/${id}/editar`)}
            >
              <Edit className="w-4 h-4" />
              Editar
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={handleGerarOrcamento}
            disabled={downloadingPdf}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {downloadingPdf ? 'Gerando…' : 'Gerar PDF'}
          </Button>
          {perm.orcamentos_pode_cadastrar && (
            <Button
              variant="primary"
              onClick={() => {
                setStatusModalPhase('list')
                setPendingStatusId(null)
                setStatusModal(true)
              }}
              className="flex items-center gap-2"
            >
              Alterar Status
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">
              Informações do Orçamento
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-secondary-500">
                  Status
                </dt>
                <dd className="mt-1">{getStatusBadge(orcamento)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-secondary-500">
                  Cliente
                </dt>
                <dd className="mt-1 text-sm text-secondary-900">
                  {orcamento.cliente_nome ?? '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-secondary-500">
                  Descrição
                </dt>
                <dd className="mt-1 text-sm text-secondary-900">
                  {orcamento.descricao ?? '-'}
                </dd>
              </div>
              {orcamento.observacoes && (
                <div>
                  <dt className="text-sm font-medium text-secondary-500">
                    Observações
                  </dt>
                  <dd className="mt-1 text-sm text-secondary-900">
                    {orcamento.observacoes}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">
              Histórico de status
            </h2>
            {!orcamento.historico_status ||
            orcamento.historico_status.length === 0 ? (
              <p className="text-sm text-secondary-500">
                Nenhum registro de alteração de status.
              </p>
            ) : (
              <ul className="space-y-4 border-l-2 border-secondary-200 pl-4 ml-1.5">
                {orcamento.historico_status.map((row) => (
                  <li key={row.id} className="relative">
                    <span
                      className="absolute -left-[calc(0.5rem+5px)] top-1.5 w-2.5 h-2.5 rounded-full bg-primary-500 ring-4 ring-white"
                      aria-hidden
                    />
                    <p className="text-xs text-secondary-500">
                      {formatDateTime(row.data_registro)}
                    </p>
                    <p className="text-sm text-secondary-900 mt-1">
                      <span className="font-medium">
                        {row.usuario_nome ?? '—'}
                      </span>
                      {row.status_anterior_nome == null ? (
                        <>
                          {' '}
                          criou o orçamento com status «{row.status_novo_nome}»
                          <span className="text-secondary-500">
                            {' '}
                            ({row.origem_label})
                          </span>
                        </>
                      ) : (
                        <>
                          {' '}
                          alterou de «{row.status_anterior_nome}» para «
                          {row.status_novo_nome}»
                          <span className="text-secondary-500">
                            {' '}
                            ({row.origem_label})
                          </span>
                        </>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-secondary-900">
                Itens do Orçamento
              </h2>
              {perm.orcamentos_pode_cadastrar && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setItemModal(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Item
                </Button>
              )}
            </div>

            {orcamento.itens && orcamento.itens.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-secondary-200">
                      {orcamento.itens.some((item) => item.tipo) && (
                        <th className="text-left py-3 px-4 text-sm font-semibold text-secondary-700">
                          Tipo
                        </th>
                      )}
                      <th className="text-left py-3 px-4 text-sm font-semibold text-secondary-700">
                        Descrição
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-secondary-700">
                        Quantidade
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-secondary-700">
                        Valor Unitário
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-secondary-700">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orcamento.itens.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-secondary-100"
                      >
                        {orcamento.itens.some((i) => i.tipo) && (
                          <td className="py-3 px-4">
                            {item.tipo ? (
                              <Badge variant={item.tipo === 'servico' ? 'primary' : 'secondary'}>
                                {item.tipo === 'servico' ? 'Serviço' : 'Peça'}
                              </Badge>
                            ) : (
                              <span className="text-sm text-secondary-500">-</span>
                            )}
                          </td>
                        )}
                        <td className="py-3 px-4 text-sm text-secondary-900">
                          {item.descricao}
                        </td>
                        <td className="py-3 px-4 text-sm text-secondary-600 text-right">
                          {item.quantidade}
                        </td>
                        <td className="py-3 px-4 text-sm text-secondary-600 text-right">
                          {formatCurrency(item.valor_unitario)}
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-secondary-900 text-right">
                          {formatCurrency(item.valor_total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-secondary-500 text-center py-8">
                Nenhum item adicionado
              </p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">
              Resumo
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-secondary-500">
                  Data de Criação
                </dt>
                <dd className="mt-1 text-sm text-secondary-900">
                  {formatDate(orcamento.data_criacao)}
                </dd>
              </div>
              {orcamento.usuario_criacao_nome && (
                <div>
                  <dt className="text-sm font-medium text-secondary-500">
                    Criado por
                  </dt>
                  <dd className="mt-1 text-sm text-secondary-900">
                    {orcamento.usuario_criacao_nome}
                  </dd>
                </div>
              )}
              {orcamento.data_ultima_alteracao && (
                <div>
                  <dt className="text-sm font-medium text-secondary-500">
                    Última alteração
                  </dt>
                  <dd className="mt-1 text-sm text-secondary-900">
                    {formatDate(orcamento.data_ultima_alteracao)}
                  </dd>
                </div>
              )}
              {orcamento.usuario_ultima_alteracao_nome && (
                <div>
                  <dt className="text-sm font-medium text-secondary-500">
                    Alterado por
                  </dt>
                  <dd className="mt-1 text-sm text-secondary-900">
                    {orcamento.usuario_ultima_alteracao_nome}
                  </dd>
                </div>
              )}
              {orcamento.data_validade && (
                <div>
                  <dt className="text-sm font-medium text-secondary-500">
                    Data de Validade
                  </dt>
                  <dd className="mt-1 text-sm text-secondary-900">
                    {formatDate(orcamento.data_validade)}
                  </dd>
                </div>
              )}
              {orcamento.condicoes_pagamento && (
                <div>
                  <dt className="text-sm font-medium text-secondary-500">
                    Condições de Pagamento
                  </dt>
                  <dd className="mt-1 text-sm text-secondary-900">
                    {orcamento.condicoes_pagamento}
                  </dd>
                </div>
              )}
              {orcamento.prazo_entrega && (
                <div>
                  <dt className="text-sm font-medium text-secondary-500">
                    Prazo de Entrega
                  </dt>
                  <dd className="mt-1 text-sm text-secondary-900">
                    {orcamento.prazo_entrega}
                  </dd>
                </div>
              )}
              <div className="pt-4 space-y-2 border-t border-secondary-200">
                {orcamento.subtotal != null && (
                  <div className="flex justify-between text-sm">
                    <dt className="text-secondary-500">Subtotal</dt>
                    <dd className="text-secondary-900">{formatCurrency(orcamento.subtotal)}</dd>
                  </div>
                )}
                {parseFloat(orcamento.valor_desconto_calculado || 0) > 0 && (
                  <div className="flex justify-between text-sm text-success-600">
                    <dt>Desconto</dt>
                    <dd>- {formatCurrency(orcamento.valor_desconto_calculado)}</dd>
                  </div>
                )}
                {parseFloat(orcamento.valor_acrescimo_calculado || 0) > 0 && (
                  <div className="flex justify-between text-sm text-secondary-600">
                    <dt>Acréscimo</dt>
                    <dd>+ {formatCurrency(orcamento.valor_acrescimo_calculado)}</dd>
                  </div>
                )}
                <div className="flex justify-between pt-2">
                  <dt className="text-sm font-medium text-secondary-500">Valor Total</dt>
                  <dd className="text-2xl font-bold text-primary-600">
                    {formatCurrency(orcamento.valor_total)}
                  </dd>
                </div>
              </div>
            </dl>
          </Card>
        </div>
      </div>

      {/* Add Item Modal */}
      <Modal
        isOpen={itemModal}
        onClose={() => setItemModal(false)}
        title="Adicionar Item"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setItemModal(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleAddItem}
              isLoading={saving}
            >
              Adicionar
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddItem} className="space-y-4">
          <Select
            label="Tipo"
            value={itemForm.tipo}
            onChange={(e) =>
              setItemForm({ ...itemForm, tipo: e.target.value })
            }
            options={[
              { value: 'servico', label: 'Serviço' },
              { value: 'peca', label: 'Peça' },
            ]}
            required
          />
          <Input
            label="Descrição"
            type="text"
            value={itemForm.descricao}
            onChange={(e) =>
              setItemForm({ ...itemForm, descricao: e.target.value })
            }
            required
          />
          <Input
            label="Quantidade"
            type="number"
            value={itemForm.quantidade}
            onChange={(e) =>
              setItemForm({ ...itemForm, quantidade: e.target.value })
            }
            required
            min="1"
          />
          <Input
            label="Valor Unitário"
            type="number"
            step="0.01"
            value={itemForm.valor_unitario}
            onChange={(e) =>
              setItemForm({ ...itemForm, valor_unitario: e.target.value })
            }
            required
            min="0"
          />
        </form>
      </Modal>

      {/* Status Modal */}
      <Modal
        isOpen={statusModal}
        onClose={() => {
          setStatusModal(false)
          setStatusModalPhase('list')
          setPendingStatusId(null)
        }}
        title={
          statusModalPhase === 'local'
            ? 'Local de estoque para a saída'
            : 'Alterar Status'
        }
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                if (statusModalPhase === 'local') {
                  setStatusModalPhase('list')
                  setPendingStatusId(null)
                } else {
                  setStatusModal(false)
                }
              }}
              disabled={saving}
            >
              {statusModalPhase === 'local' ? 'Voltar' : 'Cancelar'}
            </Button>
            {statusModalPhase === 'local' ? (
              <Button
                variant="primary"
                onClick={confirmarStatusComLocal}
                disabled={saving || !localEstoqueEscolhido}
              >
                Confirmar
              </Button>
            ) : null}
          </>
        }
      >
        {statusModalPhase === 'local' ? (
          <div className="space-y-3">
            <p className="text-sm text-secondary-600">
              Este status movimenta estoque. Escolha o depósito de onde sairá o material.
            </p>
            <select
              className="input-base w-full"
              value={localEstoqueEscolhido}
              onChange={(e) => setLocalEstoqueEscolhido(e.target.value)}
            >
              {locaisEstoque.map((loc) => (
                <option key={loc.id} value={String(loc.id)}>
                  {loc.nome}
                  {loc.padrao ? ' (padrão)' : ''}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-2">
            {(statusChoices.length
              ? statusChoices
              : orcamento.status != null
                ? [
                    {
                      id: orcamento.status,
                      nome: orcamento.status_nome || 'Status',
                    },
                  ]
                : []
            ).map((st) => (
              <Button
                key={st.id}
                variant={orcamento.status === st.id ? 'primary' : 'secondary'}
                fullWidth
                onClick={() => handleClickStatusOpcao(st)}
                disabled={saving || orcamento.status === st.id}
              >
                {st.nome}
              </Button>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default OrcamentoDetail

