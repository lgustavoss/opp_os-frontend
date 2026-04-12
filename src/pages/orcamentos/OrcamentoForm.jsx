import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Info, Wrench, Package } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Loading from '../../components/ui/Loading'
import Modal from '../../components/ui/Modal'
import { usePermissoesModulos } from '../../hooks/usePermissoesModulos'
import { orcamentoService } from '../../services/orcamentoService'
import { produtoService } from '../../services/produtoService'
import { localEstoqueService } from '../../services/localEstoqueService'
import { statusOrcamentoService } from '../../services/statusOrcamentoService'
import { API_MAX_PAGE_SIZE } from '../../config/api'
import { formatCurrency } from '../../utils/formatters'
import ClienteSelect from '../../components/common/ClienteSelect'
import DescricaoProdutoBusca from '../../components/common/DescricaoProdutoBusca'
import { Link } from 'react-router-dom'

const emptyQuickProduto = () => ({ descricao: '', valor: '' })

/** Serviço = livre · Produto = cadastro — largura total em telas médias para não cortar rótulos */
function ItemTipoSegment({ value, onChange, className = '' }) {
  const seg =
    'flex flex-1 min-w-0 items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 sm:px-3 sm:text-sm whitespace-nowrap'
  return (
    <div
      className={`flex w-full min-w-0 rounded-xl border border-secondary-200/90 bg-white p-0.5 shadow-sm sm:max-w-md ${className}`}
      role="group"
      aria-label="Tipo da linha"
    >
      <button
        type="button"
        className={`${seg} ${
          value === 'servico'
            ? 'bg-primary-600 text-white shadow-sm'
            : 'text-secondary-600 hover:bg-secondary-50'
        }`}
        onClick={() => onChange('servico')}
      >
        <Wrench className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
        Serviço
      </button>
      <button
        type="button"
        className={`${seg} ${
          value === 'peca'
            ? 'bg-primary-600 text-white shadow-sm'
            : 'text-secondary-600 hover:bg-secondary-50'
        }`}
        onClick={() => onChange('peca')}
      >
        <Package className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
        Produto
      </button>
    </div>
  )
}

/** Valor em reais ou percentual — mesmo padrão do Serviço/Produto (só texto, sem ícone duplicado) */
function AjusteTipoSegment({ value, onChange, className = '' }) {
  const seg =
    'flex flex-1 min-w-[4.25rem] items-center justify-center px-3 py-3 rounded-lg text-sm font-semibold tabular-nums transition-all duration-200 sm:min-w-[5rem] sm:text-base'
  return (
    <div
      className={`flex w-full min-w-[10.5rem] rounded-xl border border-secondary-200/90 bg-white p-0.5 shadow-sm ${className}`}
      role="group"
      aria-label="Tipo de ajuste: reais ou percentual"
    >
      <button
        type="button"
        className={`${seg} ${
          value === 'valor'
            ? 'bg-primary-600 text-white shadow-sm'
            : 'text-secondary-600 hover:bg-secondary-50'
        }`}
        onClick={() => onChange('valor')}
      >
        R$
      </button>
      <button
        type="button"
        className={`${seg} ${
          value === 'percentual'
            ? 'bg-primary-600 text-white shadow-sm'
            : 'text-secondary-600 hover:bg-secondary-50'
        }`}
        onClick={() => onChange('percentual')}
      >
        %
      </button>
    </div>
  )
}

