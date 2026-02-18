import api from '../utils/axios'
import { API_ENDPOINTS } from '../config/api'

const FIELDS_CONFIG = [
  'razao_social', 'nome_fantasia', 'cnpj', 'inscricao_estadual', 'inscricao_municipal',
  'endereco', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'cep',
  'telefone', 'celular', 'email', 'website', 'texto_rodape', 'observacoes_padrao',
]

export const configuracaoService = {
  get: async () => {
    const response = await api.get(API_ENDPOINTS.configuracoes.list)
    return response.data
  },

  update: async (data, logomarcaFile = null) => {
    if (logomarcaFile) {
      const formData = new FormData()
      FIELDS_CONFIG.forEach((field) => {
        const value = data[field]
        formData.append(field, value != null ? String(value) : '')
      })
      formData.append('logomarca', logomarcaFile)
      const response = await api.post(API_ENDPOINTS.configuracoes.list, formData)
      return response.data
    }
    const id = data.id
    const endpoint = id ? API_ENDPOINTS.configuracoes.detail(id) : API_ENDPOINTS.configuracoes.list
    const method = id ? 'patch' : 'post'
    const response = await api[method](endpoint, data)
    return response.data
  },
}

