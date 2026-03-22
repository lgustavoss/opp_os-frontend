/**
 * Permissões por módulo vindas de GET /auth/user/ (objeto user.permissoes).
 * is_staff no backend já recebe tudo true.
 */

export const PERMISSOES_PADRAO = {
  clientes_pode_visualizar: true,
  clientes_pode_cadastrar: true,
  orcamentos_pode_visualizar: true,
  orcamentos_pode_cadastrar: true,
  configuracoes_pode_visualizar: true,
  configuracoes_pode_configurar: true,
}

export function permissoesDoUsuario(user) {
  if (!user) return { ...PERMISSOES_PADRAO, tudoBloqueado: true }
  if (user.is_staff) {
    return { ...PERMISSOES_PADRAO, isStaff: true }
  }
  const p = user.permissoes || {}
  return {
    clientes_pode_visualizar: !!p.clientes_pode_visualizar,
    clientes_pode_cadastrar: !!p.clientes_pode_cadastrar,
    orcamentos_pode_visualizar: !!p.orcamentos_pode_visualizar,
    orcamentos_pode_cadastrar: !!p.orcamentos_pode_cadastrar,
    configuracoes_pode_visualizar: !!p.configuracoes_pode_visualizar,
    configuracoes_pode_configurar: !!p.configuracoes_pode_configurar,
    isStaff: false,
  }
}
