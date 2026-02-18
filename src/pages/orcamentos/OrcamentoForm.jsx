import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Loading from '../../components/ui/Loading'
import Badge from '../../components/ui/Badge'
import { orcamentoService } from '../../services/orcamentoService'
import { clienteService } from '../../services/clienteService'
import { formatCurrency } from '../../utils/formatters'
import { Link } from 'react-router-dom'

const OrcamentoForm = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [clientes, setClientes] = useState([])
  const [formData, setFormData] = useState({
    cliente: '',
    descricao: '',
    status: 'rascunho',
    data_validade: '',
    ajuste_valor: '0', // negativo = desconto, positivo = acréscimo
    ajuste_tipo: 'valor', // R$ ou %
    condicoes_pagamento: '',
    prazo_entrega: '',
    observacoes: '',
  })
  const [itens, setItens] = useState([])
  const [errors, setErrors] = useState({})

  useEffect(() => {
    loadClientes()
  }, [])

  const loadClientes = async () => {
    try {
      const data = await clienteService.list({ page_size: 1000 })
      setClientes(data.results || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  const handleAddItem = () => {
    setItens([
      ...itens,
      {
        tipo: 'servico',
        descricao: '',
        quantidade: '',
        valor_unitario: '',
      },
    ])
  }

  const handleRemoveItem = (index) => {
    setItens(itens.filter((_, i) => i !== index))
  }

  const handleItemChange = (index, field, value) => {
    const newItens = [...itens]
    newItens[index][field] = value
    setItens(newItens)
  }

  const calcularTotalItem = (item) => {
    const quantidade = parseFloat(item.quantidade) || 0
    const valorUnitario = parseFloat(item.valor_unitario) || 0
    return quantidade * valorUnitario
  }

  const calcularSubtotal = () => {
    return itens.reduce((total, item) => total + calcularTotalItem(item), 0)
  }

  const calcularValoresFinais = () => {
    const subtotal = calcularSubtotal()
    const valorAjuste = parseFloat(formData.ajuste_valor) || 0
    const tipo = formData.ajuste_tipo

    let valorDesconto = 0
    let valorAcrescimo = 0

    if (valorAjuste < 0) {
      valorDesconto =
        tipo === 'percentual'
          ? subtotal * (Math.abs(valorAjuste) / 100)
          : Math.abs(valorAjuste)
    } else if (valorAjuste > 0) {
      valorAcrescimo =
        tipo === 'percentual'
          ? subtotal * (valorAjuste / 100)
          : valorAjuste
    }

    const valorFinal = subtotal - valorDesconto + valorAcrescimo
    return { subtotal, valorDesconto, valorAcrescimo, valorFinal }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})

    // Validação básica
    if (!formData.cliente) {
      setErrors({ cliente: 'Selecione um cliente' })
      return
    }

    setSaving(true)

    try {
      // Validar itens se houver
      let itensValidados = []
      if (itens.length > 0) {
        itensValidados = itens.map((item) => {
          if (!item.descricao || !item.quantidade || !item.valor_unitario) {
            throw new Error('Todos os campos do item são obrigatórios')
          }
          return {
            tipo: item.tipo,
            descricao: item.descricao,
            quantidade: parseInt(item.quantidade),
            valor_unitario: parseFloat(item.valor_unitario),
          }
        })
      }

      // Converter ajuste (negativo=desconto, positivo=acréscimo) para API
      const valorAjuste = parseFloat(formData.ajuste_valor) || 0
      const desconto = valorAjuste < 0 ? Math.abs(valorAjuste) : 0
      const acrescimo = valorAjuste > 0 ? valorAjuste : 0
      const tipo = formData.ajuste_tipo

      // Criar o orçamento conforme API
      const data = {
        cliente: parseInt(formData.cliente),
        ...(formData.descricao?.trim() && { descricao: formData.descricao.trim() }),
        status: formData.status,
        desconto,
        desconto_tipo: tipo,
        acrescimo,
        acrescimo_tipo: tipo,
        ...(formData.data_validade && { data_validade: formData.data_validade }),
        ...(formData.condicoes_pagamento?.trim() && { condicoes_pagamento: formData.condicoes_pagamento.trim() }),
        ...(formData.prazo_entrega?.trim() && { prazo_entrega: formData.prazo_entrega.trim() }),
        ...(formData.observacoes?.trim() && { observacoes: formData.observacoes.trim() }),
        ...(itensValidados.length > 0 && { itens: itensValidados }),
      }

      const result = await orcamentoService.create(data)
      navigate(`/orcamentos/${result.id}`)
    } catch (error) {
      console.error('Erro ao criar orçamento:', error)
      if (error.response?.data) {
        setErrors(error.response.data)
        // Mostrar erros específicos
        if (error.response.data.cliente) {
          alert(`Erro no cliente: ${Array.isArray(error.response.data.cliente) ? error.response.data.cliente.join(', ') : error.response.data.cliente}`)
        }
        if (error.response.data.descricao) {
          alert(`Erro na descrição: ${Array.isArray(error.response.data.descricao) ? error.response.data.descricao.join(', ') : error.response.data.descricao}`)
        }
        if (error.response.data.itens) {
          alert(`Erro nos itens: ${Array.isArray(error.response.data.itens) ? error.response.data.itens.join(', ') : error.response.data.itens}`)
        }
      } else if (error.message) {
        alert(error.message)
      } else {
        alert('Erro ao criar orçamento. Tente novamente.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/orcamentos">
          <button className="p-2 rounded-lg hover:bg-secondary-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-secondary-600" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            Novo Orçamento
          </h1>
          <p className="text-secondary-600 mt-1">
            Preencha os dados do novo orçamento
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Select
            label="Cliente"
            value={formData.cliente}
            onChange={(e) =>
              setFormData({ ...formData, cliente: e.target.value })
            }
            options={[
              { value: '', label: 'Selecione um cliente' },
              ...clientes.map((cliente) => ({
                value: cliente.id.toString(),
                label: cliente.razao_social,
              })),
            ]}
            required
            error={errors.cliente}
            placeholder="Selecione um cliente"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              options={[
                { value: 'rascunho', label: 'Rascunho' },
                { value: 'enviado', label: 'Enviado' },
                { value: 'aprovado', label: 'Aprovado' },
                { value: 'rejeitado', label: 'Rejeitado' },
                { value: 'vencido', label: 'Vencido' },
                { value: 'cancelado', label: 'Cancelado' },
              ]}
            />
            <Input
              label="Data de Validade"
              type="date"
              value={formData.data_validade}
              onChange={(e) =>
                setFormData({ ...formData, data_validade: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Input
              label="Prazo de Entrega"
              type="text"
              value={formData.prazo_entrega}
              onChange={(e) =>
                setFormData({ ...formData, prazo_entrega: e.target.value })
              }
              placeholder="Ex: 15 dias úteis"
            />
            <Input
              label="Condições de Pagamento"
              type="text"
              value={formData.condicoes_pagamento}
              onChange={(e) =>
                setFormData({ ...formData, condicoes_pagamento: e.target.value })
              }
              placeholder="Ex: À vista ou parcelado em 3x"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Descrição do Orçamento
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) =>
                setFormData({ ...formData, descricao: e.target.value })
              }
              className="input-base min-h-[120px]"
              placeholder="Descreva o contexto geral do orçamento, situação ou necessidade do cliente (opcional)..."
            />
            {errors.descricao && (
              <p className="mt-1 text-sm text-danger-600">{errors.descricao}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Observações
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) =>
                setFormData({ ...formData, observacoes: e.target.value })
              }
              className="input-base min-h-[100px]"
              placeholder="Observações adicionais..."
            />
          </div>

          {/* Seção de Itens - header sticky para manter o botão sempre visível */}
          <div className="pt-6 border-t border-secondary-200">
            <div className="sticky top-0 z-10 -mt-6 pt-6 pb-4 -mx-1 px-1 bg-white border-b border-secondary-100 mb-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-lg font-semibold text-secondary-900">
                  Itens do Orçamento
                </h3>
                <p className="text-sm text-secondary-600 mt-1">
                  Adicione os serviços e peças que compõem este orçamento
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleAddItem}
                className="flex items-center gap-2 shrink-0"
              >
                <Plus className="w-4 h-4" />
                Adicionar Item
              </Button>
            </div>

            {itens.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-secondary-300 rounded-lg">
                <p className="text-secondary-500 text-sm">
                  Nenhum item adicionado. Clique em "Adicionar Item" para começar.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {itens.map((item, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="font-medium text-secondary-900">
                        Item #{index + 1}
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-1 rounded-lg hover:bg-danger-50 text-danger-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <Input
                        label="Descrição"
                        type="text"
                        value={item.descricao}
                        onChange={(e) =>
                          handleItemChange(index, 'descricao', e.target.value)
                        }
                        required
                        placeholder="Ex: Mão de obra, Peça X, etc."
                      />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select
                          label="Tipo"
                          value={item.tipo}
                          onChange={(e) =>
                            handleItemChange(index, 'tipo', e.target.value)
                          }
                          options={[
                            { value: 'servico', label: 'Serviço' },
                            { value: 'peca', label: 'Peça' },
                          ]}
                          required
                        />
                        <Input
                          label="Quantidade"
                          type="number"
                          value={item.quantidade}
                          onChange={(e) =>
                            handleItemChange(index, 'quantidade', e.target.value)
                          }
                          required
                          min="1"
                          step="1"
                        />
                        <Input
                          label="Valor Unitário"
                          type="number"
                          step="0.01"
                          value={item.valor_unitario}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              'valor_unitario',
                              e.target.value
                            )
                          }
                          required
                          min="0"
                        />
                      </div>
                    </div>
                    {item.quantidade && item.valor_unitario && (
                      <div className="mt-3 pt-3 border-t border-secondary-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-secondary-600">
                            Total do Item:
                          </span>
                          <span className="text-lg font-semibold text-primary-600">
                            {formatCurrency(calcularTotalItem(item))}
                          </span>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}

                {/* Desconto/Acréscimo - abaixo dos itens */}
                {itens.length > 0 && (
                  <Card className="p-4 border border-secondary-200">
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Desconto ou Acréscimo
                    </label>
                    <p className="text-sm text-secondary-500 mb-3">
                      Valor negativo = desconto. Valor positivo = acréscimo. Ex: -20 para 20% de desconto, 50 para R$ 50 de acréscimo.
                    </p>
                    <div className="flex flex-wrap items-end gap-4">
                      <div className="flex-1 min-w-[120px] max-w-[200px]">
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.ajuste_valor}
                          onChange={(e) =>
                            setFormData({ ...formData, ajuste_valor: e.target.value })
                          }
                          placeholder="0"
                        />
                      </div>
                      <div className="w-24 shrink-0">
                        <Select
                          value={formData.ajuste_tipo}
                          onChange={(e) =>
                            setFormData({ ...formData, ajuste_tipo: e.target.value })
                          }
                          options={[
                            { value: 'valor', label: 'R$' },
                            { value: 'percentual', label: '%' },
                          ]}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </Card>
                )}

                {/* Valor Total do Orçamento - abaixo de desconto/acréscimo */}
                {itens.length > 0 && (() => {
                  const { subtotal, valorDesconto, valorAcrescimo, valorFinal } = calcularValoresFinais()
                  const temAjuste = valorDesconto > 0 || valorAcrescimo > 0
                  return (
                    <Card className="p-4 bg-primary-50">
                      {temAjuste ? (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-secondary-700">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(subtotal)}</span>
                          </div>
                          {valorDesconto > 0 && (
                            <div className="flex justify-between text-sm text-success-600">
                              <span>Desconto:</span>
                              <span>- {formatCurrency(valorDesconto)}</span>
                            </div>
                          )}
                          {valorAcrescimo > 0 && (
                            <div className="flex justify-between text-sm text-secondary-600">
                              <span>Acréscimo:</span>
                              <span>+ {formatCurrency(valorAcrescimo)}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center pt-3 mt-3 border-t border-primary-200">
                            <span className="text-lg font-semibold text-secondary-900">
                              Valor Final:
                            </span>
                            <span className="text-2xl font-bold text-primary-600">
                              {formatCurrency(valorFinal)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-semibold text-secondary-900">
                            Valor Total do Orçamento:
                          </span>
                          <span className="text-2xl font-bold text-primary-600">
                            {formatCurrency(valorFinal)}
                          </span>
                        </div>
                      )}
                    </Card>
                  )
                })()}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-secondary-200">
            <Link to="/orcamentos">
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" variant="primary" isLoading={saving}>
              Criar Orçamento
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default OrcamentoForm

