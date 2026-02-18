import api from '../utils/axios'
import { API_ENDPOINTS } from '../config/api'

export const clienteService = {
  list: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.clientes.list, { params })
    return response.data
  },

  get: async (id) => {
    const response = await api.get(API_ENDPOINTS.clientes.detail(id))
    return response.data
  },

  create: async (data) => {
    const response = await api.post(API_ENDPOINTS.clientes.create, data)
    return response.data
  },

  update: async (id, data) => {
    const response = await api.patch(API_ENDPOINTS.clientes.update(id), data)
    return response.data
  },

  delete: async (id) => {
    const response = await api.delete(API_ENDPOINTS.clientes.delete(id))
    return response.data
  },

  consultarCNPJ: async (cnpj) => {
    const response = await api.get(API_ENDPOINTS.clientes.consultarCNPJ, {
      params: { cnpj },
    })
    return response.data
  },
}

