import { useState, useEffect, useRef } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Loading from '../components/ui/Loading'
import ImageCropModal from '../components/common/ImageCropModal'
import { configuracaoService } from '../services/configuracaoService'
import { applyTelefoneMask } from '../utils/formatters'

const Configuracoes = () => {
  const fileInputRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logomarcaFile, setLogomarcaFile] = useState(null)
  const [logomarcaPreview, setLogomarcaPreview] = useState(null)
  const [formData, setFormData] = useState({
    logomarca_url: '',
    logo_dimensoes_maximas: { largura_cm: 2.5, altura_cm: 2.5 },
    razao_social: '',
    nome_fantasia: '',
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
    texto_rodape: '',
    observacoes_padrao: '',
  })
  const [errors, setErrors] = useState({})
  const [logomarcaLoadError, setLogomarcaLoadError] = useState(false)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropModalImageSrc, setCropModalImageSrc] = useState(null)
  const [cropModalFileName, setCropModalFileName] = useState('logo.png')

  const getLogomarcaSrc = (url) => {
    if (!url) return null
    if (url.startsWith('/media/')) return url
    const match = url.match(/\/media\/.+$/)
    return match ? match[0] : url
  }

  useEffect(() => {
    loadConfiguracoes()
  }, [])

  const loadConfiguracoes = async () => {
    try {
      setLoading(true)
      setLogomarcaLoadError(false)
      const data = await configuracaoService.get()
      if (data) {
        setFormData({
          ...data,
          telefone: data.telefone ? applyTelefoneMask(data.telefone) : '',
          celular: data.celular ? applyTelefoneMask(data.celular) : '',
        })
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogomarcaChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Selecione um arquivo de imagem (PNG, JPG, etc.)')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setCropModalImageSrc(reader.result)
        setCropModalFileName(file.name || 'logo.png')
        setCropModalOpen(true)
      }
      reader.readAsDataURL(file)
    } else {
      setLogomarcaFile(null)
      setLogomarcaPreview(null)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCropConfirm = (croppedFile) => {
    setLogomarcaFile(croppedFile)
    const reader = new FileReader()
    reader.onloadend = () => setLogomarcaPreview(reader.result)
    reader.readAsDataURL(croppedFile)
    setCropModalImageSrc(null)
  }

  const handleRemoverLogomarca = () => {
    setLogomarcaFile(null)
    setLogomarcaPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
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
      const dataToSend = {
        ...formData,
        website: normalizeWebsite(formData.website),
      }
      await configuracaoService.update(dataToSend, logomarcaFile)
      alert('Configurações salvas com sucesso!')
      setLogomarcaFile(null)
      setLogomarcaPreview(null)
      setLogomarcaLoadError(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await loadConfiguracoes()
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

  if (loading) {
    return <Loading fullScreen />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">
          Configurações da Empresa
        </h1>
        <p className="text-secondary-600 mt-1">
          Configure as informações da sua empresa
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
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
              {(logomarcaPreview || formData.logomarca_url || formData.logomarca) && !logomarcaLoadError ? (
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
              ) : (formData.logomarca || formData.logomarca_url) && logomarcaLoadError ? (
                <div className="w-[94px] h-[94px] border border-danger-200 rounded-lg bg-danger-50 flex items-center justify-center p-2 text-center text-sm text-danger-600">
                  Falha ao carregar imagem. Verifique se o arquivo existe no servidor.
                </div>
              ) : null}
              <div className="flex gap-2">
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
                  {formData.logomarca_url || formData.logomarca || logomarcaPreview ? 'Trocar imagem' : 'Selecionar imagem'}
                </Button>
                {(logomarcaPreview || formData.logomarca_url || formData.logomarca) && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleRemoverLogomarca}
                  >
                    Remover
                  </Button>
                )}
              </div>
            </div>
          </div>

          <h2 className="text-lg font-semibold text-secondary-900 mt-8 mb-4">
            Dados da Empresa
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Razão Social"
              type="text"
              value={formData.razao_social}
              onChange={(e) =>
                setFormData({ ...formData, razao_social: e.target.value })
              }
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
              label="CNPJ"
              type="text"
              value={formData.cnpj}
              onChange={(e) =>
                setFormData({ ...formData, cnpj: e.target.value })
              }
              error={errors.cnpj}
            />
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Endereço"
                type="text"
                value={formData.endereco}
                onChange={(e) =>
                  setFormData({ ...formData, endereco: e.target.value })
                }
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
              error={errors.estado}
            />
            <Input
              label="CEP"
              type="text"
              value={formData.cep}
              onChange={(e) =>
                setFormData({ ...formData, cep: e.target.value })
              }
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

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-secondary-200">
            <Button type="submit" variant="primary" isLoading={saving} data-testid="salvar-configuracoes">
              Salvar Configurações
            </Button>
          </div>
        </form>
      </Card>

      <ImageCropModal
        isOpen={cropModalOpen}
        onClose={() => {
          setCropModalOpen(false)
          setCropModalImageSrc(null)
        }}
        imageSrc={cropModalImageSrc}
        onConfirm={handleCropConfirm}
        fileName={cropModalFileName}
        logoDimensoesMaximas={formData.logo_dimensoes_maximas || { largura_cm: 2.5, altura_cm: 2.5 }}
      />
    </div>
  )
}

export default Configuracoes