const OrcamentoForm = () => {
  const perm = usePermissoesModulos()
  const podeCadastrarProduto = perm.isStaff || perm.orcamentos_pode_cadastrar
  const navigate = useNavigate()
  const location = useLocation()
  const { id: paramId } = useParams()
  const [searchParams] = useSearchParams()
  const clienteFromUrl = searchParams.get('cliente') || ''
  const isEditMode = Boolean(paramId && /\/editar$/.test(location.pathname))
  const editId = isEditMode ? paramId : null

  const serverItemIdsRef = useRef(new Set())
  const [pageLoading, setPageLoading] = useState(() => Boolean(isEditMode))
  const [numeroOrcamento, setNumeroOrcamento] = useState('')
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    cliente: clienteFromUrl,
    descricao: '',
    status: '',
    data_validade: '',
    ajuste_valor: '0', // negativo = desconto, positivo = acréscimo
    ajuste_tipo: 'valor', // R$ ou %
    condicoes_pagamento: '',
    prazo_entrega: '',
    observacoes: '',
  })
  const [itens, setItens] = useState([])
  const [errors, setErrors] = useState({})
  const [statusOptionsActive, setStatusOptionsActive] = useState([])
  const [statusExtra, setStatusExtra] = useState(null)
  const [produtosCatalog, setProdutosCatalog] = useState([])
  const [quickProdutoModal, setQuickProdutoModal] = useState({ open: false, rowIndex: null })
  const [quickProdutoForm, setQuickProdutoForm] = useState(emptyQuickProduto)
  const [quickProdutoSaving, setQuickProdutoSaving] = useState(false)
  const [locaisEstoque, setLocaisEstoque] = useState([])
  const [localEstoqueId, setLocalEstoqueId] = useState('')

  const carregarCatalogoProdutos = useCallback(async () => {
    try {
      const data = await produtoService.list({ page_size: API_MAX_PAGE_SIZE, page: 1 })
      setProdutosCatalog(data.results || [])
    } catch {
      setProdutosCatalog([])
    }
  }, [])

  useEffect(() => {
    carregarCatalogoProdutos()
  }, [carregarCatalogoProdutos])

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

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const list = await statusOrcamentoService.listAllOrdered({ ativo: true })
        if (!cancelled) setStatusOptionsActive(list)
      } catch (e) {
        console.error(e)
        if (!cancelled) setStatusOptionsActive([])
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  const statusSelectOptions = useMemo(() => {
    const o = [...statusOptionsActive]
    if (statusExtra?.id != null && !o.some((s) => s.id === statusExtra.id)) {
      o.push({
        id: statusExtra.id,
        nome: statusExtra.nome || 'Status',
        ordem: 9999,
      })
    }
    return o.sort(
      (a, b) =>
        (a.ordem ?? 0) - (b.ordem ?? 0) || (a.id ?? 0) - (b.id ?? 0)
    )
  }, [statusOptionsActive, statusExtra])

  const statusSelecionado = useMemo(
    () => statusSelectOptions.find((s) => String(s.id) === String(formData.status)),
    [statusSelectOptions, formData.status]
  )

  useEffect(() => {
    if (!editId) setStatusExtra(null)
  }, [editId])

  useEffect(() => {
    if (isEditMode || !statusSelectOptions.length) return
    setFormData((prev) => {
      if (prev.status !== '' && prev.status != null) return prev
      return { ...prev, status: String(statusSelectOptions[0].id) }
    })
  }, [isEditMode, statusSelectOptions])

  useEffect(() => {
    if (!isEditMode && clienteFromUrl) {
      setFormData((prev) => ({ ...prev, cliente: clienteFromUrl }))
    }
  }, [clienteFromUrl, isEditMode])

  useEffect(() => {
    if (!editId) {
      setPageLoading(false)
      return
    }
    let cancelled = false
    const load = async () => {
      try {
        setPageLoading(true)
        const data = await orcamentoService.get(editId)
        if (cancelled) return
        setNumeroOrcamento(data.numero || '')
        const dv = data.data_validade
          ? String(data.data_validade).slice(0, 10)
          : ''
        const d = parseFloat(data.desconto) || 0
        const a = parseFloat(data.acrescimo) || 0
        let ajuste_valor = '0'
        let ajuste_tipo = data.desconto_tipo || 'valor'
        if (d > 0) {
          ajuste_valor = String(-d)
          ajuste_tipo = data.desconto_tipo || 'valor'
        } else if (a > 0) {
          ajuste_valor = String(a)
          ajuste_tipo = data.acrescimo_tipo || 'valor'
        }
        setStatusExtra(
          data.status != null
            ? { id: data.status, nome: data.status_nome }
            : null
        )
        setFormData({
          cliente: data.cliente != null ? String(data.cliente) : '',
          descricao: data.descricao || '',
          status: data.status != null ? String(data.status) : '',
          data_validade: dv,
          ajuste_valor,
          ajuste_tipo,
          condicoes_pagamento: data.condicoes_pagamento || '',
          prazo_entrega: data.prazo_entrega || '',
          observacoes: data.observacoes || '',
        })
        const mapped = (data.itens || []).map((it) => {
          let tipo = it.tipo || 'servico'
          const produto =
            it.produto != null && it.produto !== '' ? String(it.produto) : ''
          if (tipo === 'peca' && !produto) {
            tipo = 'servico'
          }
          return {
            id: it.id,
            produto,
            tipo,
            descricao: it.descricao || '',
            quantidade: it.quantidade != null ? String(it.quantidade) : '',
            valor_unitario:
              it.valor_unitario != null ? String(it.valor_unitario) : '',
          }
        })
        setItens(mapped)
        serverItemIdsRef.current = new Set(mapped.map((i) => i.id).filter(Boolean))
      } catch (e) {
        console.error(e)
        alert('Não foi possível carregar o orçamento.')
        navigate('/orcamentos')
      } finally {
        if (!cancelled) setPageLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [editId, navigate])

  const handleAddItem = () => {
    setItens([
      ...itens,
      {
        id: undefined,
        produto: '',
        tipo: 'servico',
        descricao: '',
        quantidade: '',
        valor_unitario: '',
      },
    ])
  }

  const handleItemProdutoChange = (index, codigoStr, produtoRecemCriado = null) => {
    const newItens = [...itens]
    const row = { ...newItens[index], produto: codigoStr }
    if (codigoStr) {
      const p =
        produtoRecemCriado ||
        produtosCatalog.find((x) => String(x.codigo) === codigoStr)
      if (p) {
        row.descricao = p.descricao
        row.valor_unitario = String(p.valor)
      }
    }
    newItens[index] = row
    setItens(newItens)
  }

  const abrirCadastroRapidoProduto = (rowIndex, descricaoInicial = '') => {
    setQuickProdutoForm({
      descricao: (descricaoInicial || '').trim(),
      valor: '',
    })
    setQuickProdutoModal({ open: true, rowIndex })
  }

  const fecharCadastroRapidoProduto = () => {
    if (!quickProdutoSaving) setQuickProdutoModal({ open: false, rowIndex: null })
  }

  const salvarCadastroRapidoProduto = async (e) => {
    e.preventDefault()
    const descricao = (quickProdutoForm.descricao || '').trim()
    const valor = parseFloat(String(quickProdutoForm.valor).replace(',', '.'))
    if (!descricao) {
      alert('Informe a descrição do produto.')
      return
    }
    if (Number.isNaN(valor) || valor < 0) {
      alert('Informe um valor válido.')
      return
    }
    const idx = quickProdutoModal.rowIndex
    if (idx == null) return
    try {
      setQuickProdutoSaving(true)
      const created = await produtoService.create({
        descricao,
        valor: valor.toFixed(2),
      })
      await carregarCatalogoProdutos()
      handleItemProdutoChange(idx, String(created.codigo), created)
      setQuickProdutoModal({ open: false, rowIndex: null })
      setQuickProdutoForm(emptyQuickProduto())
    } catch (err) {
      const d = err.response?.data
      const msg =
        (typeof d === 'object' &&
          (d.descricao?.[0] || d.valor?.[0] || d.detail || d.erro)) ||
        'Não foi possível cadastrar o produto.'
      alert(typeof msg === 'string' ? msg : 'Não foi possível cadastrar o produto.')
    } finally {
      setQuickProdutoSaving(false)
    }
  }

  const montarPayloadItem = (item, { explicitProduto = false } = {}) => {
    const body = {
      tipo: item.tipo,
      descricao: item.descricao,
      quantidade: parseInt(item.quantidade, 10),
      valor_unitario: parseFloat(item.valor_unitario),
    }
    if (item.tipo === 'servico') {
      body.produto = null
    } else if (item.produto) {
      const c = parseInt(item.produto, 10)
      if (!Number.isNaN(c)) body.produto = c
    } else if (explicitProduto) {
      body.produto = null
    }
    return body
  }

  const handleRemoveItem = (index) => {
    setItens(itens.filter((_, i) => i !== index))
  }

  const handleItemChange = (index, field, value) => {
    const newItens = [...itens]
    if (field === 'tipo') {
      newItens[index] = { ...newItens[index], tipo: value, produto: '' }
    } else {
      newItens[index] = { ...newItens[index], [field]: value }
    }
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

    if (formData.status === '' || formData.status == null) {
      setErrors({ status: 'Selecione um status.' })
      return
    }
    const statusFk = parseInt(formData.status, 10)
    if (Number.isNaN(statusFk)) {
      setErrors({ status: 'Status inválido.' })
      return
    }

    const stMeta = statusSelectOptions.find((s) => s.id === statusFk)
    if (
      stMeta?.movimenta_estoque_saida &&
      locaisEstoque.length > 1 &&
      !localEstoqueId
    ) {
      setErrors({
        local_estoque:
          'Selecione o local de estoque para registrar a saída ao usar este status.',
      })
      return
    }

    setSaving(true)

    try {
      // Validar itens se houver
      let itensValidados = []
      if (itens.length > 0) {
        itensValidados = itens.map((item, idx) => {
          if (!item.descricao || !item.quantidade || !item.valor_unitario) {
            throw new Error('Todos os campos do item são obrigatórios')
          }
          if (item.tipo === 'peca' && !item.produto) {
            throw new Error(
              `Item ${idx + 1}: tipo Produto exige selecionar um produto do cadastro (ou cadastre um novo).`
            )
          }
          return montarPayloadItem(item)
        })
      }

      // Converter ajuste (negativo=desconto, positivo=acréscimo) para API
      const valorAjuste = parseFloat(formData.ajuste_valor) || 0
      const desconto = valorAjuste < 0 ? Math.abs(valorAjuste) : 0
      const acrescimo = valorAjuste > 0 ? valorAjuste : 0
      const tipo = formData.ajuste_tipo

      const updatePayload = {
        cliente: parseInt(formData.cliente, 10),
        descricao: formData.descricao?.trim() || null,
        status: statusFk,
        desconto,
        desconto_tipo: tipo,
        acrescimo,
        acrescimo_tipo: tipo,
        data_validade: formData.data_validade || null,
        condicoes_pagamento: formData.condicoes_pagamento?.trim() || null,
        prazo_entrega: formData.prazo_entrega?.trim() || null,
        observacoes: formData.observacoes?.trim() || null,
        ...(stMeta?.movimenta_estoque_saida &&
          locaisEstoque.length > 1 &&
          localEstoqueId && {
            local_estoque: parseInt(localEstoqueId, 10),
          }),
      }

      const createPayload = {
        cliente: parseInt(formData.cliente, 10),
        status: statusFk,
        ...(formData.descricao?.trim() && { descricao: formData.descricao.trim() }),
        desconto,
        desconto_tipo: tipo,
        acrescimo,
        acrescimo_tipo: tipo,
        ...(formData.data_validade && { data_validade: formData.data_validade }),
        ...(formData.condicoes_pagamento?.trim() && {
          condicoes_pagamento: formData.condicoes_pagamento.trim(),
        }),
        ...(formData.prazo_entrega?.trim() && { prazo_entrega: formData.prazo_entrega.trim() }),
        ...(formData.observacoes?.trim() && { observacoes: formData.observacoes.trim() }),
        ...(itensValidados.length > 0 && { itens: itensValidados }),
        ...(stMeta?.movimenta_estoque_saida &&
          locaisEstoque.length > 1 &&
          localEstoqueId && {
            local_estoque: parseInt(localEstoqueId, 10),
          }),
      }

      if (isEditMode && editId) {
        await orcamentoService.update(editId, updatePayload)

        const idsInForm = new Set(itens.filter((i) => i.id).map((i) => i.id))
        for (const sid of serverItemIdsRef.current) {
          if (!idsInForm.has(sid)) {
            await orcamentoService.deleteItem(sid)
          }
        }
        for (const item of itens) {
          if (item.id) {
            await orcamentoService.updateItem(
              item.id,
              montarPayloadItem(item, { explicitProduto: true })
            )
          }
        }
        for (const item of itens) {
          if (!item.id) {
            await orcamentoService.adicionarItem(editId, montarPayloadItem(item))
          }
        }

        const fresh = await orcamentoService.get(editId)
        serverItemIdsRef.current = new Set(
          (fresh.itens || []).map((i) => i.id).filter(Boolean)
        )
        navigate(`/orcamentos/${editId}`)
        return
      }

      const result = await orcamentoService.create(createPayload)
      navigate(`/orcamentos/${result.id}`)
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error)
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
        const er = error.response.data.erro
        if (er) {
          alert(typeof er === 'string' ? er : JSON.stringify(er))
        }
        const le = error.response.data.local_estoque
        if (le) {
          alert(Array.isArray(le) ? le.join(' ') : String(le))
        }
      } else if (error.message) {
        alert(error.message)
      } else {
        alert(isEditMode ? 'Erro ao salvar orçamento. Tente novamente.' : 'Erro ao criar orçamento. Tente novamente.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (pageLoading) {
    return <Loading fullScreen />
  }

  const cancelHref = isEditMode && editId ? `/orcamentos/${editId}` : '/orcamentos'

  return (
    <div className="space-y-6 pb-28 md:pb-32">
      <div className="flex items-center gap-4">
        <Link to={cancelHref}>
          <button type="button" className="p-2 rounded-lg hover:bg-secondary-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-secondary-600" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            {isEditMode ? `Editar orçamento${numeroOrcamento ? ` ${numeroOrcamento}` : ''}` : 'Novo Orçamento'}
          </h1>
          <p className="text-secondary-600 mt-1">
            {isEditMode
              ? 'Altere os dados e salve. Depois, na tela do orçamento, gere o PDF para conferir.'
              : 'Preencha os dados do novo orçamento'}
          </p>
        </div>
      </div>

      <Card>
        <form id="form-orcamento" onSubmit={handleSubmit} className="space-y-6">
          <ClienteSelect
            label="Cliente"
            value={formData.cliente}
            onChange={(e) =>
              setFormData({ ...formData, cliente: e.target.value })
            }
            required
            error={errors.cliente}
            placeholder="Digite para buscar cliente..."
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              required
              error={errors.status}
              placeholder={
                statusSelectOptions.length
                  ? 'Selecione um status'
                  : 'Cadastre um status em Configurações'
              }
              options={statusSelectOptions.map((s) => ({
                value: String(s.id),
                label: s.nome,
              }))}
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

          {statusSelecionado?.movimenta_estoque_saida && locaisEstoque.length > 1 && (
            <div>
              <Select
                label="Local de estoque (saída)"
                value={localEstoqueId}
                onChange={(e) => setLocalEstoqueId(e.target.value)}
                error={errors.local_estoque}
                placeholder="Onde sairá o material"
                options={[
                  { value: '', label: 'Selecione o depósito' },
                  ...locaisEstoque.map((loc) => ({
                    value: String(loc.id),
                    label: `${loc.nome}${loc.padrao ? ' (padrão)' : ''}`,
                  })),
                ]}
              />
              <p className="mt-1 text-xs text-secondary-500">
                Obrigatório ao usar um status que movimenta estoque e há mais de um depósito.
              </p>
            </div>
          )}

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

          {/* Itens: lista compacta estilo planilha + segmento Serviço/Produto */}
          <div className="pt-6 border-t border-secondary-200">
            <div className="sticky top-0 z-[5] -mt-6 pt-6 pb-4 -mx-1 px-1 bg-white border-b border-secondary-100 mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-secondary-900 tracking-tight">
                  Itens do orçamento
                </h3>
                <p className="text-sm text-secondary-500 mt-2 flex items-start gap-2 max-w-2xl leading-relaxed">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-primary-500/80" aria-hidden />
                  <span>
                    <span className="font-medium text-secondary-700">Serviço</span> — texto e valores à mão.
                    <span className="mx-1.5 text-secondary-300">·</span>
                    <span className="font-medium text-secondary-700">Produto</span> — escolha do cadastro; o
                    unitário pode ser ajustado só neste orçamento.
                  </span>
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleAddItem}
                className="flex items-center justify-center gap-2 shrink-0 self-start sm:self-center"
              >
                <Plus className="w-4 h-4" />
                Adicionar linha
              </Button>
            </div>

            {itens.length === 0 ? (
              <button
                type="button"
                onClick={handleAddItem}
                className="group w-full rounded-2xl border-2 border-dashed border-secondary-200 bg-gradient-to-b from-secondary-50/40 to-white px-6 py-12 text-center transition-all hover:border-primary-300 hover:from-primary-50/50 hover:shadow-md"
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600 transition-transform group-hover:scale-105">
                  <Plus className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-secondary-800">Nenhum item ainda</p>
                <p className="mt-1 text-sm text-secondary-500">
                  Clique para adicionar a primeira linha (serviço ou produto).
                </p>
              </button>
            ) : (
              <div className="space-y-4">
                {/* Cabeçalho colunas — visível em telas médias+ */}
                <div className="hidden lg:grid lg:grid-cols-[minmax(17rem,1.35fr)_minmax(0,2fr)_5.5rem_7rem_6.5rem_2.5rem] lg:gap-3 lg:px-4 lg:text-xs lg:font-semibold lg:uppercase lg:tracking-wide lg:text-secondary-400">
                  <span className="pl-11">Tipo / vínculo</span>
                  <span>Descrição</span>
                  <span className="text-right">Qtd</span>
                  <span className="text-right">Unit.</span>
                  <span className="text-right">Total</span>
                  <span className="sr-only">Ações</span>
                </div>

                <div className="relative z-30 divide-y divide-secondary-100 overflow-visible rounded-2xl border border-secondary-200/90 bg-white shadow-sm">
                  {itens.map((item, index) => (
                    <div
                      key={item.id ?? `novo-${index}`}
                      className="p-4 transition-colors hover:bg-primary-50/25 lg:p-3"
                    >
                      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(17rem,1.35fr)_minmax(0,2fr)_5.5rem_7rem_6.5rem_2.5rem] lg:items-start lg:gap-3 lg:px-1 lg:pt-1">
                        {/* Coluna tipo + produto (empilhado no mobile/tablet para não esmagar o segmento) */}
                        <div className="flex w-full min-w-0 flex-col gap-3">
                          <div className="flex w-full items-center gap-2 sm:gap-3">
                            <span
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-100 text-xs font-bold text-secondary-600"
                              title={`Linha ${index + 1}`}
                            >
                              {index + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <ItemTipoSegment
                                value={item.tipo}
                                onChange={(v) => handleItemChange(index, 'tipo', v)}
                              />
                            </div>
                          </div>
                          {item.tipo === 'peca' ? (
                            <p className="pl-0 text-xs leading-relaxed text-secondary-500 sm:pl-11">
                              A descrição ao lado busca o cadastro automaticamente (3+ letras). Se não existir,
                              você pode cadastrar na hora.
                            </p>
                          ) : (
                            <p className="pl-0 text-xs text-secondary-400 sm:pl-11">
                              Preencha a descrição na coluna ao lado.
                            </p>
                          )}
                        </div>

                        {/* Descrição */}
                        <div className="min-w-0 lg:min-h-[2.5rem] lg:flex lg:flex-col lg:justify-center">
                          <span className="mb-1 block text-xs font-medium text-secondary-500 lg:hidden">
                            Descrição
                          </span>
                          {item.tipo === 'peca' ? (
                            <DescricaoProdutoBusca
                              id={`orc-item-desc-${index}`}
                              value={item.descricao}
                              onChange={(v) => {
                                setItens((prev) => {
                                  const next = [...prev]
                                  const row = { ...next[index], descricao: v }
                                  if (!String(v || '').trim()) {
                                    row.produto = ''
                                  }
                                  next[index] = row
                                  return next
                                })
                              }}
                              produtoCodigo={item.produto}
                              onVincularProduto={(p) =>
                                handleItemProdutoChange(index, String(p.codigo), p)
                              }
                              podeCadastrarProduto={podeCadastrarProduto}
                              onCadastrarComTexto={(texto) =>
                                abrirCadastroRapidoProduto(index, texto)
                              }
                            />
                          ) : (
                            <Input
                              type="text"
                              value={item.descricao}
                              onChange={(e) =>
                                handleItemChange(index, 'descricao', e.target.value)
                              }
                              required
                              className="text-sm"
                              placeholder="Ex.: instalação, visita técnica…"
                            />
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 lg:contents">
                          <div className="min-w-0">
                            <span className="mb-1 block text-xs font-medium text-secondary-500 lg:hidden">
                              Quantidade
                            </span>
                            <Input
                              type="number"
                              value={item.quantidade}
                              onChange={(e) =>
                                handleItemChange(index, 'quantidade', e.target.value)
                              }
                              required
                              min="1"
                              step="1"
                              className="h-10 w-full text-center text-sm tabular-nums lg:text-right"
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="mb-1 block text-xs font-medium text-secondary-500 lg:hidden">
                              Valor unitário
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.valor_unitario}
                              onChange={(e) =>
                                handleItemChange(index, 'valor_unitario', e.target.value)
                              }
                              required
                              min="0"
                              className="h-10 w-full text-sm tabular-nums lg:text-right"
                            />
                          </div>
                        </div>

                        {/* Total linha */}
                        <div className="flex items-center justify-between gap-3 border-t border-secondary-100 pt-3 lg:block lg:border-0 lg:pt-0 lg:text-right">
                          <span className="text-xs font-medium text-secondary-500 lg:hidden">Total</span>
                          <span className="text-base font-semibold tabular-nums text-primary-700 lg:text-sm lg:font-bold">
                            {formatCurrency(calcularTotalItem(item))}
                          </span>
                        </div>

                        {/* Remover */}
                        <div className="flex justify-end lg:justify-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="rounded-lg p-2 text-secondary-400 transition-colors hover:bg-danger-50 hover:text-danger-600"
                            title="Remover linha"
                            aria-label="Remover linha"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desconto/Acréscimo - abaixo dos itens */}
                {itens.length > 0 && (
                  <Card className="p-4 border border-secondary-200 overflow-visible mb-1">
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Desconto ou Acréscimo
                    </label>
                    <p className="text-xs text-secondary-500 mb-3 leading-relaxed sm:text-sm">
                      Negativo desconta, positivo acrescenta. Com <span className="font-medium">%</span>, o
                      valor incide sobre o subtotal.
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-4">
                      <div className="min-w-0 sm:max-w-xl">
                        <label className="block text-xs font-medium text-secondary-500 mb-1.5">
                          Valor
                        </label>
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
                      <div className="w-full sm:w-auto sm:shrink-0">
                        <label className="mb-1.5 block text-xs font-medium text-secondary-500">
                          Tipo
                        </label>
                        <AjusteTipoSegment
                          value={formData.ajuste_tipo}
                          onChange={(v) => setFormData({ ...formData, ajuste_tipo: v })}
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
        </form>
      </Card>

      {/* Barra fixa: salvar/cancelar sempre acessíveis sem rolar até o fim */}
      <div
        className="app-actions-bar fixed bottom-0 left-0 right-0 z-40 border-t border-secondary-200 bg-white/95 backdrop-blur-sm shadow-[0_-4px_24px_rgba(15,23,42,0.08)]"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="container-app py-3 flex flex-wrap items-center justify-end gap-3">
          <Link to={cancelHref}>
            <Button type="button" variant="secondary" disabled={saving}>
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            form="form-orcamento"
            variant="primary"
            isLoading={saving}
          >
            {isEditMode ? 'Salvar alterações' : 'Criar Orçamento'}
          </Button>
        </div>
      </div>

      <Modal
        isOpen={quickProdutoModal.open}
        onClose={fecharCadastroRapidoProduto}
        title="Cadastrar produto"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={fecharCadastroRapidoProduto}
              disabled={quickProdutoSaving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-quick-produto"
              variant="primary"
              isLoading={quickProdutoSaving}
            >
              Salvar e usar
            </Button>
          </>
        }
      >
        <form id="form-quick-produto" onSubmit={salvarCadastroRapidoProduto} className="space-y-4">
          <p className="text-sm text-secondary-600">
            O produto será salvo no cadastro global e selecionado nesta linha do orçamento.
          </p>
          <Input
            label="Descrição"
            value={quickProdutoForm.descricao}
            onChange={(e) =>
              setQuickProdutoForm((f) => ({ ...f, descricao: e.target.value }))
            }
            required
          />
          <Input
            label="Valor"
            type="number"
            step="0.01"
            min="0"
            value={quickProdutoForm.valor}
            onChange={(e) =>
              setQuickProdutoForm((f) => ({ ...f, valor: e.target.value }))
            }
            required
          />
        </form>
      </Modal>
    </div>
  )
}

export default OrcamentoForm

