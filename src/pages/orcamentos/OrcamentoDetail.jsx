import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Download, Edit } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Loading from '../../components/ui/Loading'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { orcamentoService } from '../../services/orcamentoService'
import { formatCurrency, formatDate, sanitizeFilename } from '../../utils/formatters'

const OrcamentoDetail = () => {
  const { id } = useParams()
  const [orcamento, setOrcamento] = useState(null)
  const [loading, setLoading] = useState(true)
  const [itemModal, setItemModal] = useState(false)
  const [statusModal, setStatusModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [itemForm, setItemForm] = useState({
    tipo: 'servico',
    descricao: '',
    quantidade: '',
    valor_unitario: '',
  })

  useEffect(() => {
    loadOrcamento()
  }, [id])

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

  const handleUpdateStatus = async (status) => {
    setSaving(true)
    try {
      await orcamentoService.atualizarStatus(id, status)
      setStatusModal(false)
      loadOrcamento()
    } catch (error) {
      alert('Erro ao atualizar status.')
    } finally {
      setSaving(false)
    }
  }

  const handleGerarOrcamento = async () => {
    try {
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
      alert('Erro ao gerar orçamento.')
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
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleGerarOrcamento}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Gerar PDF
          </Button>
          <Button
            variant="primary"
            onClick={() => setStatusModal(true)}
            className="flex items-center gap-2"
          >
            Alterar Status
          </Button>
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
                <dd className="mt-1">{getStatusBadge(orcamento.status)}</dd>
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-secondary-900">
                Itens do Orçamento
              </h2>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setItemModal(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Adicionar Item
              </Button>
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
        onClose={() => setStatusModal(false)}
        title="Alterar Status"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setStatusModal(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          {['rascunho', 'enviado', 'aprovado', 'rejeitado', 'vencido', 'cancelado'].map((status) => (
            <Button
              key={status}
              variant={orcamento.status === status ? 'primary' : 'secondary'}
              fullWidth
              onClick={() => handleUpdateStatus(status)}
              disabled={saving || orcamento.status === status}
            >
              {status === 'rascunho' && 'Rascunho'}
              {status === 'enviado' && 'Enviado'}
              {status === 'aprovado' && 'Aprovado'}
              {status === 'rejeitado' && 'Rejeitado'}
              {status === 'vencido' && 'Vencido'}
              {status === 'cancelado' && 'Cancelado'}
            </Button>
          ))}
        </div>
      </Modal>
    </div>
  )
}

export default OrcamentoDetail

