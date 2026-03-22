import api from '../utils/axios'
import { API_ENDPOINTS, API_MAX_PAGE_SIZE } from '../config/api'

export const statusOrcamentoService = {
  /** Lista paginada (use ativo=true para dropdowns). */
  list: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.statusOrcamentos.list, {
      params: { page_size: API_MAX_PAGE_SIZE, ...params },
    })
    return response.data
  },

  async listAllOrdered(params = {}) {
    let page = 1
    const all = []
    let hasNext = true
    while (hasNext) {
      const data = await this.list({ ...params, page })
      const chunk = data.results || []
      all.push(...chunk)
      hasNext = Boolean(data.next)
      page += 1
      if (page > 50) break
    }
    return all.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0) || a.id - b.id)
  },

  get: async (id) => {
    const response = await api.get(API_ENDPOINTS.statusOrcamentos.detail(id))
    return response.data
  },

  create: async (data) => {
    const response = await api.post(API_ENDPOINTS.statusOrcamentos.list, data)
    return response.data
  },

  update: async (id, data) => {
    const response = await api.patch(API_ENDPOINTS.statusOrcamentos.detail(id), data)
    return response.data
  },

  delete: async (id) => {
    await api.delete(API_ENDPOINTS.statusOrcamentos.detail(id))
  },
}
