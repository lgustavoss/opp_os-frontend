import api from '../utils/axios'
import { API_ENDPOINTS } from '../config/api'

export const authService = {
  login: async (username, password) => {
    const response = await api.post(API_ENDPOINTS.auth.login, {
      username,
      password,
    })
    return response.data
  },

  logout: async () => {
    const response = await api.post(API_ENDPOINTS.auth.logout)
    return response.data
  },

  getUser: async () => {
    const response = await api.get(API_ENDPOINTS.auth.user)
    return response.data
  },
}

