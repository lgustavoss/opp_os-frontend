/**
 * Configurações da API
 * Base versionada (/api/v1) para evolução sem quebrar clientes antigos (rota /api/ legada no backend).
 * Em produção, use VITE_API_BASE_URL (ex.: https://api.exemplo.com/api/v1).
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  '/api/v1'

/** Alinhado ao PageNumberPagination do Django (config.pagination.ApiPageNumberPagination) */
export const API_PAGE_SIZE = 20
export const API_MAX_PAGE_SIZE = 100

export const API_ENDPOINTS = {
  // Dashboard
  dashboard: {
    resumo: '/dashboard/resumo/',
  },
  // Autenticação
  auth: {
    csrf: '/auth/csrf/',
    login: '/auth/login/',
    logout: '/auth/logout/',
    user: '/auth/user/',
    setEmpresaAtual: '/auth/user/', // PATCH com { empresa_atual: id }
    validarSenha: '/auth/validar-senha/',
  },
  usuarios: {
    list: '/usuarios/',
    detail: (id) => `/usuarios/${id}/`,
  },
  // Configurações (multi-empresa)
  configuracoes: {
    list: '/configuracoes-empresa/',
    atual: '/configuracoes-empresa/atual/',
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
    resumoOrcamentos: (id) => `/clientes/${id}/resumo-orcamentos/`,
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
  statusOrcamentos: {
    list: '/status-orcamentos/',
    detail: (id) => `/status-orcamentos/${id}/`,
  },
  produtos: {
    list: '/produtos/',
    detail: (codigo) => `/produtos/${codigo}/`,
    create: '/produtos/',
    update: (codigo) => `/produtos/${codigo}/`,
    delete: (codigo) => `/produtos/${codigo}/`,
    movimentarEstoque: (codigo) => `/produtos/${codigo}/movimentar_estoque/`,
    movimentacoes: (codigo) => `/produtos/${codigo}/movimentacoes/`,
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

