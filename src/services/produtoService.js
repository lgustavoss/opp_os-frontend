import api from '../utils/axios'
import { API_ENDPOINTS } from '../config/api'

export const produtoService = {
  list: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.produtos.list, { params })
    return response.data
  },

  get: async (codigo) => {
    const response = await api.get(API_ENDPOINTS.produtos.detail(codigo))
    return response.data
  },

  create: async (data) => {
    const response = await api.post(API_ENDPOINTS.produtos.create, data)
    return response.data
  },

  update: async (codigo, data) => {
    const response = await api.patch(API_ENDPOINTS.produtos.update(codigo), data)
    return response.data
  },

  delete: async (codigo) => {
    await api.delete(API_ENDPOINTS.produtos.delete(codigo))
  },
}
