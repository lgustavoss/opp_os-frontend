import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useLocation, useNavigate, useParams, Link, Navigate } from 'react-router-dom'
import { Building2, Plus, Search, Loader2, ArrowLeft } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Loading from '../../components/ui/Loading'
import ImageCropModal from '../../components/common/ImageCropModal'
import { configuracaoService } from '../../services/configuracaoService'
import { clienteService } from '../../services/clienteService'
import { useAuth } from '../../contexts/AuthContext'
import {
  applyTelefoneMask,
  applyCNPJCPFMask,
  applyCEPMask,
  removeFormatting,
} from '../../utils/formatters'
import { getEmpresaMenuLabel } from '../../utils/empresaDisplay'

/** Dimensões do slot de selo no PDF (retrato), alinhadas ao backend */
function getSeloSlotCm(selosDims) {
  const d = selosDims || {}
  const largura_cm = Math.round((Number(d.largura_slot_aprox_cm) || 1.83) * 100) / 100
  const altura_cm =
    Math.round((Number(d.altura_alvo_cm ?? d.altura_cm) || 2.5) * 100) / 100
  return { largura_cm, altura_cm }
}

function buildEmptyEmpresaForm() {
  return {
    logomarca_url: '',
    logo_dimensoes_maximas: { largura_cm: 2.5, altura_cm: 2.5 },
    razao_social: '',
    nome_fantasia: '',
    nome_exibicao_menu: '',
    cnpj: '',
    inscricao_estadual: '',
    inscricao_municipal: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    telefone: '',
    celular: '',
    email: '',
    website: '',
    texto_selos_cabecalho_pdf: '',
    texto_rodape: '',
    observacoes_padrao: '',
    selo_certificacao_1_url: '',
    selo_certificacao_2_url: '',
    selo_certificacao_3_url: '',
    selo_dimensoes_maximas: {
      largura_cm: 1.75,
      altura_cm: 2.5,
      altura_alvo_cm: 2.5,
      largura_coluna_cm: 5.5,
      largura_slot_aprox_cm: 1.83,
      max_selos: 3,
      dica_pdf: '',
    },
    _semEmpresa: false,
  }
}

