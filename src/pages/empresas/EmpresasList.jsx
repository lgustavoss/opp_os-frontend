import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Plus, Settings, Trash2, Pencil } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Loading from '../../components/ui/Loading'
import Modal from '../../components/ui/Modal'
import { configuracaoService } from '../../services/configuracaoService'
import { useAuth } from '../../contexts/AuthContext'
import { getEmpresaMenuLabel } from '../../utils/empresaDisplay'
import { applyCNPJCPFMask } from '../../utils/formatters'
import { usePermissoesModulos } from '../../hooks/usePermissoesModulos'

const actionIconBtn =
  'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-transparent text-secondary-500 transition-colors hover:bg-secondary-100 hover:text-secondary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30'

const actionDangerBtn =
  `${actionIconBtn} hover:bg-red-50 hover:text-red-700 hover:border-red-100`

const EmpresasList = () => {
  const navigate = useNavigate()
  const { empresaAtual, setEmpresaAtual, checkAuth } = useAuth()
  const perm = usePermissoesModulos()
  const podeConfig = perm.configuracoes_pode_configurar
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ open: false, empresa: null })
  const [deleting, setDeleting] = useState(false)
  const [nomeModal, setNomeModal] = useState({ open: false, empresa: null })
  const [nomeDraft, setNomeDraft] = useState('')

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
    } catch (e) {
      console.error('Erro ao carregar empresas:', e)
      alert('Não foi possível carregar a lista de empresas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEmpresas()
  }, [loadEmpresas])

  const openNomeModal = (empresa) => {
    setNomeDraft(empresa.nome_exibicao_menu ?? '')
    setNomeModal({ open: true, empresa })
  }

  const closeNomeModal = () => {
    if (savingId != null) return
    setNomeModal({ open: false, empresa: null })
    setNomeDraft('')
  }

  const handleSaveNomeMenu = async () => {
    const emp = nomeModal.empresa
    if (!emp) return
    const nome_exibicao_menu = nomeDraft.trim() || null
    try {
      setSavingId(emp.id)
      await configuracaoService.update({
        id: emp.id,
        nome_exibicao_menu: nome_exibicao_menu === null ? '' : nome_exibicao_menu,
      })
      await checkAuth()
      await loadEmpresas()
      closeNomeModal()
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

  const previewNomeMenu =
    nomeModal.empresa &&
    getEmpresaMenuLabel({
      ...nomeModal.empresa,
      nome_exibicao_menu: nomeDraft,
    })

  if (loading && empresas.length === 0) {
    return <Loading fullScreen />
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-secondary-900 sm:text-3xl">
            Empresas
          </h1>
          <p className="max-w-xl text-sm text-secondary-500">
            {podeConfig
              ? 'Nome no menu, dados cadastrais e identidade nos PDFs. Use os atalhos ao lado de cada empresa.'
              : 'Lista das empresas do sistema. Alterações exigem permissão de configuração.'}
          </p>
        </div>
        {podeConfig && (
          <Button
            variant="primary"
            type="button"
            className="shrink-0 px-5 py-2.5 text-sm shadow-sm"
            onClick={() => navigate('/empresas/nova')}
          >
            <Plus className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
            Nova empresa
          </Button>
        )}
      </header>

      {empresas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-secondary-200 bg-secondary-50/40 px-6 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-secondary-100">
            <Building2 className="h-7 w-7 text-secondary-300" strokeWidth={1.5} />
          </div>
          <p className="text-base font-medium text-secondary-800">Nenhuma empresa cadastrada</p>
          <p className="mt-1 max-w-sm text-sm text-secondary-500">
            {podeConfig
              ? 'Cadastre a primeira empresa para usar orçamentos e documentos com os dados corretos.'
              : 'Entre em contato com um administrador para cadastrar empresas.'}
          </p>
          {podeConfig && (
            <Button
              variant="primary"
              type="button"
              className="mt-6 px-5 py-2.5 text-sm"
              onClick={() => navigate('/empresas/nova')}
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              Nova empresa
            </Button>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {empresas.map((emp) => {
            const isAtual = empresaAtual?.id === emp.id
            const tituloMenu = getEmpresaMenuLabel(emp)
            return (
              <li key={emp.id}>
                <Card className="overflow-hidden border-secondary-100/90 p-0 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {isAtual && (
                          <span className="inline-flex items-center rounded-full bg-primary-600 px-2.5 py-0.5 text-xs font-medium text-white shadow-sm">
                            Empresa atual
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-secondary-400">
                          Nome no menu
                        </p>
                        <p className="truncate text-lg font-semibold text-secondary-900" title={tituloMenu}>
                          {tituloMenu}
                        </p>
                      </div>
                      <div className="space-y-0.5 border-t border-secondary-100 pt-3 sm:border-0 sm:pt-0">
                        <p className="text-sm font-medium text-secondary-800">{emp.razao_social}</p>
                        {emp.nome_fantasia ? (
                          <p className="text-xs text-secondary-500">{emp.nome_fantasia}</p>
                        ) : null}
                        <p className="font-mono text-sm text-secondary-600">{formatCnpjDisplay(emp.cnpj)}</p>
                      </div>
                    </div>

                    {podeConfig && (
                      <div className="flex shrink-0 items-center justify-end gap-1 border-t border-secondary-100 pt-3 sm:border-0 sm:border-l sm:border-secondary-100 sm:pl-6 sm:pt-0">
                        <button
                          type="button"
                          className={actionIconBtn}
                          title="Alterar nome no menu"
                          aria-label={`Alterar nome no menu: ${tituloMenu}`}
                          onClick={() => openNomeModal(emp)}
                        >
                          <Pencil className="h-5 w-5" strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          className={actionIconBtn}
                          title="Dados completos e PDF"
                          aria-label={`Configurações: ${emp.razao_social}`}
                          onClick={() => handleAbrirConfiguracoes(emp.id)}
                        >
                          <Settings className="h-5 w-5" strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          className={actionDangerBtn}
                          title="Excluir empresa"
                          aria-label={`Excluir ${emp.razao_social}`}
                          onClick={() => setDeleteModal({ open: true, empresa: emp })}
                        >
                          <Trash2 className="h-5 w-5" strokeWidth={1.75} />
                        </button>
                      </div>
                    )}
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      <Modal
        isOpen={nomeModal.open}
        onClose={closeNomeModal}
        title="Nome no menu"
        footer={
          <>
            <Button type="button" variant="secondary" onClick={closeNomeModal} disabled={savingId != null}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSaveNomeMenu}
              disabled={savingId != null}
              isLoading={savingId != null}
            >
              Salvar
            </Button>
          </>
        }
      >
        <p className="mb-4 text-sm text-secondary-600">
          Texto curto exibido no seletor de empresa no topo. Se ficar vazio, usamos nome fantasia ou razão social.
        </p>
        <Input
          type="text"
          label="Nome de exibição"
          value={nomeDraft}
          onChange={(e) => setNomeDraft(e.target.value)}
          placeholder={nomeModal.empresa?.nome_fantasia || nomeModal.empresa?.razao_social || 'Ex.: Filial SP'}
        />
        {previewNomeMenu && (
          <p className="mt-3 text-xs text-secondary-500">
            Pré-visualização no menu:{' '}
            <span className="font-medium text-secondary-700">{previewNomeMenu}</span>
          </p>
        )}
      </Modal>

      <Modal
        isOpen={deleteModal.open}
        onClose={() => !deleting && setDeleteModal({ open: false, empresa: null })}
        title="Excluir empresa"
        footer={
          <>
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
          </>
        }
      >
        <p className="text-sm text-secondary-700">
          Excluir permanentemente <strong>{deleteModal.empresa?.razao_social}</strong>?
        </p>
        <p className="mt-3 text-xs text-secondary-500">
          Só é possível se não houver orçamentos vinculados. Se for a empresa atual, será desmarcada do seu perfil.
        </p>
      </Modal>
    </div>
  )
}

export default EmpresasList
