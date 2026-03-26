import { useState, useEffect, useCallback } from 'react'
import { Package, Plus, Pencil, Trash2, Search, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Loading from '../../components/ui/Loading'
import Modal from '../../components/ui/Modal'
import { produtoService } from '../../services/produtoService'
import { API_PAGE_SIZE } from '../../config/api'
import { formatCurrency } from '../../utils/formatters'
import { usePermissoesModulos } from '../../hooks/usePermissoesModulos'

const emptyForm = () => ({
  descricao: '',
  valor: '',
  saldo_estoque: '0',
})

const ProdutosList = () => {
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

  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / API_PAGE_SIZE))

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const params = { page, page_size: API_PAGE_SIZE }
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
  }, [page, search])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setForm(emptyForm())
    setFormModal({ open: true, editing: null })
  }

  const openEdit = (row) => {
    setForm({
      descricao: row.descricao || '',
      valor: row.valor != null ? String(row.valor) : '',
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
    const valor = parseFloat(String(form.valor).replace(',', '.'))
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

  const colCount = podeCadastrar ? 5 : 4

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
              <th className="py-3 px-2 font-medium w-24">Código</th>
              <th className="py-3 px-2 font-medium">Descrição</th>
              <th className="py-3 px-2 font-medium w-36">Valor</th>
              <th className="py-3 px-2 font-medium w-36">Saldo</th>
              {podeCadastrar && <th className="py-3 px-2 font-medium text-right w-[220px]">Ações</th>}
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
                  <td className="py-3 px-2 text-secondary-800 font-semibold">{Number(row.saldo_estoque || 0).toFixed(3)}</td>
                  {podeCadastrar && (
                    <td className="py-3 px-2 text-right">
                      <div className="flex justify-end gap-1">
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
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <span className="self-center text-sm text-secondary-600">
            Página {page} de {totalPages}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      )}

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
        <form id="form-produto" onSubmit={handleSubmitForm} className="space-y-4">
          <Input
            label="Descrição"
            value={form.descricao}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            required
          />
          <Input
            label="Valor"
            type="number"
            step="0.01"
            min="0"
            value={form.valor}
            onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
            required
          />
          <Input
            label="Saldo em estoque"
            type="number"
            step="0.001"
            min="0"
            value={form.saldo_estoque}
            onChange={(e) => setForm((f) => ({ ...f, saldo_estoque: e.target.value }))}
            required
          />
        </form>
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
