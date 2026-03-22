/** Variante de Badge por id numérico do status (apenas para diferenciar visualmente). */
export function orcamentoStatusBadgeVariant(statusId) {
  if (statusId == null || statusId === '') return 'secondary'
  const n = Number(statusId)
  if (!Number.isFinite(n)) return 'secondary'
  const variants = ['primary', 'success', 'warning', 'secondary']
  return variants[Math.abs(n) % variants.length]
}

export function orcamentoStatusLabel(_statusId, statusNome) {
  return statusNome || '—'
}
