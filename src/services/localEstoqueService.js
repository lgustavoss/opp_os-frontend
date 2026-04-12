import api from '../utils/axios'
import { API_ENDPOINTS } from '../config/api'

export const localEstoqueService = {
  list: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.locaisEstoque.list, {
      params: { page_size: 100, ...params },
    })
    return response.data
  },

  create: async (data) => {
    const response = await api.post(API_ENDPOINTS.locaisEstoque.list, data)
    return response.data
  },

  patch: async (id, data) => {
    const response = await api.patch(API_ENDPOINTS.locaisEstoque.detail(id), data)
    return response.data
  },

  delete: async (id) => {
    await api.delete(API_ENDPOINTS.locaisEstoque.detail(id))
  },
}
