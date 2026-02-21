import api from '../utils/axios'
import { API_ENDPOINTS } from '../config/api'

const FIELDS_CONFIG = [
  'razao_social', 'nome_fantasia', 'cnpj', 'inscricao_estadual', 'inscricao_municipal',
  'endereco', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'cep',
  'telefone', 'celular', 'email', 'website', 'texto_rodape', 'observacoes_padrao',
]

export const configuracaoService = {
  /** Retorna a configuração da empresa atual do usuário */
  get: async () => {
    const response = await api.get(API_ENDPOINTS.configuracoes.atual)
    return response.data
  },

  /** Lista todas as empresas (para admin/seleção) */
  list: async () => {
    const response = await api.get(API_ENDPOINTS.configuracoes.list)
    return response.data
  },

  /** Cria uma nova empresa (dados mínimos obrigatórios para o backend aceitar) */
  create: async (data) => {
    const payload = {
      razao_social: data.razao_social || 'Nova Empresa',
      nome_fantasia: data.nome_fantasia || 'Nova Empresa',
      cnpj: data.cnpj || '00000000000191',
      endereco: data.endereco || 'A preencher',
      cidade: data.cidade || 'A preencher',
      estado: data.estado || 'SP',
      cep: data.cep || '00000-000',
    }
    const response = await api.post(API_ENDPOINTS.configuracoes.list, payload)
    return response.data
  },

  /** Retorna a configuração de uma empresa por ID */
  getById: async (id) => {
    const response = await api.get(API_ENDPOINTS.configuracoes.detail(id))
    return response.data
  },

  update: async (data, logomarcaFile = null) => {
    const id = data.id
    if (!id) {
      throw new Error('ID da empresa é obrigatório para atualizar configurações.')
    }
    if (logomarcaFile) {
      const formData = new FormData()
      FIELDS_CONFIG.forEach((field) => {
        const value = data[field]
        formData.append(field, value != null ? String(value) : '')
      })
      formData.append('logomarca', logomarcaFile)
      const response = await api.patch(API_ENDPOINTS.configuracoes.detail(id), formData)
      return response.data
    }
    const response = await api.patch(API_ENDPOINTS.configuracoes.detail(id), data)
    return response.data
  },
}

