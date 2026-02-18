import api from '../utils/axios'
import { API_ENDPOINTS } from '../config/api'

export const orcamentoService = {
  list: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.orcamentos.list, { params })
    return response.data
  },

  get: async (id) => {
    const response = await api.get(API_ENDPOINTS.orcamentos.detail(id))
    return response.data
  },

  create: async (data) => {
    const response = await api.post(API_ENDPOINTS.orcamentos.create, data)
    return response.data
  },

  update: async (id, data) => {
    const response = await api.patch(
      API_ENDPOINTS.orcamentos.update(id),
      data
    )
    return response.data
  },

  delete: async (id) => {
    const response = await api.delete(API_ENDPOINTS.orcamentos.delete(id))
    return response.data
  },

  adicionarItem: async (id, data) => {
    const response = await api.post(
      API_ENDPOINTS.orcamentos.adicionarItem(id),
      data
    )
    return response.data
  },

  atualizarStatus: async (id, status) => {
    const response = await api.patch(
      API_ENDPOINTS.orcamentos.atualizarStatus(id),
      { status }
    )
    return response.data
  },

  gerarOrcamento: async (id) => {
    const response = await api.get(
      API_ENDPOINTS.orcamentos.gerarOrcamento(id),
      {
        responseType: 'blob',
      }
    )
    return response.data
  },
}

