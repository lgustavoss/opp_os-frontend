import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Search,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  History,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Loading from '../../components/ui/Loading'
import Modal from '../../components/ui/Modal'
import { produtoService } from '../../services/produtoService'
import { API_PAGE_SIZE, API_MAX_PAGE_SIZE } from '../../config/api'
import {
  applyCurrencyMaskBRL,
  formatCurrency,
  formatDateTime,
  formatDecimalPtBR,
  parseCurrencyBRL,
} from '../../utils/formatters'
import { usePermissoesModulos } from '../../hooks/usePermissoesModulos'
import { useAuth } from '../../contexts/AuthContext'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100].filter((n) => n <= API_MAX_PAGE_SIZE)

const labelTipoMov = (t) =>
  ({ entrada: 'Entrada', saida: 'Saída', ajuste: 'Ajuste' }[t] || t || '—')

const labelOrigemMov = (o) =>
  ({ manual: 'Manual', status_orcamento: 'Orçamento' }[o] || o || '—')

const badgeTipoMovClass = (t) => {
  if (t === 'entrada') return 'hist-badge hist-badge--entrada'
  if (t === 'saida') return 'hist-badge hist-badge--saida'
  if (t === 'ajuste') return 'hist-badge hist-badge--ajuste'
  return 'hist-badge hist-badge--default'
}

const SortableTh = ({ label, sortKey, sortField, sortDir, onSort, className = '' }) => {
  const active = sortField === sortKey
  return (
    <th className={`py-3 px-2 font-medium ${className}`} scope="col">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="group inline-flex items-center gap-1 text-left text-secondary-700 hover:text-secondary-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
      >
        <span>{label}</span>
        {active ? (
          sortDir === 'asc' ? (
            <ArrowUp className="w-4 h-4 shrink-0 text-primary-600" aria-hidden />
          ) : (
            <ArrowDown className="w-4 h-4 shrink-0 text-primary-600" aria-hidden />
          )
        ) : (
          <ChevronsUpDown className="w-4 h-4 shrink-0 text-secondary-400 opacity-60 group-hover:opacity-100" aria-hidden />
        )}
      </button>
    </th>
  )
}

const emptyForm = () => ({
  descricao: '',
  valor: '',
  saldo_estoque: '0',
})

