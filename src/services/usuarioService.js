import api from '../utils/axios'
import { API_ENDPOINTS } from '../config/api'

export const usuarioService = {
  /**
   * Mesmas regras que o Django (AUTH_PASSWORD_VALIDATORS).
   * @param {{ password: string, usuario_id?: number }} payload — usuario_id na edição de outro usuário
   */
  async validarSenha(payload) {
    const body = {
      password: payload.password,
      ...(payload.usuario_id != null ? { usuario_id: payload.usuario_id } : {}),
    }
    const { data } = await api.post(API_ENDPOINTS.auth.validarSenha, body)
    return data
  },

  async list(params = {}) {
    const { data } = await api.get(API_ENDPOINTS.usuarios.list, { params })
    return data
  },

  async get(id) {
    const { data } = await api.get(API_ENDPOINTS.usuarios.detail(id))
    return data
  },

  async create(payload) {
    const { data } = await api.post(API_ENDPOINTS.usuarios.list, payload)
    return data
  },

  async update(id, payload) {
    const { data } = await api.put(API_ENDPOINTS.usuarios.detail(id), payload)
    return data
  },

  async patch(id, payload) {
    const { data } = await api.patch(API_ENDPOINTS.usuarios.detail(id), payload)
    return data
  },

  async remove(id) {
    await api.delete(API_ENDPOINTS.usuarios.detail(id))
  },
}
