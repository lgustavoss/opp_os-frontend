import api from '../utils/axios'
import { API_ENDPOINTS } from '../config/api'

export const dashboardService = {
  getResumo: async () => {
    const response = await api.get(API_ENDPOINTS.dashboard.resumo)
    return response.data
  },
}