const ProdutosList = () => {
  const { empresaAtual } = useAuth()
  const perm = usePermissoesModulos()
  const podeCadastrar = perm.orcamentos_pode_cadastrar
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [formModal, setFormModal] = useState({ open: false, editing: null })
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteModal, setDeleteModal] = useState({ open: false, row: null })
  const [deleting, setDeleting] = useState(false)
  const [movModal, setMovModal] = useState({ open: false, row: null, tipo: 'entrada' })
  const [movForm, setMovForm] = useState({ quantidade: '', observacao: '' })
  const [moving, setMoving] = useState(false)
  const [pageSize, setPageSize] = useState(API_PAGE_SIZE)
  const [sortField, setSortField] = useState('codigo')
  const [sortDir, setSortDir] = useState('asc')
  const [histModal, setHistModal] = useState({
    open: false,
    row: null,
    items: [],
    loading: false,
  })

  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / pageSize))

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const params = {
        page,
        page_size: pageSize,
        ordering: sortDir === 'asc' ? sortField : `-${sortField}`,
      }
      if (search.trim()) params.search = search.trim()
      const data = await produtoService.list(params)
      setItems(data.results || [])
      setTotalCount(data.count ?? 0)
    } catch (e) {
      console.error(e)
      alert('Não foi possível carregar os produtos.')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, sortField, sortDir, empresaAtual?.id])

  useEffect(() => {
    setPage(1)
  }, [empresaAtual?.id])

  useEffect(() => {
    setFormModal({ open: false, editing: null })
    setDeleteModal({ open: false, row: null })
    setMovModal({ open: false, row: null, tipo: 'entrada' })
    setHistModal({ open: false, row: null, items: [], loading: false })
  }, [empresaAtual?.id])

  useEffect(() => {
    load()
  }, [load])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
    setPage(1)
  }

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, totalCount)

  const openCreate = () => {
    setForm(emptyForm())
    setFormModal({ open: true, editing: null })
  }

  const openEdit = (row) => {
    setForm({
      descricao: row.descricao || '',
      valor: row.valor != null ? formatCurrency(row.valor) : '',
      saldo_estoque: row.saldo_estoque != null ? String(row.saldo_estoque) : '0',
    })
    setFormModal({ open: true, editing: row })
  }

  const closeForm = () => {
    if (!saving) setFormModal({ open: false, editing: null })
  }

  const handleSubmitForm = async (e) => {
    e.preventDefault()
    const descricao = (form.descricao || '').trim()
    const valor = parseCurrencyBRL(form.valor)
    const saldoEstoque = parseFloat(String(form.saldo_estoque).replace(',', '.'))
    if (!descricao) {
      alert('Informe a descrição.')
      return
    }
    if (Number.isNaN(valor) || valor < 0) {
      alert('Informe um valor válido.')
      return
    }
    if (Number.isNaN(saldoEstoque) || saldoEstoque < 0) {
      alert('Informe um saldo de estoque válido.')
      return
    }
    try {
      setSaving(true)
      if (formModal.editing) {
        await produtoService.update(formModal.editing.codigo, {
          descricao,
          valor: valor.toFixed(2),
          saldo_estoque: saldoEstoque.toFixed(3),
        })
      } else {
        await produtoService.create({
          descricao,
          valor: valor.toFixed(2),
          saldo_estoque: saldoEstoque.toFixed(3),
        })
      }
      setFormModal({ open: false, editing: null })
      await load()
    } catch (err) {
      const d = err.response?.data
      const msg =
        (typeof d === 'object' &&
          (d.descricao?.[0] || d.valor?.[0] || d.saldo_estoque?.[0] || d.detail || d.erro)) ||
        'Não foi possível salvar.'
      alert(typeof msg === 'string' ? msg : 'Não foi possível salvar.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    const row = deleteModal.row
    if (!row) return
    try {
      setDeleting(true)
      await produtoService.delete(row.codigo)
      setDeleteModal({ open: false, row: null })
      await load()
    } catch (e) {
      const err = e.response?.data?.erro || e.response?.data?.detail
      alert(typeof err === 'string' ? err : 'Não foi possível excluir.')
    } finally {
      setDeleting(false)
    }
  }

  const applySearch = () => {
    setPage(1)
    setSearch(searchInput)
  }

  const openMovModal = (row, tipo) => {
    setMovForm({
      quantidade: '',
      observacao: tipo === 'entrada' ? 'Entrada manual de estoque.' : 'Saída manual de estoque.',
    })
    setMovModal({ open: true, row, tipo })
  }

  const openHistorico = async (row) => {
    setHistModal({ open: true, row, items: [], loading: true })
    try {
      const data = await produtoService.listMovimentacoes(row.codigo)
      setHistModal((m) => ({
        ...m,
        items: Array.isArray(data) ? data : [],
        loading: false,
      }))
    } catch (e) {
      console.error(e)
      alert('Não foi possível carregar o histórico de movimentações.')
      setHistModal((m) => ({ ...m, items: [], loading: false }))
    }
  }

  const closeHistorico = () => {
    setHistModal({ open: false, row: null, items: [], loading: false })
  }

  const handleSubmitMov = async (e) => {
    e.preventDefault()
    const qtd = parseFloat(String(movForm.quantidade).replace(',', '.'))
    if (Number.isNaN(qtd) || qtd <= 0) {
      alert('Informe uma quantidade válida.')
      return
    }
    try {
      setMoving(true)
      await produtoService.movimentarEstoque(movModal.row.codigo, {
        tipo: movModal.tipo,
        quantidade: qtd.toFixed(3),
        observacao: (movForm.observacao || '').trim(),
      })
      setMovModal({ open: false, row: null, tipo: 'entrada' })
      await load()
    } catch (err) {
      const d = err.response?.data
      const msg =
        (typeof d === 'object' && (d.quantidade?.[0] || d.tipo?.[0] || d.detail || d.erro)) ||
        'Não foi possível movimentar estoque.'
      alert(typeof msg === 'string' ? msg : 'Não foi possível movimentar estoque.')
    } finally {
      setMoving(false)
    }
  }

  const colCount = 5

  if (loading && items.length === 0) {
    return <Loading fullScreen />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
            <Package className="w-8 h-8 text-primary-600" />
            Produtos
          </h1>
          <p className="text-secondary-600 mt-1 max-w-2xl">
            Cadastro de produtos com controle de estoque: entrada, saída e ajuste direto de saldo.
          </p>
        </div>
        {podeCadastrar && (
          <Button variant="primary" type="button" onClick={openCreate} className="flex items-center gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            Novo produto
          </Button>
        )}
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <div className="flex-1 min-w-0">
            <Input
              label="Buscar"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
              placeholder="Descrição ou código..."
            />
          </div>
          <Button type="button" variant="secondary" onClick={applySearch} className="flex items-center gap-2 shrink-0">
            <Search className="w-4 h-4" />
            Buscar
          </Button>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-secondary-200 text-left text-secondary-600">
              <SortableTh
                label="Código"
                sortKey="codigo"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                className="w-24"
              />
              <SortableTh
                label="Descrição"
                sortKey="descricao"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortableTh
                label="Valor"
                sortKey="valor"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                className="w-36"
              />
              <SortableTh
                label="Saldo"
                sortKey="saldo_estoque"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                className="w-36"
              />
              <th className="py-3 px-2 font-medium text-right w-[260px]" scope="col">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="py-10 text-center text-secondary-500">
                  Nenhum produto encontrado.
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.codigo} className="border-b border-secondary-100">
                  <td className="py-3 px-2 text-secondary-800 font-mono">{row.codigo}</td>
                  <td className="py-3 px-2 font-medium text-secondary-900">{row.descricao}</td>
                  <td className="py-3 px-2 text-secondary-800">{formatCurrency(parseFloat(row.valor) || 0)}</td>
                  <td className="py-3 px-2 text-secondary-800 font-semibold tabular-nums">
                    {formatDecimalPtBR(row.saldo_estoque ?? 0, { minFrac: 0, maxFrac: 3 })}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="flex justify-end gap-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => openHistorico(row)}
                        className="p-2 rounded-lg hover:bg-secondary-100 text-secondary-700"
                        title="Histórico de movimentações"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      {podeCadastrar && (
                        <>
                          <button
                            type="button"
                            onClick={() => openMovModal(row, 'entrada')}
                            className="p-2 rounded-lg hover:bg-success-50 text-success-700"
                            title="Entrada de estoque"
                          >
                            <ArrowUpCircle className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openMovModal(row, 'saida')}
                            className="p-2 rounded-lg hover:bg-warning-50 text-warning-700"
                            title="Saída de estoque"
                          >
                            <ArrowDownCircle className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            className="p-2 rounded-lg hover:bg-secondary-100 text-secondary-600"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteModal({ open: true, row })}
                            className="p-2 rounded-lg hover:bg-danger-50 text-danger-600"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalCount > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-2 py-4 mt-2 border-t border-secondary-200">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-secondary-600">
              <span className="font-medium text-secondary-800">
                Página {page} de {totalPages}
              </span>
              <span className="text-secondary-500">
                {rangeStart}–{rangeEnd} de {totalCount}
              </span>
              <label className="inline-flex items-center gap-2 mt-1 sm:mt-0 sm:ml-2">
                <span className="text-secondary-500 whitespace-nowrap">Itens por página</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setPage(1)
                  }}
                  className="rounded-lg border border-secondary-300 bg-white px-2 py-1.5 text-sm text-secondary-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex items-center justify-center sm:justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal
        isOpen={formModal.open}
        onClose={closeForm}
        title={formModal.editing ? `Editar produto #${formModal.editing.codigo}` : 'Novo produto'}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={closeForm} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" form="form-produto" isLoading={saving}>
              Salvar
            </Button>
          </>
        }
      >
        <form id="form-produto" onSubmit={handleSubmitForm} className="grid gap-4">
          <Input
            label="Descrição"
            value={form.descricao}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            required
            placeholder="Descrição do produto"
          />
          <Input
            label="Valor"
            value={form.valor}
            onChange={(e) => {
              const masked = applyCurrencyMaskBRL(e.target.value)
              setForm((f) => ({ ...f, valor: masked }))
            }}
            inputMode="numeric"
            placeholder="R$ 0,00"
            className="text-right tabular-nums"
            required
          />
          <Input
            label="Saldo em estoque"
            type="number"
            step="0.001"
            min="0"
            value={form.saldo_estoque}
            onChange={(e) => setForm((f) => ({ ...f, saldo_estoque: e.target.value }))}
            className="text-right tabular-nums"
            required
          />
        </form>
      </Modal>

      <Modal
        isOpen={histModal.open}
        onClose={() => !histModal.loading && closeHistorico()}
        title="Histórico de estoque"
        size="xl"
        footer={
          <Button variant="secondary" type="button" onClick={closeHistorico} disabled={histModal.loading}>
            Fechar
          </Button>
        }
      >
        <div className="-mt-1 space-y-5">
          {histModal.row && (
            <div className="dm-hist-product-bar">
              <p className="text-xs font-medium uppercase tracking-wide text-secondary-400 mb-0.5">Produto</p>
              <p className="text-sm text-secondary-900">
                <span className="font-mono text-secondary-500 mr-2">#{histModal.row.codigo}</span>
                <span className="font-medium">{histModal.row.descricao}</span>
              </p>
            </div>
          )}

          {histModal.loading ? (
            <div className="dm-hist-loading">
              <Loading size="lg" />
              <span className="text-sm">Carregando movimentações…</span>
            </div>
          ) : histModal.items.length === 0 ? (
            <div className="dm-hist-empty">
              <History className="w-10 h-10 mx-auto text-secondary-300 mb-3" aria-hidden />
              <p className="text-sm font-medium text-secondary-700">Nenhuma movimentação ainda</p>
              <p className="text-xs text-secondary-500 mt-1 max-w-sm mx-auto">
                Entradas, saídas e ajustes deste produto na empresa atual aparecerão aqui.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-secondary-500">
                {histModal.items.length}{' '}
                {histModal.items.length === 1 ? 'registro' : 'registros'}
                <span className="text-secondary-400"> · mais recentes primeiro</span>
              </p>
              <ul className="space-y-3 max-h-[min(32rem,62vh)] overflow-y-auto pr-1 -mr-0.5 [scrollbar-width:thin]">
                {histModal.items.map((m) => (
                  <li
                    key={m.id}
                    className="dm-hist-card"
                  >
                    <div className="flex flex-wrap items-center gap-2 gap-y-1 justify-between">
                      <time
                        className="text-xs tabular-nums text-secondary-500 font-medium"
                        dateTime={m.data_registro || undefined}
                      >
                        {m.data_registro ? formatDateTime(m.data_registro) : '—'}
                      </time>
                      <span
                        className={badgeTipoMovClass(m.tipo)}
                      >
                        {labelTipoMov(m.tipo)}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="text-lg font-semibold tabular-nums text-secondary-900">
                        {formatDecimalPtBR(m.quantidade ?? 0, { minFrac: 0, maxFrac: 3 })}
                      </span>
                      <span className="text-sm text-secondary-400">un.</span>
                      <span className="text-secondary-300 mx-0.5 hidden sm:inline">·</span>
                      <span className="text-sm text-secondary-600">
                        Saldo{' '}
                        <span className="tabular-nums text-secondary-500">
                          {formatDecimalPtBR(m.saldo_anterior ?? 0, { minFrac: 0, maxFrac: 3 })}
                        </span>
                        <span className="text-secondary-400 mx-1">→</span>
                        <span className="tabular-nums font-semibold text-secondary-900">
                          {formatDecimalPtBR(m.saldo_posterior ?? 0, { minFrac: 0, maxFrac: 3 })}
                        </span>
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-secondary-500">
                      <span>{labelOrigemMov(m.origem)}</span>
                      {m.usuario_nome ? (
                        <>
                          <span className="text-secondary-300 hidden sm:inline">·</span>
                          <span className="truncate max-w-[200px]" title={m.usuario_nome}>
                            {m.usuario_nome}
                          </span>
                        </>
                      ) : null}
                      {m.orcamento ? (
                        <>
                          <span className="text-secondary-300 hidden sm:inline">·</span>
                          <Link
                            to={`/orcamentos/${m.orcamento}`}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                            onClick={closeHistorico}
                          >
                            Orç. {m.orcamento_numero || m.orcamento}
                          </Link>
                        </>
                      ) : null}
                      {m.status_orcamento_nome ? (
                        <>
                          <span className="text-secondary-300 hidden sm:inline">·</span>
                          <span className="truncate max-w-[160px]" title={m.status_orcamento_nome}>
                            {m.status_orcamento_nome}
                          </span>
                        </>
                      ) : null}
                    </div>

                    {(m.observacao || '').trim() ? (
                      <p className="mt-3 text-sm text-secondary-600 leading-relaxed border-t border-secondary-100 pt-3">
                        {m.observacao}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={movModal.open}
        onClose={() => !moving && setMovModal({ open: false, row: null, tipo: 'entrada' })}
        title={`${movModal.tipo === 'entrada' ? 'Entrada' : 'Saída'} de estoque`}
        footer={
          <>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setMovModal({ open: false, row: null, tipo: 'entrada' })}
              disabled={moving}
            >
              Cancelar
            </Button>
            <Button variant="primary" type="submit" form="form-mov-estoque" isLoading={moving}>
              Confirmar
            </Button>
          </>
        }
      >
        <form id="form-mov-estoque" onSubmit={handleSubmitMov} className="space-y-4">
          <p className="text-sm text-secondary-700">
            Produto <strong>#{movModal.row?.codigo}</strong> - {movModal.row?.descricao}
          </p>
          <Input
            label="Quantidade"
            type="number"
            step="0.001"
            min="0.001"
            value={movForm.quantidade}
            onChange={(e) => setMovForm((f) => ({ ...f, quantidade: e.target.value }))}
            required
          />
          <Input
            label="Observação"
            value={movForm.observacao}
            onChange={(e) => setMovForm((f) => ({ ...f, observacao: e.target.value }))}
          />
        </form>
      </Modal>

      <Modal
        isOpen={deleteModal.open}
        onClose={() => !deleting && setDeleteModal({ open: false, row: null })}
        title="Excluir produto"
        footer={
          <>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setDeleteModal({ open: false, row: null })}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button variant="danger" type="button" onClick={handleDelete} isLoading={deleting}>
              Excluir
            </Button>
          </>
        }
      >
        <p className="text-secondary-700 text-sm">
          Excluir o produto <strong>#{deleteModal.row?.codigo}</strong> — {deleteModal.row?.descricao}?
        </p>
        <p className="text-xs text-secondary-500 mt-2">
          Não é possível excluir se o produto estiver vinculado a algum item de orçamento.
        </p>
      </Modal>
    </div>
  )
}

export default ProdutosList
