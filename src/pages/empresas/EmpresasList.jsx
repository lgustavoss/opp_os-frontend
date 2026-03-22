import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Plus,
  Settings,
  Trash2,
  Check,
  Loader2,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Loading from '../../components/ui/Loading'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { configuracaoService } from '../../services/configuracaoService'
import { useAuth } from '../../contexts/AuthContext'
import { getEmpresaMenuLabel } from '../../utils/empresaDisplay'
import { applyCNPJCPFMask } from '../../utils/formatters'
import { usePermissoesModulos } from '../../hooks/usePermissoesModulos'

const EmpresasList = () => {
  const navigate = useNavigate()
  const { empresaAtual, setEmpresaAtual, checkAuth } = useAuth()
  const perm = usePermissoesModulos()
  const podeConfig = perm.configuracoes_pode_configurar
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)
  const [drafts, setDrafts] = useState({})
  const [savingId, setSavingId] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ open: false, empresa: null })
  const [deleting, setDeleting] = useState(false)

  const syncDraftsFromList = useCallback((list) => {
    const d = {}
    list.forEach((e) => {
      d[e.id] = e.nome_exibicao_menu ?? ''
    })
    setDrafts(d)
  }, [])

  const loadEmpresas = useCallback(async () => {
    try {
      setLoading(true)
      let page = 1
      let all = []
      let hasNext = true
      while (hasNext) {
        const data = await configuracaoService.list({ page })
        const chunk = data.results || []
        all = [...all, ...chunk]
        hasNext = Boolean(data.next)
        page += 1
      }
      setEmpresas(all)
      syncDraftsFromList(all)
    } catch (e) {
      console.error('Erro ao carregar empresas:', e)
      alert('Não foi possível carregar a lista de empresas.')
    } finally {
      setLoading(false)
    }
  }, [syncDraftsFromList])

  useEffect(() => {
    loadEmpresas()
  }, [loadEmpresas])

  const handleSaveMenuName = async (empresa) => {
    const id = empresa.id
    const nome_exibicao_menu = (drafts[id] ?? '').trim() || null
    try {
      setSavingId(id)
      await configuracaoService.update({
        id,
        nome_exibicao_menu: nome_exibicao_menu === '' ? '' : nome_exibicao_menu,
      })
      await checkAuth()
      await loadEmpresas()
    } catch (e) {
      console.error(e)
      const msg =
        e.response?.data?.nome_exibicao_menu?.join?.(', ') ||
        e.response?.data?.detail ||
        'Erro ao salvar nome de exibição.'
      alert(msg)
    } finally {
      setSavingId(null)
    }
  }

  const handleAbrirConfiguracoes = async (empresaId) => {
    try {
      await setEmpresaAtual(empresaId)
      navigate(`/empresas/${empresaId}/editar`)
    } catch (e) {
      console.error(e)
      alert('Não foi possível selecionar esta empresa.')
    }
  }

  const handleConfirmDelete = async () => {
    const emp = deleteModal.empresa
    if (!emp) return
    try {
      setDeleting(true)
      await configuracaoService.delete(emp.id)
      setDeleteModal({ open: false, empresa: null })
      await checkAuth()
      await loadEmpresas()
    } catch (e) {
      const err = e.response?.data?.erro || e.response?.data?.detail
      alert(
        typeof err === 'string'
          ? err
          : 'Não foi possível excluir. Verifique se não há orçamentos vinculados a esta empresa.'
      )
    } finally {
      setDeleting(false)
    }
  }

  const formatCnpjDisplay = (raw) => {
    if (!raw) return '—'
    const digits = String(raw).replace(/\D/g, '')
    if (digits.length === 14) return applyCNPJCPFMask(digits, 'CNPJ')
    return raw
  }

  if (loading && empresas.length === 0) {
    return <Loading fullScreen />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
            <Building2 className="w-8 h-8 text-primary-600" />
            Empresas
          </h1>
          <p className="text-secondary-600 mt-1">
            {podeConfig
              ? 'Defina o nome no menu do topo, use a engrenagem para dados completos (logomarca, CNPJ, textos de PDF) ou remova empresas sem orçamentos.'
              : 'Visualização das empresas. Para cadastrar ou alterar configurações, é necessário permissão de configuração.'}
          </p>
        </div>
        {podeConfig && (
          <div className="w-full sm:w-auto sm:shrink-0">
            <Button
              variant="primary"
              type="button"
              className="w-full sm:w-auto h-12 px-6 flex items-center justify-center gap-2"
              onClick={() => navigate('/empresas/nova')}
            >
              <Plus className="w-4 h-4 shrink-0" />
              Nova empresa
            </Button>
          </div>
        )}
      </div>

      <Card className="overflow-x-auto">
        <div className="min-w-[720px]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-secondary-200 text-left text-secondary-600">
                <th className="py-3 pr-4 font-medium w-[220px]">Nome no menu</th>
                <th className="py-3 pr-4 font-medium">Razão social</th>
                <th className="py-3 pr-4 font-medium">CNPJ</th>
                {podeConfig && (
                  <th className="py-3 pr-4 font-medium text-right w-[120px]">Ações</th>
                )}
              </tr>
            </thead>
            <tbody>
              {empresas.length === 0 ? (
                <tr>
                  <td
                    colSpan={podeConfig ? 4 : 3}
                    className="py-8 text-center text-secondary-500"
                  >
                    {podeConfig
                      ? 'Nenhuma empresa cadastrada. Clique em "Nova empresa".'
                      : 'Nenhuma empresa cadastrada.'}
                  </td>
                </tr>
              ) : (
                empresas.map((emp) => {
                  const isAtual = empresaAtual?.id === emp.id
                  const preview = getEmpresaMenuLabel({
                    ...emp,
                    nome_exibicao_menu:
                      drafts[emp.id] !== undefined ? drafts[emp.id] : emp.nome_exibicao_menu,
                  })
                  const previewSomenteLeitura = getEmpresaMenuLabel(emp)
                  return (
                    <tr key={emp.id} className="border-b border-secondary-100 align-top">
                      <td className="py-3 pr-4">
                        {podeConfig ? (
                          <div className="space-y-2">
                            <Input
                              type="text"
                              value={drafts[emp.id] ?? ''}
                              onChange={(e) =>
                                setDrafts((prev) => ({ ...prev, [emp.id]: e.target.value }))
                              }
                              placeholder={emp.nome_fantasia || emp.razao_social || 'Nome curto'}
                              className="text-sm"
                            />
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => handleSaveMenuName(emp)}
                                disabled={savingId === emp.id}
                                className="flex items-center gap-1"
                              >
                                {savingId === emp.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                                Salvar nome
                              </Button>
                              <span
                                className="text-xs text-secondary-500 truncate max-w-[180px]"
                                title={preview}
                              >
                                Menu: {preview}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-secondary-800">
                            <span className="text-secondary-500 text-xs block mb-0.5">
                              Nome no menu
                            </span>
                            {previewSomenteLeitura}
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-medium text-secondary-900">{emp.razao_social}</div>
                        {emp.nome_fantasia && (
                          <div className="text-secondary-500 text-xs mt-0.5">{emp.nome_fantasia}</div>
                        )}
                        {isAtual && (
                          <Badge variant="primary" className="mt-2">
                            Empresa atual
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap text-secondary-700">
                        {formatCnpjDisplay(emp.cnpj)}
                      </td>
                      {podeConfig && (
                        <td className="py-3 pr-4 text-right">
                          <div className="flex flex-row gap-2 justify-end items-center">
                            <button
                              type="button"
                              onClick={() => handleAbrirConfiguracoes(emp.id)}
                              className="p-2.5 rounded-lg border border-secondary-200 text-secondary-600 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 transition-colors"
                              title="Configurações da empresa"
                              aria-label={`Configurações: ${emp.razao_social}`}
                            >
                              <Settings className="w-5 h-5" />
                            </button>
                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              onClick={() => setDeleteModal({ open: true, empresa: emp })}
                              className="flex items-center justify-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Excluir
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={deleteModal.open}
        onClose={() => !deleting && setDeleteModal({ open: false, empresa: null })}
        title="Excluir empresa"
      >
        <p className="text-secondary-700 text-sm mb-4">
          Tem certeza que deseja excluir permanentemente a empresa{' '}
          <strong>{deleteModal.empresa?.razao_social}</strong>?
        </p>
        <p className="text-secondary-600 text-xs mb-4">
          Só é possível excluir se não houver orçamentos vinculados. Se for a empresa atual, ela será
          desmarcada do seu perfil.
        </p>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setDeleteModal({ open: false, empresa: null })}
            disabled={deleting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleConfirmDelete}
            disabled={deleting}
            isLoading={deleting}
          >
            Excluir
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default EmpresasList
