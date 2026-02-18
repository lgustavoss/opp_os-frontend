/**
 * Funções utilitárias para formatação de dados
 */

/**
 * Formata CNPJ/CPF
 */
export const formatCNPJCPF = (value) => {
  if (!value) return ''
  const cleaned = value.replace(/\D/g, '')
  
  if (cleaned.length === 11) {
    // CPF: 000.000.000-00
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  } else if (cleaned.length === 14) {
    // CNPJ: 00.000.000/0000-00
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  return value
}

/**
 * Aplica máscara de CPF/CNPJ conforme o tipo de documento
 * @param {string} value - Valor a ser formatado
 * @param {string} tipoDocumento - 'CPF' ou 'CNPJ'
 * @returns {string} - Valor formatado
 */
export const applyCNPJCPFMask = (value, tipoDocumento) => {
  if (!value) return ''
  
  // Remove tudo que não é dígito
  const cleaned = value.replace(/\D/g, '')
  
  if (tipoDocumento === 'CPF') {
    // Limita a 11 dígitos para CPF
    const limited = cleaned.slice(0, 11)
    
    // Aplica máscara progressivamente
    if (limited.length <= 3) {
      return limited
    } else if (limited.length <= 6) {
      return limited.replace(/(\d{3})(\d+)/, '$1.$2')
    } else if (limited.length <= 9) {
      return limited.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3')
    } else {
      return limited.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, '$1.$2.$3-$4')
    }
  } else {
    // Limita a 14 dígitos para CNPJ
    const limited = cleaned.slice(0, 14)
    
    // Aplica máscara progressivamente
    if (limited.length <= 2) {
      return limited
    } else if (limited.length <= 5) {
      return limited.replace(/(\d{2})(\d+)/, '$1.$2')
    } else if (limited.length <= 8) {
      return limited.replace(/(\d{2})(\d{3})(\d+)/, '$1.$2.$3')
    } else if (limited.length <= 12) {
      return limited.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3/$4')
    } else {
      return limited.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/, '$1.$2.$3/$4-$5')
    }
  }
}

/**
 * Retorna o máximo de caracteres permitido baseado no tipo de documento
 * @param {string} tipoDocumento - 'CPF' ou 'CNPJ'
 * @returns {number} - Número máximo de caracteres (incluindo formatação)
 */
export const getMaxLengthCNPJCPF = (tipoDocumento) => {
  if (tipoDocumento === 'CPF') {
    return 14 // 11 dígitos + 3 caracteres de formatação (000.000.000-00)
  }
  return 18 // 14 dígitos + 4 caracteres de formatação (00.000.000/0000-00)
}

/**
 * Formata CEP
 */
export const formatCEP = (value) => {
  if (!value) return ''
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length === 8) {
    return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2')
  }
  return value
}

/**
 * Aplica máscara de CEP
 * @param {string} value - Valor a ser formatado
 * @returns {string} - Valor formatado
 */
export const applyCEPMask = (value) => {
  if (!value) return ''
  const cleaned = value.replace(/\D/g, '').slice(0, 8)
  
  if (cleaned.length <= 5) {
    return cleaned
  } else {
    return cleaned.replace(/(\d{5})(\d+)/, '$1-$2')
  }
}

/**
 * Formata telefone
 */
export const formatTelefone = (value) => {
  if (!value) return ''
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  } else if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  return value
}

/**
 * Aplica máscara de telefone
 * @param {string} value - Valor a ser formatado
 * @returns {string} - Valor formatado
 */
export const applyTelefoneMask = (value) => {
  if (!value) return ''
  const cleaned = value.replace(/\D/g, '').slice(0, 11)
  
  if (cleaned.length <= 2) {
    return cleaned.length > 0 ? `(${cleaned}` : cleaned
  } else if (cleaned.length <= 6) {
    return cleaned.replace(/(\d{2})(\d+)/, '($1) $2')
  } else if (cleaned.length <= 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d+)/, '($1) $2-$3')
  } else {
    return cleaned.replace(/(\d{2})(\d{5})(\d+)/, '($1) $2-$3')
  }
}

/**
 * Formata valor monetário
 */
export const formatCurrency = (value) => {
  if (!value && value !== 0) return 'R$ 0,00'
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue)
}

/**
 * Formata data
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  }).format(date)
}

/**
 * Formata data e hora
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Remove formatação (apenas números)
 */
export const removeFormatting = (value) => {
  if (!value) return ''
  return value.replace(/\D/g, '')
}

/**
 * Remove caracteres inválidos em nomes de arquivo (/, \, :, *, ?, ", <, >, |)
 * @param {string} value - Texto a ser sanitizado
 * @returns {string}
 */
export const sanitizeFilename = (value) => {
  if (!value) return ''
  return String(value).replace(/[/\\:*?"<>|]/g, '').trim() || ''
}

