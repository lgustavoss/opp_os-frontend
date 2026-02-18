import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Search } from 'lucide-react'
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/clientes">
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* CNPJ/CPF */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
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
            </div>
            {!isEdit && formData.tipo_documento === 'CNPJ' && (
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleConsultarCNPJ}
                  isLoading={consultingCNPJ}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Consultar CNPJ
                </Button>
              </div>
            )}
          </div>

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

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-secondary-200">
            <Link to="/clientes">
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" variant="primary" isLoading={saving}>
              {isEdit ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default ClienteForm

