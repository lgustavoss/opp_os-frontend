import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Search, Loader2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Loading from '../../components/ui/Loading'
import { clienteService } from '../../services/clienteService'
import {
  removeFormatting,
  applyCNPJCPFMask,
  getMaxLengthCNPJCPF,
  applyCEPMask,
  applyTelefoneMask,
} from '../../utils/formatters'
import { Link } from 'react-router-dom'

const ClienteForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [consultingCNPJ, setConsultingCNPJ] = useState(false)
  const [formData, setFormData] = useState({
    cnpj_cpf: '',
    tipo_documento: 'CNPJ',
    razao_social: '',
    nome_fantasia: '',
    inscricao_estadual: '',
    email: '',
    telefone: '',
    endereco: '',
    cep: '',
    cidade: '',
    estado: '',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEdit) {
      loadCliente()
    }
  }, [id])

  // Aplica máscara quando o tipo de documento muda (apenas se já houver valor)
  useEffect(() => {
    if (formData.cnpj_cpf && !isEdit) {
      const cleaned = removeFormatting(formData.cnpj_cpf)
      if (cleaned) {
        const masked = applyCNPJCPFMask(cleaned, formData.tipo_documento)
        // Só atualiza se o valor formatado for diferente
        if (masked !== formData.cnpj_cpf) {
          setFormData((prev) => ({ ...prev, cnpj_cpf: masked }))
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.tipo_documento])

  const loadCliente = async () => {
    try {
      setLoading(true)
      const cliente = await clienteService.get(id)
      const tipoDoc = cliente.tipo_documento || 'CNPJ'
      
      // Aplica máscaras aos campos formatados
      const cnpjCpfFormatted = cliente.cnpj_cpf
        ? applyCNPJCPFMask(cliente.cnpj_cpf, tipoDoc)
        : ''
      const telefoneFormatted = cliente.telefone
        ? applyTelefoneMask(cliente.telefone)
        : ''
      const cepFormatted = cliente.cep ? applyCEPMask(cliente.cep) : ''

      setFormData({
        cnpj_cpf: cnpjCpfFormatted,
        tipo_documento: tipoDoc,
        razao_social: cliente.razao_social || '',
        nome_fantasia: cliente.nome_fantasia || '',
        inscricao_estadual: cliente.inscricao_estadual || '',
        email: cliente.email || '',
        telefone: telefoneFormatted,
        endereco: cliente.endereco || '',
        cep: cepFormatted,
        cidade: cliente.cidade || '',
        estado: cliente.estado || '',
      })
    } catch (error) {
      console.error('Erro ao carregar cliente:', error)
      navigate('/clientes')
    } finally {
      setLoading(false)
    }
  }

  const handleConsultarCNPJ = async () => {
    const cnpj = removeFormatting(formData.cnpj_cpf)
    if (cnpj.length !== 14) {
      alert('CNPJ deve conter 14 dígitos')
      return
    }

    try {
      setConsultingCNPJ(true)
      const data = await clienteService.consultarCNPJ(cnpj)
      
      // Aplica máscaras aos dados retornados
      const cnpjCpfFormatted = data.cnpj_cpf
        ? applyCNPJCPFMask(data.cnpj_cpf, 'CNPJ')
        : formData.cnpj_cpf
      const telefoneFormatted = data.telefone
        ? applyTelefoneMask(data.telefone)
        : formData.telefone
      const cepFormatted = data.cep ? applyCEPMask(data.cep) : formData.cep

      setFormData((prev) => ({
        ...prev,
        ...data,
        cnpj_cpf: cnpjCpfFormatted,
        telefone: telefoneFormatted,
        cep: cepFormatted,
        tipo_documento: 'CNPJ',
      }))
    } catch (error) {
      alert(
        error.response?.data?.erro || 'Erro ao consultar CNPJ. Tente novamente.'
      )
    } finally {
      setConsultingCNPJ(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setSaving(true)

    try {
      // Remove formatação dos campos antes de enviar
      const cnpjCpfCleaned = removeFormatting(formData.cnpj_cpf)
      const cepCleaned = removeFormatting(formData.cep)
      const telefoneCleaned = removeFormatting(formData.telefone)
      
      const data = {
        cnpj_cpf: cnpjCpfCleaned,
        tipo_documento: formData.tipo_documento,
        razao_social: formData.razao_social,
        nome_fantasia: formData.nome_fantasia || '',
        inscricao_estadual: (formData.inscricao_estadual || '').trim() || '',
        email: (formData.email || '').trim() || '',
        telefone: telefoneCleaned || '',
        endereco: formData.endereco || '',
        cep: cepCleaned || '',
        cidade: formData.cidade || '',
        estado: formData.estado || '',
      }

      if (isEdit) {
        await clienteService.update(id, data)
      } else {
        await clienteService.create(data)
      }
      
      navigate('/clientes')
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
      console.error('Status:', error.response?.status)
      console.error('Detalhes do erro:', JSON.stringify(error.response?.data, null, 2))
      if (error.response?.data) {
        setErrors(error.response.data)
        // Mostra mensagem de erro mais específica
        const errorMessage = error.response.data.detail || 
                           error.response.data.message ||
                           Object.values(error.response.data).flat().join(', ') ||
                           'Erro ao salvar cliente. Verifique os dados e tente novamente.'
        alert(errorMessage)
      } else {
        alert('Erro ao salvar cliente. Verifique sua conexão e tente novamente.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Loading fullScreen />
  }

  const cancelHref = '/clientes'

  return (
    <div className="space-y-6 pb-28 md:pb-32">
      <div className="flex items-center gap-4">
        <Link to={cancelHref}>
          <button className="p-2 rounded-lg hover:bg-secondary-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-secondary-600" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            {isEdit ? 'Editar Cliente' : 'Novo Cliente'}
          </h1>
          <p className="text-secondary-600 mt-1">
            {isEdit
              ? 'Atualize as informações do cliente'
              : 'Preencha os dados do novo cliente'}
          </p>
        </div>
      </div>

      <Card>
        <form id="form-cliente" onSubmit={handleSubmit} className="space-y-6">
          {/* CNPJ/CPF — lupa dentro do campo quando novo cliente + CNPJ */}
          {!isEdit && formData.tipo_documento === 'CNPJ' ? (
            <div className="w-full">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                CNPJ/CPF
                <span className="text-danger-500 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.cnpj_cpf}
                  onChange={(e) => {
                    const masked = applyCNPJCPFMask(
                      e.target.value,
                      formData.tipo_documento
                    )
                    setFormData((prev) => ({ ...prev, cnpj_cpf: masked }))
                  }}
                  maxLength={getMaxLengthCNPJCPF(formData.tipo_documento)}
                  placeholder="00.000.000/0000-00"
                  required
                  disabled={isEdit}
                  className={`
                    input-base w-full pr-11
                    ${errors.cnpj_cpf ? 'border-danger-500 focus:ring-danger-500' : ''}
                  `}
                  aria-describedby={errors.cnpj_cpf ? 'cliente-cnpj-error' : undefined}
                />
                <button
                  type="button"
                  onClick={handleConsultarCNPJ}
                  disabled={consultingCNPJ}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-md text-secondary-500 hover:text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  title="Consultar CNPJ na ReceitaWS"
                  aria-label="Consultar CNPJ na ReceitaWS"
                >
                  {consultingCNPJ ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.cnpj_cpf && (
                <p id="cliente-cnpj-error" className="mt-1 text-sm text-danger-600">
                  {Array.isArray(errors.cnpj_cpf)
                    ? errors.cnpj_cpf.join(', ')
                    : errors.cnpj_cpf}
                </p>
              )}
            </div>
          ) : (
            <Input
              label="CNPJ/CPF"
              type="text"
              value={formData.cnpj_cpf}
              onChange={(e) => {
                const masked = applyCNPJCPFMask(
                  e.target.value,
                  formData.tipo_documento
                )
                setFormData((prev) => ({ ...prev, cnpj_cpf: masked }))
              }}
              maxLength={getMaxLengthCNPJCPF(formData.tipo_documento)}
              placeholder={
                formData.tipo_documento === 'CPF'
                  ? '000.000.000-00'
                  : '00.000.000/0000-00'
              }
              required
              error={errors.cnpj_cpf}
              disabled={isEdit}
            />
          )}

          <Select
            label="Tipo de Documento"
            value={formData.tipo_documento}
            onChange={(e) =>
              setFormData({ ...formData, tipo_documento: e.target.value })
            }
            options={[
              { value: 'CNPJ', label: 'CNPJ' },
              { value: 'CPF', label: 'CPF' },
            ]}
            disabled={isEdit}
            required
          />

          <Input
            label="Razão Social / Nome Completo"
            type="text"
            value={formData.razao_social}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, razao_social: e.target.value }))
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Inscrição estadual"
              type="text"
              value={formData.inscricao_estadual}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  inscricao_estadual: e.target.value,
                }))
              }
              maxLength={20}
              error={errors.inscricao_estadual}
            />
            <Input
              label="E-mail"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="contato@empresa.com.br"
              error={errors.email}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Telefone"
              type="text"
              value={formData.telefone}
              onChange={(e) => {
                const masked = applyTelefoneMask(e.target.value)
                setFormData({ ...formData, telefone: masked })
              }}
              maxLength={15}
              placeholder="(00) 00000-0000"
              error={errors.telefone}
            />

            <Input
              label="CEP"
              type="text"
              value={formData.cep}
              onChange={(e) => {
                const masked = applyCEPMask(e.target.value)
                setFormData({ ...formData, cep: masked })
              }}
              maxLength={9}
              placeholder="00000-000"
              error={errors.cep}
            />
          </div>

          <Input
            label="Endereço"
            type="text"
            value={formData.endereco}
            onChange={(e) =>
              setFormData({ ...formData, endereco: e.target.value })
            }
            error={errors.endereco}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                setFormData({
                  ...formData,
                  estado: e.target.value.toUpperCase(),
                })
              }
              maxLength={2}
              error={errors.estado}
            />
          </div>
        </form>
      </Card>

      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-secondary-200 bg-white/95 backdrop-blur-sm shadow-[0_-4px_24px_rgba(15,23,42,0.08)]"
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
            form="form-cliente"
            variant="primary"
            isLoading={saving}
          >
            {isEdit ? 'Atualizar' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ClienteForm

