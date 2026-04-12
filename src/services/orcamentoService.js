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
    const response = await api.patch(API_ENDPOINTS.orcamentos.update(id), data)
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

  atualizarStatus: async (id, status, localEstoqueId = null) => {
    const body = { status }
    if (localEstoqueId != null) {
      body.local_estoque = localEstoqueId
    }
    const response = await api.patch(
      API_ENDPOINTS.orcamentos.atualizarStatus(id),
      body
    )
    return response.data
  },

  gerarOrcamento: async (id) => {
    const response = await api.get(
      API_ENDPOINTS.orcamentos.gerarOrcamento(id),
      {
        responseType: 'blob',
        params: { _t: Date.now() },
        headers: { 'Cache-Control': 'no-cache' },
      }
    )
    return response.data
  },

  /** Atualiza um item de orçamento (linha da tabela de itens) */
  updateItem: async (itemId, data) => {
    const response = await api.patch(
      API_ENDPOINTS.itensOrcamento.update(itemId),
      data
    )
    return response.data
  },

  /** Remove um item do orçamento */
  deleteItem: async (itemId) => {
    await api.delete(API_ENDPOINTS.itensOrcamento.delete(itemId))
  },
}

