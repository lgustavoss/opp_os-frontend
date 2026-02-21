/**
 * Configurações da API
 * Em desenvolvimento, usa /api para que o proxy do Vite encaminhe para o backend (evita CORS/cookies).
 * Em produção, use VITE_API_BASE_URL para definir a URL do backend.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  '/api'

export const API_ENDPOINTS = {
  // Dashboard
  dashboard: {
    resumo: '/dashboard/resumo/',
  },
  // Autenticação
  auth: {
    login: '/auth/login/',
    logout: '/auth/logout/',
    user: '/auth/user/',
  },
  // Configurações
  configuracoes: {
    list: '/configuracoes-empresa/',
    detail: (id) => `/configuracoes-empresa/${id}/`,
  },
  // Clientes
  clientes: {
    list: '/clientes/',
    detail: (id) => `/clientes/${id}/`,
    create: '/clientes/',
    update: (id) => `/clientes/${id}/`,
    delete: (id) => `/clientes/${id}/`,
    consultarCNPJ: '/clientes/consultar_cnpj/',
  },
  // Orçamentos
  orcamentos: {
    list: '/orcamentos/',
    detail: (id) => `/orcamentos/${id}/`,
    create: '/orcamentos/',
    update: (id) => `/orcamentos/${id}/`,
    delete: (id) => `/orcamentos/${id}/`,
    adicionarItem: (id) => `/orcamentos/${id}/adicionar_item/`,
    atualizarStatus: (id) => `/orcamentos/${id}/atualizar_status/`,
    gerarOrcamento: (id) => `/orcamentos/${id}/gerar_pdf/`,
  },
  // Itens de Orçamento
  itensOrcamento: {
    list: '/itens-orcamento/',
    detail: (id) => `/itens-orcamento/${id}/`,
    create: '/itens-orcamento/',
    update: (id) => `/itens-orcamento/${id}/`,
    delete: (id) => `/itens-orcamento/${id}/`,
  },
}

export default {
  API_BASE_URL,
  API_ENDPOINTS,
}

