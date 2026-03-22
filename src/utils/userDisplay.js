/**
 * Iniciais a partir de um nome ou texto (ex.: e-mail).
 * Exportado como getIniciais para compatibilidade com componentes que esperam esse nome.
 */
export function getIniciais(name) {
  if (name == null || !String(name).trim()) return 'U'
  const parts = String(name).trim().split(/\s+/)
  if (parts.length >= 2) {
    const a = parts[0][0]
    const b = parts[parts.length - 1][0]
    if (a && b) return (a + b).toUpperCase()
  }
  return String(name).substring(0, 2).toUpperCase()
}

/** Nome na barra: prioriza nome + sobrenome; não usa e-mail como rótulo principal. */
export function getNavbarUserDisplayName(user) {
  if (!user) return 'Usuário'
  const full = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
  if (full) return full
  return 'Usuário'
}

/** Iniciais para avatar no header / menu do usuário. */
export function getNavbarUserInitials(user) {
  const label = getNavbarUserDisplayName(user)
  if (label && label !== 'Usuário') {
    return getIniciais(label)
  }
  const em = (user?.email || '').trim()
  if (em.length >= 2) return em.substring(0, 2).toUpperCase()
  return 'U'
}