const EmpresaForm = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { id: editIdParam } = useParams()
  const isCreateMode = location.pathname === '/empresas/nova'
  const isEditMode = /^\/empresas\/\d+\/editar$/.test(location.pathname)
  const editId = isEditMode && editIdParam ? Number(editIdParam) : null
  const { setEmpresaAtual, checkAuth } = useAuth()
  const fileInputRef = useRef(null)
  const seloInputRefs = [useRef(null), useRef(null), useRef(null)]
  const [loading, setLoading] = useState(() => (isCreateMode ? false : true))
  const [saving, setSaving] = useState(false)
  const [logomarcaFile, setLogomarcaFile] = useState(null)
  const [logomarcaPreview, setLogomarcaPreview] = useState(null)
  const [seloFiles, setSeloFiles] = useState({ 1: null, 2: null, 3: null })
  const [seloPreviews, setSeloPreviews] = useState({ 1: null, 2: null, 3: null })
  /** Edição: marcam remoção no servidor ao salvar (não afeta cadastro novo). */
  const [removerLogomarcaPending, setRemoverLogomarcaPending] = useState(false)
  const [removerSeloPending, setRemoverSeloPending] = useState({ 1: false, 2: false, 3: false })
  const [formData, setFormData] = useState({
    logomarca_url: '',
    logo_dimensoes_maximas: { largura_cm: 2.5, altura_cm: 2.5 },
    razao_social: '',
    nome_fantasia: '',
    nome_exibicao_menu: '',
    cnpj: '',
    inscricao_estadual: '',
    inscricao_municipal: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    telefone: '',
    celular: '',
    email: '',
    website: '',
    texto_selos_cabecalho_pdf: '',
    texto_rodape: '',
    observacoes_padrao: '',
    selo_certificacao_1_url: '',
    selo_certificacao_2_url: '',
    selo_certificacao_3_url: '',
    selo_dimensoes_maximas: {
      largura_cm: 1.75,
      altura_cm: 2.5,
      altura_alvo_cm: 2.5,
      largura_coluna_cm: 5.5,
      largura_slot_aprox_cm: 1.83,
      max_selos: 3,
      dica_pdf: '',
    },
  })
  const [errors, setErrors] = useState({})
  const [logomarcaLoadError, setLogomarcaLoadError] = useState(false)
  /** Recorte de logomarca ou selo (mesmo modal, dimensões diferentes) */
  const [imageCrop, setImageCrop] = useState({
    open: false,
    target: 'logo',
    seloSlot: null,
    src: null,
    fileName: 'logo.png',
  })

  const seloSlotCm = useMemo(
    () => getSeloSlotCm(formData.selo_dimensoes_maximas),
    [formData.selo_dimensoes_maximas],
  )
  const [consultingCNPJ, setConsultingCNPJ] = useState(false)

  const getLogomarcaSrc = (url) => {
    if (!url) return null
    if (url.startsWith('/media/')) return url
    const match = url.match(/\/media\/.+$/)
    return match ? match[0] : url
  }

  const loadEmpresaById = useCallback(async (id) => {
    try {
      setLoading(true)
      setLogomarcaLoadError(false)
      const data = await configuracaoService.getById(id)
      if (data) {
        setRemoverLogomarcaPending(false)
        setRemoverSeloPending({ 1: false, 2: false, 3: false })
        setFormData({
          ...data,
          _semEmpresa: false,
          cnpj: data.cnpj ? applyCNPJCPFMask(data.cnpj, 'CNPJ') : '',
          cep: data.cep ? applyCEPMask(data.cep) : '',
          telefone: data.telefone ? applyTelefoneMask(data.telefone) : '',
          celular: data.celular ? applyTelefoneMask(data.celular) : '',
        })
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setFormData((prev) => ({ ...prev, _semEmpresa: true }))
      }
      console.error('Erro ao carregar empresa:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isCreateMode) {
      setFormData(buildEmptyEmpresaForm())
      setLogomarcaFile(null)
      setLogomarcaPreview(null)
      setSeloFiles({ 1: null, 2: null, 3: null })
      setSeloPreviews({ 1: null, 2: null, 3: null })
      setRemoverLogomarcaPending(false)
      setRemoverSeloPending({ 1: false, 2: false, 3: false })
      seloInputRefs.forEach((r) => {
        if (r.current) r.current.value = ''
      })
      setLogomarcaLoadError(false)
      setErrors({})
      setLoading(false)
      return
    }
    if (isEditMode && editId) {
      loadEmpresaById(editId)
      return
    }
    setLoading(false)
    // seloInputRefs é estável (refs); não deve disparar reexecução do efeito
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreateMode, isEditMode, editId, loadEmpresaById])

  const handleLogomarcaChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setRemoverLogomarcaPending(false)
      if (!file.type.startsWith('image/')) {
        alert('Selecione um arquivo de imagem (PNG, JPG, etc.)')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setImageCrop({
          open: true,
          target: 'logo',
          seloSlot: null,
          src: reader.result,
          fileName: file.name || 'logo.png',
        })
      }
      reader.readAsDataURL(file)
    } else {
      setLogomarcaFile(null)
      setLogomarcaPreview(null)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleImageCropConfirm = (croppedFile) => {
    if (imageCrop.target === 'logo') {
      setRemoverLogomarcaPending(false)
      setLogomarcaFile(croppedFile)
      const reader = new FileReader()
      reader.onloadend = () => setLogomarcaPreview(reader.result)
      reader.readAsDataURL(croppedFile)
    } else if (imageCrop.target === 'selo' && imageCrop.seloSlot != null) {
      const slot = imageCrop.seloSlot
      setSeloFiles((prev) => ({ ...prev, [slot]: croppedFile }))
      const reader = new FileReader()
      reader.onloadend = () =>
        setSeloPreviews((prev) => ({ ...prev, [slot]: reader.result }))
      reader.readAsDataURL(croppedFile)
    }
    setImageCrop((s) => ({ ...s, open: false, src: null }))
  }

  const handleRemoverLogomarca = () => {
    setLogomarcaFile(null)
    setLogomarcaPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (isEditMode && (formData.logomarca_url || formData.logomarca)) {
      setRemoverLogomarcaPending(true)
    } else {
      setRemoverLogomarcaPending(false)
    }
  }

  const handleSeloChange = (slot, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setRemoverSeloPending((prev) => ({ ...prev, [slot]: false }))
    if (!file.type.startsWith('image/')) {
      alert('Selecione um arquivo de imagem (PNG, JPG ou GIF).')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setImageCrop({
        open: true,
        target: 'selo',
        seloSlot: slot,
        src: reader.result,
        fileName: file.name || `selo-${slot}.png`,
      })
    }
    reader.readAsDataURL(file)
    if (e.target) e.target.value = ''
  }

  const handleRemoverSelo = (slot) => {
    if (seloFiles[slot]) {
      setSeloFiles((prev) => ({ ...prev, [slot]: null }))
      setSeloPreviews((prev) => ({ ...prev, [slot]: null }))
      const ref = seloInputRefs[slot - 1]
      if (ref?.current) ref.current.value = ''
      return
    }
    const urlKey = `selo_certificacao_${slot}_url`
    if (isEditMode && formData[urlKey]) {
      setRemoverSeloPending((prev) => ({ ...prev, [slot]: true }))
    }
  }

  const buildUploadFileMap = () => {
    const m = {}
    if (logomarcaFile) m.logomarca = logomarcaFile
    ;[1, 2, 3].forEach((i) => {
      if (seloFiles[i]) m[`selo_certificacao_${i}`] = seloFiles[i]
    })
    return m
  }

  const buildRemoverPayload = () => {
    const p = {}
    if (isEditMode && removerLogomarcaPending && !logomarcaFile) {
      p.remover_logomarca = true
    }
    for (const i of [1, 2, 3]) {
      if (isEditMode && removerSeloPending[i] && !seloFiles[i]) {
        p[`remover_selo_certificacao_${i}`] = true
      }
    }
    return p
  }

  const handleConsultarCNPJ = async () => {
    const cnpj = removeFormatting(formData.cnpj || '')
    if (cnpj.length !== 14) {
      alert('Informe um CNPJ com 14 dígitos para buscar os dados da empresa.')
      return
    }
    try {
      setConsultingCNPJ(true)
      const data = await clienteService.consultarCNPJ(cnpj)
      const cnpjFormatted = data.cnpj_cpf
        ? applyCNPJCPFMask(data.cnpj_cpf, 'CNPJ')
        : formData.cnpj
      const telefoneFormatted = data.telefone
        ? applyTelefoneMask(data.telefone)
        : formData.telefone
      const cepFormatted = data.cep ? applyCEPMask(data.cep) : formData.cep

      setFormData((prev) => ({
        ...prev,
        cnpj: cnpjFormatted,
        razao_social: data.razao_social || prev.razao_social,
        nome_fantasia: data.nome_fantasia || prev.nome_fantasia,
        telefone: telefoneFormatted,
        endereco: data.endereco || prev.endereco,
        cep: cepFormatted,
        cidade: data.cidade || prev.cidade,
        estado: data.estado || prev.estado,
      }))
    } catch (error) {
      alert(
        error.response?.data?.erro ||
          error.response?.data?.detail ||
          'Erro ao consultar CNPJ. Tente novamente.'
      )
    } finally {
      setConsultingCNPJ(false)
    }
  }

  const normalizeWebsite = (url) => {
    const trimmed = (url || '').trim()
    if (!trimmed) return ''
    if (/^https?:\/\//i.test(trimmed)) return trimmed
    return `https://${trimmed}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setSaving(true)

    try {
      if (isCreateMode) {
        const cnpjDigits = removeFormatting(formData.cnpj || '')
        const cepDigits = removeFormatting(formData.cep || '')
        const nextErrors = {}
        if (cnpjDigits.length !== 14) {
          nextErrors.cnpj = ['Informe um CNPJ válido com 14 dígitos.']
        }
        if (!formData.razao_social?.trim()) {
          nextErrors.razao_social = ['Informe a razão social.']
        }
        if (!formData.endereco?.trim()) {
          nextErrors.endereco = ['Informe o endereço.']
        }
        if (!formData.cidade?.trim()) {
          nextErrors.cidade = ['Informe a cidade.']
        }
        const uf = (formData.estado || '').trim().toUpperCase()
        if (!uf || uf.length !== 2) {
          nextErrors.estado = ['Informe a UF com 2 letras.']
        }
        if (cepDigits.replace(/\D/g, '').length < 8) {
          nextErrors.cep = ['Informe um CEP válido.']
        }
        if (Object.keys(nextErrors).length) {
          setErrors(nextErrors)
          setSaving(false)
          return
        }

        const payload = {
          razao_social: formData.razao_social.trim(),
          nome_fantasia: (formData.nome_fantasia || '').trim(),
          nome_exibicao_menu: (formData.nome_exibicao_menu || '').trim(),
          cnpj: cnpjDigits,
          inscricao_estadual: (formData.inscricao_estadual || '').trim(),
          inscricao_municipal: (formData.inscricao_municipal || '').trim(),
          endereco: formData.endereco.trim(),
          numero: (formData.numero || '').trim(),
          complemento: (formData.complemento || '').trim(),
          bairro: (formData.bairro || '').trim(),
          cidade: formData.cidade.trim(),
          estado: uf,
          cep: cepDigits,
          telefone: removeFormatting(formData.telefone || ''),
          celular: removeFormatting(formData.celular || ''),
          email: (formData.email || '').trim(),
          website: normalizeWebsite(formData.website),
          texto_selos_cabecalho_pdf: (formData.texto_selos_cabecalho_pdf || '').trim().slice(0, 400),
          texto_rodape: formData.texto_rodape || '',
          observacoes_padrao: formData.observacoes_padrao || '',
        }

        const nova = await configuracaoService.create(payload)
        if (!nova?.id) {
          throw new Error('Resposta da API sem ID da empresa.')
        }
        const uploadMap = buildUploadFileMap()
        if (Object.keys(uploadMap).length) {
          await configuracaoService.update({ id: nova.id, ...payload }, uploadMap)
        }
        await setEmpresaAtual(nova.id)
        await checkAuth()
        alert('Empresa cadastrada com sucesso!')
        setLogomarcaFile(null)
        setLogomarcaPreview(null)
        setSeloFiles({ 1: null, 2: null, 3: null })
        setSeloPreviews({ 1: null, 2: null, 3: null })
        seloInputRefs.forEach((r) => {
          if (r.current) r.current.value = ''
        })
        if (fileInputRef.current) fileInputRef.current.value = ''
        navigate('/empresas', { replace: true })
        return
      }

      const dataToSend = {
        ...formData,
        cnpj: removeFormatting(formData.cnpj || ''),
        cep: removeFormatting(formData.cep || ''),
        telefone: removeFormatting(formData.telefone || ''),
        celular: removeFormatting(formData.celular || ''),
        website: normalizeWebsite(formData.website),
      }
      const uploadMap = buildUploadFileMap()
      const removerPayload = buildRemoverPayload()
      await configuracaoService.update(
        { ...dataToSend, ...removerPayload },
        Object.keys(uploadMap).length ? uploadMap : null
      )
      alert('Alterações salvas com sucesso!')
      setLogomarcaFile(null)
      setLogomarcaPreview(null)
      setRemoverLogomarcaPending(false)
      setRemoverSeloPending({ 1: false, 2: false, 3: false })
      setSeloFiles({ 1: null, 2: null, 3: null })
      setSeloPreviews({ 1: null, 2: null, 3: null })
      seloInputRefs.forEach((r) => {
        if (r.current) r.current.value = ''
      })
      setLogomarcaLoadError(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await checkAuth()
      if (isEditMode && editId) {
        await loadEmpresaById(editId)
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      const msg = error.response?.data?.logomarca
        ? (Array.isArray(error.response.data.logomarca)
            ? error.response.data.logomarca.join(', ')
            : error.response.data.logomarca)
        : error.response?.data?.detail
        ? (typeof error.response.data.detail === 'string'
            ? error.response.data.detail
            : JSON.stringify(error.response.data.detail))
        : error.response?.data
        ? Object.entries(error.response.data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join('\n')
        : error.message || 'Erro ao salvar configurações.'
      alert(msg)
      if (error.response?.data && typeof error.response.data === 'object') {
        setErrors(error.response.data)
      }
    } finally {
      setSaving(false)
    }
  }

  if (location.pathname.includes('/editar') && editIdParam && !isEditMode) {
    return <Navigate to="/empresas" replace />
  }

  if (loading) {
    return <Loading fullScreen />
  }

  if (isEditMode && !loading && formData._semEmpresa) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-secondary-900">Empresa não encontrada</h1>
        <Card>
          <p className="text-secondary-600 mb-4">
            Não foi possível carregar esta empresa. Verifique o link ou volte à lista.
          </p>
          <Link to="/empresas">
            <Button type="button" variant="primary">
              Voltar para empresas
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-28 md:pb-32">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <button
            type="button"
            onClick={() => navigate('/empresas')}
            className="p-2 rounded-lg hover:bg-secondary-100 transition-colors self-start"
            aria-label="Voltar à lista de empresas"
          >
            <ArrowLeft className="w-5 h-5 text-secondary-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">
              {isCreateMode ? 'Nova empresa' : 'Editar empresa'}
            </h1>
            <p className="text-secondary-600 mt-1">
              {isCreateMode
                ? 'Preencha os dados abaixo. A empresa só será cadastrada ao clicar em Cadastrar empresa.'
                : 'Logomarca, dados cadastrais e textos padrão dos orçamentos (PDF).'}
            </p>
            {isEditMode && formData.razao_social && (
              <p className="text-sm font-medium text-primary-700 mt-2">
                {getEmpresaMenuLabel(formData)}
              </p>
            )}
          </div>
        </div>
        {isEditMode && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => navigate('/empresas/nova')}
            className="flex items-center gap-2 self-start shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nova empresa
          </Button>
        )}
      </div>

      {isCreateMode ? (
        <Card className="bg-primary-50 border-primary-200">
          <p className="text-sm text-secondary-800">
            Campos com <span className="text-danger-500 font-semibold">*</span> são obrigatórios. Use a{' '}
            <strong>lupa</strong> no CNPJ para buscar dados na ReceitaWS. Você pode cancelar voltando à{' '}
            <Link to="/empresas" className="text-primary-700 font-medium underline">
              lista de empresas
            </Link>
            .
          </p>
        </Card>
      ) : (
        <Card className="bg-secondary-50 border-secondary-200">
          <div className="flex flex-wrap items-center gap-2 text-sm text-secondary-700">
            <Building2 className="w-4 h-4 text-primary-600 shrink-0" />
            <span>
              Dica: o <strong>nome no menu</strong> do topo também pode ser ajustado na{' '}
              <Link to="/empresas" className="text-primary-600 font-medium hover:underline">
                lista de empresas
              </Link>
              .
            </span>
          </div>
        </Card>
      )}

      <Card>
        <form id="form-empresa" onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">
            Logomarca
          </h2>
          <p className="text-sm text-secondary-500 mb-4">
            A logomarca será exibida no canto superior esquerdo do PDF do orçamento, em até{' '}
            {formData.logo_dimensoes_maximas?.largura_cm ?? 2.5} cm × {formData.logo_dimensoes_maximas?.altura_cm ?? 2.5} cm.
            Formatos aceitos: PNG, JPG, GIF, WebP.
          </p>

          {logomarcaFile ? (
            <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg text-sm text-primary-800">
              Nova imagem selecionada. Clique em &quot;Salvar Configurações&quot; para enviar.
            </div>
          ) : isEditMode && removerLogomarcaPending ? (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
              A logomarca cadastrada será <strong>removida</strong> ao salvar.
            </div>
          ) : (formData.logomarca || formData.logomarca_url) ? (
            <div className="mb-4 p-3 bg-success-50 border border-success-200 rounded-lg text-sm text-success-800">
              Logomarca cadastrada. Ela aparecerá nos orçamentos em PDF.
            </div>
          ) : (
            <div className="mb-4 p-3 bg-secondary-50 border border-secondary-200 rounded-lg text-sm text-secondary-600">
              Nenhuma logomarca cadastrada. Selecione uma imagem e salve.
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="flex flex-col items-start gap-3">
              {(logomarcaPreview ||
                (!removerLogomarcaPending && (formData.logomarca_url || formData.logomarca))) &&
              !logomarcaLoadError ? (
                <div className="flex flex-col gap-1">
                  <div
                    className="border border-secondary-200 rounded-lg overflow-hidden bg-white flex items-center justify-center p-2"
                    style={{
                      width: 94,
                      height: 94,
                    }}
                    title={`Tamanho no PDF: ${formData.logo_dimensoes_maximas?.largura_cm ?? 2.5} × ${formData.logo_dimensoes_maximas?.altura_cm ?? 2.5} cm`}
                  >
                    <img
                      src={logomarcaPreview || getLogomarcaSrc(formData.logomarca_url) || formData.logomarca}
                      alt="Logomarca da empresa"
                      className="max-w-full max-h-full object-contain"
                      onError={() => setLogomarcaLoadError(true)}
                    />
                  </div>
                  <span className="text-xs text-secondary-500">
                    Preview: {formData.logo_dimensoes_maximas?.largura_cm ?? 2.5} × {formData.logo_dimensoes_maximas?.altura_cm ?? 2.5} cm no PDF
                  </span>
                </div>
              ) : !removerLogomarcaPending && (formData.logomarca || formData.logomarca_url) && logomarcaLoadError ? (
                <div className="w-[94px] h-[94px] border border-danger-200 rounded-lg bg-danger-50 flex items-center justify-center p-2 text-center text-sm text-danger-600">
                  Falha ao carregar imagem. Verifique se o arquivo existe no servidor.
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogomarcaChange}
                  className="hidden"
                  data-testid="logomarca-input"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setLogomarcaLoadError(false)
                    fileInputRef.current?.click()
                  }}
                >
                  {logomarcaPreview ||
                  (!removerLogomarcaPending && (formData.logomarca_url || formData.logomarca))
                    ? 'Trocar imagem'
                    : 'Selecionar imagem'}
                </Button>
                {(logomarcaPreview ||
                  (!removerLogomarcaPending && (formData.logomarca_url || formData.logomarca))) && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleRemoverLogomarca}
                  >
                    {isEditMode && (formData.logomarca_url || formData.logomarca) && !logomarcaFile
                      ? 'Remover do servidor'
                      : 'Remover'}
                  </Button>
                )}
                {isEditMode && removerLogomarcaPending && !logomarcaFile ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setRemoverLogomarcaPending(false)}
                  >
                    Desfazer remoção
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="border-t border-secondary-200 pt-6 mt-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-2">
              Selos / certificações no PDF
            </h2>
            <p className="text-sm text-secondary-600 mb-3">
              Até <strong>{formData.selo_dimensoes_maximas?.max_selos ?? 3} imagens</strong> no canto superior direito do
              orçamento (ex.: certificações). Cada selo usa um espaço <strong>retrato</strong> de aproximadamente{' '}
              <strong>
                {seloSlotCm.largura_cm} cm × {seloSlotCm.altura_cm} cm
              </strong>{' '}
              no PDF — o recorte ao importar usa <strong>a mesma proporção</strong>. Há imagem de selo: o texto
              alternativo abaixo não aparece no PDF. Formatos: PNG, JPG, GIF.
            </p>
            {(formData.selo_dimensoes_maximas?.dica_pdf || '').trim() ? (
              <p className="text-xs text-secondary-500 mb-4 leading-relaxed">
                {formData.selo_dimensoes_maximas.dica_pdf}
              </p>
            ) : (
              <p className="text-xs text-secondary-500 mb-4">
                Evite artes muito horizontais: no PDF elas encolhem para caber na largura do slot.
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {[1, 2, 3].map((slot) => {
                const urlKey = `selo_certificacao_${slot}_url`
                const curUrl = formData[urlKey]
                const preview = seloPreviews[slot]
                const imgSrc =
                  preview ||
                  (!removerSeloPending[slot] && curUrl ? getLogomarcaSrc(curUrl) : null)
                const temSeloServidor = isEditMode && !!curUrl
                return (
                  <div key={slot} className="border border-secondary-200 rounded-lg p-3 space-y-2">
                    <div>
                      <p className="text-sm font-medium text-secondary-800">Selo {slot}</p>
                      <p className="text-xs text-secondary-500 mt-0.5">
                        Slot no PDF: {seloSlotCm.largura_cm} × {seloSlotCm.altura_cm} cm (retrato)
                      </p>
                    </div>
                    {isEditMode && removerSeloPending[slot] && !seloFiles[slot] ? (
                      <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
                        Selo será <strong>removido</strong> ao salvar.
                      </div>
                    ) : null}
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="border border-secondary-200 rounded-lg overflow-hidden bg-white flex items-center justify-center p-1 shrink-0 w-[5.5rem]"
                        style={{
                          aspectRatio: seloSlotCm.largura_cm / seloSlotCm.altura_cm,
                        }}
                        title={`Proporção do slot no PDF: ${seloSlotCm.largura_cm} × ${seloSlotCm.altura_cm} cm (selo ${slot})`}
                      >
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={`Selo ${slot}`}
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <span className="text-xs text-secondary-400 text-center px-1">Opcional</span>
                        )}
                      </div>
                      <span className="text-xs text-secondary-500 text-center">
                        Preview: {seloSlotCm.largura_cm} × {seloSlotCm.altura_cm} cm
                      </span>
                    </div>
                    <input
                      ref={seloInputRefs[slot - 1]}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/gif"
                      className="hidden"
                      onChange={(e) => handleSeloChange(slot, e)}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => seloInputRefs[slot - 1].current?.click()}
                      >
                        {imgSrc ? 'Trocar imagem' : 'Selecionar'}
                      </Button>
                      {seloFiles[slot] ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleRemoverSelo(slot)}
                        >
                          Descartar novo arquivo
                        </Button>
                      ) : null}
                      {temSeloServidor && !removerSeloPending[slot] ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleRemoverSelo(slot)}
                        >
                          Remover do servidor
                        </Button>
                      ) : null}
                      {isEditMode && removerSeloPending[slot] && !seloFiles[slot] ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setRemoverSeloPending((prev) => ({ ...prev, [slot]: false }))}
                        >
                          Desfazer remoção
                        </Button>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>

            <label htmlFor="texto_selos_cabecalho_pdf" className="block text-sm font-medium text-secondary-700 mb-2">
              Texto no cabeçalho (se não houver imagens de selo)
            </label>
            <textarea
              id="texto_selos_cabecalho_pdf"
              value={formData.texto_selos_cabecalho_pdf || ''}
              onChange={(e) =>
                setFormData({ ...formData, texto_selos_cabecalho_pdf: e.target.value.slice(0, 400) })
              }
              rows={3}
              maxLength={400}
              placeholder="Ex.: Empresa certificada conforme normas NCC / ISO..."
              className="input-base w-full min-h-[5rem] resize-y"
            />
            <p className="text-xs text-secondary-500 mt-1 mb-0">
              Máximo 400 caracteres. Não aparece se existir pelo menos uma imagem de selo enviada.
            </p>
          </div>

          <h2 className="text-lg font-semibold text-secondary-900 mt-8 mb-4">
            Dados da Empresa
          </h2>
          <p className="text-sm text-secondary-500 mb-2">
            Digite o CNPJ e clique na <strong>lupa</strong> para preencher razão social, nome fantasia, endereço e contato a partir da ReceitaWS (dados públicos).
          </p>
          <p className="text-xs text-secondary-500 mb-4">
            <span className="text-danger-500 font-semibold">*</span> Campo obrigatório
          </p>

          <div className="w-full mb-4">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              CNPJ (para busca)
              <span className="text-danger-500 ml-1">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.cnpj}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cnpj: applyCNPJCPFMask(e.target.value, 'CNPJ'),
                  })
                }
                maxLength={18}
                placeholder="00.000.000/0000-00"
                required
                aria-required="true"
                className={`
                  input-base w-full pr-11
                  ${errors.cnpj ? 'border-danger-500 focus:ring-danger-500' : ''}
                `}
                aria-describedby={errors.cnpj ? 'cnpj-busca-error' : undefined}
              />
              <button
                type="button"
                onClick={handleConsultarCNPJ}
                disabled={consultingCNPJ}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-md text-secondary-500 hover:text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                title="Buscar dados da empresa na ReceitaWS"
                aria-label="Buscar dados da empresa pelo CNPJ"
              >
                {consultingCNPJ ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.cnpj && (
              <p id="cnpj-busca-error" className="mt-1 text-sm text-danger-600">
                {Array.isArray(errors.cnpj) ? errors.cnpj.join(', ') : errors.cnpj}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Razão Social"
              type="text"
              value={formData.razao_social}
              onChange={(e) =>
                setFormData({ ...formData, razao_social: e.target.value })
              }
              required
              error={errors.razao_social}
            />
            <Input
              label="Nome Fantasia"
              type="text"
              value={formData.nome_fantasia}
              onChange={(e) =>
                setFormData({ ...formData, nome_fantasia: e.target.value })
              }
              error={errors.nome_fantasia}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome de exibição no menu"
              type="text"
              value={formData.nome_exibicao_menu ?? ''}
              onChange={(e) =>
                setFormData({ ...formData, nome_exibicao_menu: e.target.value })
              }
              helperText="Nome curto no seletor de empresa (topo). Se vazio, usa nome fantasia ou razão social."
              error={errors.nome_exibicao_menu}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Inscrição Estadual"
              type="text"
              value={formData.inscricao_estadual}
              onChange={(e) =>
                setFormData({ ...formData, inscricao_estadual: e.target.value })
              }
              error={errors.inscricao_estadual}
            />
            <Input
              label="Inscrição Municipal"
              type="text"
              value={formData.inscricao_municipal}
              onChange={(e) =>
                setFormData({ ...formData, inscricao_municipal: e.target.value })
              }
              error={errors.inscricao_municipal}
            />
          </div>

          <h2 className="text-lg font-semibold text-secondary-900 mt-8 mb-4">
            Endereço
          </h2>
          <p className="text-xs text-secondary-500 mb-4">
            <span className="text-danger-500 font-semibold">*</span> Endereço, cidade, UF e CEP são obrigatórios.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Endereço"
                type="text"
                value={formData.endereco}
                onChange={(e) =>
                  setFormData({ ...formData, endereco: e.target.value })
                }
                required
                error={errors.endereco}
              />
            </div>
            <Input
              label="Número"
              type="text"
              value={formData.numero}
              onChange={(e) =>
                setFormData({ ...formData, numero: e.target.value })
              }
              error={errors.numero}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Complemento"
              type="text"
              value={formData.complemento}
              onChange={(e) =>
                setFormData({ ...formData, complemento: e.target.value })
              }
              error={errors.complemento}
            />
            <Input
              label="Bairro"
              type="text"
              value={formData.bairro}
              onChange={(e) =>
                setFormData({ ...formData, bairro: e.target.value })
              }
              error={errors.bairro}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Cidade"
              type="text"
              value={formData.cidade}
              onChange={(e) =>
                setFormData({ ...formData, cidade: e.target.value })
              }
              required
              error={errors.cidade}
            />
            <Input
              label="Estado (UF)"
              type="text"
              value={formData.estado}
              onChange={(e) =>
                setFormData({ ...formData, estado: e.target.value.toUpperCase() })
              }
              maxLength={2}
              placeholder="Ex.: SP"
              required
              error={errors.estado}
            />
            <Input
              label="CEP"
              type="text"
              value={formData.cep}
              onChange={(e) =>
                setFormData({ ...formData, cep: applyCEPMask(e.target.value) })
              }
              placeholder="00000-000"
              maxLength={9}
              required
              error={errors.cep}
            />
          </div>

          <h2 className="text-lg font-semibold text-secondary-900 mt-8 mb-4">
            Contato
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Telefone"
              type="text"
              value={formData.telefone}
              onChange={(e) =>
                setFormData({ ...formData, telefone: applyTelefoneMask(e.target.value) })
              }
              placeholder="(00) 0000-0000"
              maxLength={15}
              error={errors.telefone}
            />
            <Input
              label="Celular"
              type="text"
              value={formData.celular}
              onChange={(e) =>
                setFormData({ ...formData, celular: applyTelefoneMask(e.target.value) })
              }
              placeholder="(00) 00000-0000"
              maxLength={15}
              error={errors.celular}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="E-mail"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              error={errors.email}
            />
            <Input
              label="Website"
              type="text"
              value={formData.website}
              onChange={(e) =>
                setFormData({ ...formData, website: e.target.value })
              }
              placeholder="https://www.exemplo.com"
              helperText="Informe a URL completa com https:// ou http://"
              error={errors.website}
            />
          </div>

          <h2 className="text-lg font-semibold text-secondary-900 mt-8 mb-4">
            Textos Padrão
          </h2>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Texto do Rodapé
            </label>
            <textarea
              value={formData.texto_rodape}
              onChange={(e) =>
                setFormData({ ...formData, texto_rodape: e.target.value })
              }
              className="input-base min-h-[100px]"
              placeholder="Condições de pagamento, prazos, etc..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Observações Padrão
            </label>
            <textarea
              value={formData.observacoes_padrao}
              onChange={(e) =>
                setFormData({ ...formData, observacoes_padrao: e.target.value })
              }
              className="input-base min-h-[100px]"
              placeholder="Observações padrão para os orçamentos..."
            />
          </div>
        </form>
      </Card>

      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-secondary-200 bg-white/95 backdrop-blur-sm shadow-[0_-4px_24px_rgba(15,23,42,0.08)]"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="container-app py-3 flex flex-wrap items-center justify-end gap-3">
          <Link to="/empresas">
            <Button type="button" variant="secondary" disabled={saving}>
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            form="form-empresa"
            variant="primary"
            isLoading={saving}
            data-testid="salvar-empresa-form"
          >
            {isCreateMode ? 'Cadastrar empresa' : 'Salvar alterações'}
          </Button>
        </div>
      </div>

      <ImageCropModal
        isOpen={imageCrop.open}
        onClose={() => setImageCrop((s) => ({ ...s, open: false, src: null }))}
        imageSrc={imageCrop.src}
        onConfirm={handleImageCropConfirm}
        fileName={imageCrop.fileName}
        logoDimensoesMaximas={formData.logo_dimensoes_maximas || { largura_cm: 2.5, altura_cm: 2.5 }}
        dimensoesMaxCm={
          imageCrop.target === 'selo'
            ? {
                largura_cm: seloSlotCm.largura_cm,
                altura_cm: seloSlotCm.altura_cm,
              }
            : undefined
        }
        modalTitle={
          imageCrop.target === 'selo'
            ? `Selo ${imageCrop.seloSlot} — ajustar área da imagem`
            : undefined
        }
        description={
          imageCrop.target === 'selo' ? (
            <p className="text-sm text-secondary-600 mb-4">
              O retângulo de recorte tem a <strong>mesma proporção do slot no PDF</strong> (retrato,{' '}
              <strong>
                {seloSlotCm.largura_cm} cm × {seloSlotCm.altura_cm} cm
              </strong>
              ). Posicione o conteúdo importante dentro da área — no orçamento impresso a imagem será ajustada para
              caber nesse espaço.
            </p>
          ) : undefined
        }
      />
    </div>
  )
}

export default EmpresaForm

