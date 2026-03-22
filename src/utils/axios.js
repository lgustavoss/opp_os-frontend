import axios from 'axios'
import { API_BASE_URL } from '../config/api'

/**
 * Função para obter o CSRF token dos cookies
 */
const getCsrfToken = () => {
  const name = 'csrftoken'
  let cookieValue = null
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';')
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim()
      if (cookie.substring(0, name.length + 1) === name + '=') {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
        break
      }
    }
  }
  return cookieValue
}

/**
 * Instância do axios configurada com a URL base da API
 * Inclui credenciais para suportar autenticação por sessão (cookies)
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para adicionar CSRF token nas requisições
api.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para adicionar tratamento de erros global
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Não redireciona para login se for erro de CSRF (403)
    // O usuário pode estar autenticado, mas com problema de CSRF
    if (error.response?.status === 401) {
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    } else if (error.response?.status === 403) {
      const errorDetail = error.response?.data?.detail || ''
      if (errorDetail.includes('CSRF')) {
        console.error('Erro CSRF:', errorDetail)
        // Tenta obter o token novamente na próxima requisição
      } else {
        // Outro tipo de erro 403 (sem permissão)
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api

