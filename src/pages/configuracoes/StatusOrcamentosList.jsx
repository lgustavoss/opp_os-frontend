import { useState, useEffect, useCallback } from 'react'
import { Tags, Plus, Pencil, Trash2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Loading from '../../components/ui/Loading'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import Checkbox from '../../components/ui/Checkbox'
import { statusOrcamentoService } from '../../services/statusOrcamentoService'
import { usePermissoesModulos } from '../../hooks/usePermissoesModulos'
import { useToast } from '../../contexts/ToastContext'

const emptyForm = () => ({
  nome: '',
  ordem: '0',
  ativo: true,
  movimenta_estoque_saida: false,
})

const StatusOrcamentosList = () => {
  const perm = usePermissoesModulos()
  const toast = useToast()
  const podeConfig = perm.configuracoes_pode_configurar
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [formModal, setFormModal] = useState({ open: false, editing: null })
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteModal, setDeleteModal] = useState({ open: false, row: null })
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const list = await statusOrcamentoService.listAllOrdered()
      setItems(list)
    } catch (e) {
      console.error(e)
      toast.error('Não foi possível carregar os status de orçamentos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setForm(emptyForm())
    setFormModal({ open: true, editing: null })
  }

  const openEdit = (row) => {
    setForm({
      nome: row.nome || '',
      ordem: String(row.ordem ?? 0),
      ativo: Boolean(row.ativo),
      movimenta_estoque_saida: Boolean(row.movimenta_estoque_saida),
    })
    setFormModal({ open: true, editing: row })
  }

  const closeForm = () => {
    if (!saving) setFormModal({ open: false, editing: null })
  }

  const handleSubmitForm = async (e) => {
    e.preventDefault()
    const nome = (form.nome || '').trim()
    const ordem = parseInt(String(form.ordem).replace(/\D/g, ''), 10) || 0
    const outroStatusMovimentaEstoque = items.some(
      (item) => item.movimenta_estoque_saida && item.id !== formModal.editing?.id
    )
    if (!nome) {
      toast.warning('Informe o nome exibido.')
      return
    }
    if (form.movimenta_estoque_saida && outroStatusMovimentaEstoque) {
      toast.warning('Só é possível 1 status com movimentação automática de estoque.')
      return
    }
    try {
      setSaving(true)
      if (formModal.editing) {
        await statusOrcamentoService.update(formModal.editing.id, {
          nome,
          ordem,
          ativo: form.ativo,
          movimenta_estoque_saida: form.movimenta_estoque_saida,
        })
      } else {
        await statusOrcamentoService.create({
          nome,
          ordem,
          ativo: form.ativo,
          movimenta_estoque_saida: form.movimenta_estoque_saida,
        })
      }
      setFormModal({ open: false, editing: null })
      await load()
    } catch (err) {
      const d = err.response?.data
      const msg =
        (typeof d === 'object' &&
          (d.nome?.[0] ||
            d.movimenta_estoque_saida?.[0] ||
            d.non_field_errors?.[0] ||
            d.detail ||
            d.erro)) ||
        'Não foi possível salvar.'
      toast.error(typeof msg === 'string' ? msg : 'Não foi possível salvar.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    const row = deleteModal.row
    if (!row) return
    try {
      setDeleting(true)
      await statusOrcamentoService.delete(row.id)
      setDeleteModal({ open: false, row: null })
      await load()
    } catch (e) {
      const err = e.response?.data?.erro || e.response?.data?.detail
      toast.error(typeof err === 'string' ? err : 'Não foi possível excluir.')
    } finally {
      setDeleting(false)
    }
  }

  const colCount = podeConfig ? 5 : 4

  if (loading && items.length === 0) {
    return <Loading fullScreen />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
            <Tags className="w-8 h-8 text-primary-600" />
            Status de orçamentos
          </h1>
          <p className="text-secondary-600 mt-1 max-w-2xl">
            Defina os status para acompanhar os orçamentos e qual deles dispara a baixa automática de estoque.
          </p>
        </div>
        {podeConfig && (
          <Button variant="primary" type="button" onClick={openCreate} className="flex items-center gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            Novo status
          </Button>
        )}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b border-secondary-200 text-left text-secondary-600">
              <th className="py-3 px-2 font-medium w-16">Ordem</th>
              <th className="py-3 px-2 font-medium">Nome exibido</th>
              <th className="py-3 px-2 font-medium">Ativo</th>
              <th className="py-3 px-2 font-medium">Movimenta estoque</th>
              {podeConfig && <th className="py-3 px-2 font-medium text-right w-[120px]">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="py-10 text-center text-secondary-500">
                  Nenhum status cadastrado.
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id} className="border-b border-secondary-100">
                  <td className="py-3 px-2 text-secondary-800">{row.ordem}</td>
                  <td className="py-3 px-2 font-medium text-secondary-900">{row.nome}</td>
                  <td className="py-3 px-2">
                    <Badge variant={row.ativo ? 'success' : 'secondary'}>
                      {row.ativo ? 'Sim' : 'Não'}
                    </Badge>
                  </td>
                  <td className="py-3 px-2">
                    <Badge variant={row.movimenta_estoque_saida ? 'warning' : 'secondary'}>
                      {row.movimenta_estoque_saida ? 'Saída automática' : 'Não'}
                    </Badge>
                  </td>
                  {podeConfig && (
                    <td className="py-3 px-2 text-right">
                      <div className="flex justify-end gap-1">
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

      <Modal
        isOpen={formModal.open}
        onClose={closeForm}
        title={formModal.editing ? 'Editar status' : 'Novo status'}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={closeForm} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" form="form-status-orcamento" isLoading={saving}>
              Salvar
            </Button>
          </>
        }
      >
        <form id="form-status-orcamento" onSubmit={handleSubmitForm} className="space-y-4">
          <Input
            label="Nome exibido"
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            required
          />
          <Input
            label="Ordem na lista"
            type="number"
            min={0}
            value={form.ordem}
            onChange={(e) => setForm((f) => ({ ...f, ordem: e.target.value }))}
          />
          <Checkbox
            label="Ativo (aparece ao escolher status em orçamentos)"
            checked={form.ativo}
            onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))}
          />
          <Checkbox
            label="Movimenta estoque (saída automática ao aplicar este status)"
            checked={form.movimenta_estoque_saida}
            onChange={(e) => setForm((f) => ({ ...f, movimenta_estoque_saida: e.target.checked }))}
          />
        </form>
      </Modal>

      <Modal
        isOpen={deleteModal.open}
        onClose={() => !deleting && setDeleteModal({ open: false, row: null })}
        title="Excluir status"
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
          Excluir permanentemente o status <strong>{deleteModal.row?.nome}</strong>?
        </p>
        <p className="text-xs text-secondary-500 mt-2">
          Só é possível excluir se não houver orçamentos vinculados a este status.
        </p>
      </Modal>
    </div>
  )
}

export default StatusOrcamentosList
