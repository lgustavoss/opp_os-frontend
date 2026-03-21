import api from '../utils/axios'
import { API_ENDPOINTS } from '../config/api'

const FIELDS_CONFIG = [
  'razao_social', 'nome_fantasia', 'nome_exibicao_menu', 'cnpj', 'inscricao_estadual', 'inscricao_municipal',
  'endereco', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'cep',
  'telefone', 'celular', 'email', 'website',
  'texto_selos_cabecalho_pdf',
  'texto_rodape', 'observacoes_padrao',
]

/** Campos de arquivo aceitos no PATCH multipart */
const FILE_FIELD_KEYS = [
  'logomarca',
  'selo_certificacao_1',
  'selo_certificacao_2',
  'selo_certificacao_3',
]

/** Flags write_only para apagar mídia no servidor (multipart ou JSON) */
const REMOVE_FLAG_KEYS = [
  'remover_logomarca',
  'remover_selo_certificacao_1',
  'remover_selo_certificacao_2',
  'remover_selo_certificacao_3',
]

function isUploadableFile(value) {
  if (value == null) return false
  if (typeof File !== 'undefined' && value instanceof File) return true
  if (typeof Blob !== 'undefined' && value instanceof Blob) return true
  return false
}

function normalizeFilesArg(files) {
  if (files == null) return {}
  if (
    typeof files === 'object' &&
    !Array.isArray(files) &&
    !isUploadableFile(files) &&
    (Object.prototype.hasOwnProperty.call(files, 'logomarca') ||
      Object.prototype.hasOwnProperty.call(files, 'selo_certificacao_1') ||
      Object.prototype.hasOwnProperty.call(files, 'selo_certificacao_2') ||
      Object.prototype.hasOwnProperty.call(files, 'selo_certificacao_3'))
  ) {
    return files
  }
  if (isUploadableFile(files)) return { logomarca: files }
  return {}
}

/** PATCH JSON: só campos escalares; nunca URLs de mídia (Django exige arquivo real no multipart). */
function buildJsonPatchBody(data) {
  const payload = {}
  FIELDS_CONFIG.forEach((field) => {
    const value = data[field]
    if (value !== undefined && value !== null) {
      payload[field] = value
    }
  })
  return payload
}

export const configuracaoService = {
  /** Retorna a configuração da empresa atual do usuário */
  get: async () => {
    const response = await api.get(API_ENDPOINTS.configuracoes.atual)
    return response.data
  },

  /** Lista todas as empresas (respeita paginação padrão da API) */
  list: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.configuracoes.list, { params })
    const d = response.data
    if (Array.isArray(d)) return d
    return {
      results: d.results ?? [],
      count: d.count ?? (d.results?.length ?? 0),
      next: d.next,
      previous: d.previous,
    }
  },

  /** Cria empresa (todos os campos obrigatórios devem vir preenchidos pelo formulário) */
  create: async (data) => {
    const response = await api.post(API_ENDPOINTS.configuracoes.list, data)
    return response.data
  },

  /** Retorna a configuração de uma empresa por ID */
  getById: async (id) => {
    const response = await api.get(API_ENDPOINTS.configuracoes.detail(id))
    return response.data
  },

  /**
   * Atualiza empresa. `files` pode ser um File (só logomarca, compatível) ou objeto
   * { logomarca?, selo_certificacao_1?, selo_certificacao_2?, selo_certificacao_3? }.
   */
  update: async (data, files = null) => {
    const id = data.id
    if (!id) {
      throw new Error('ID da empresa é obrigatório para atualizar configurações.')
    }
    const fileMap = normalizeFilesArg(files)
    const hasAnyFile = FILE_FIELD_KEYS.some((k) => isUploadableFile(fileMap[k]))
    const hasRemoveFlag = REMOVE_FLAG_KEYS.some((k) => data[k] === true)

    if (hasAnyFile || hasRemoveFlag) {
      const formData = new FormData()
      FIELDS_CONFIG.forEach((field) => {
        const value = data[field]
        formData.append(field, value != null ? String(value) : '')
      })
      REMOVE_FLAG_KEYS.forEach((key) => {
        if (data[key] === true) formData.append(key, 'true')
      })
      FILE_FIELD_KEYS.forEach((key) => {
        const f = fileMap[key]
        if (isUploadableFile(f)) formData.append(key, f)
      })
      const response = await api.patch(API_ENDPOINTS.configuracoes.detail(id), formData)
      return response.data
    }
    const response = await api.patch(
      API_ENDPOINTS.configuracoes.detail(id),
      buildJsonPatchBody(data),
    )
    return response.data
  },

  /** Remove empresa (bloqueado pelo backend se houver orçamentos vinculados) */
  delete: async (id) => {
    await api.delete(API_ENDPOINTS.configuracoes.detail(id))
  },
}

