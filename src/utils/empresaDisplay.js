/**
 * Nome exibido no seletor de empresa (header) e listagens.
 * Prioridade: nome_exibicao_menu → nome_fantasia → razão_social.
 */
export function getEmpresaMenuLabel(emp) {
  if (!emp) return ''
  const menu = emp.nome_exibicao_menu?.trim()
  if (menu) return menu
  return emp.nome_fantasia?.trim() || emp.razao_social?.trim() || 'Empresa'
}
