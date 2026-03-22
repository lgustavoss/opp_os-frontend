/**
 * Política de senha alinhada ao backend (common/password_validators.SENHA_MIN_LENGTH).
 * Mantenha o número igual ao do Django ao alterar o mínimo.
 */
export const SENHA_MIN_LENGTH = 6

/**
 * @returns {{ ok: true } | { ok: false, mensagem: string }}
 */
export function validarComprimentoMinimoSenha(password) {
  const p = password ?? ''
  if (p.length < SENHA_MIN_LENGTH) {
    return {
      ok: false,
      mensagem: `A senha deve ter pelo menos ${SENHA_MIN_LENGTH} caracteres.`,
    }
  }
  return { ok: true }
}
