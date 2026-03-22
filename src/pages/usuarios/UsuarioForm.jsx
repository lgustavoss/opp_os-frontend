import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Users, FileText, Building2, Shield } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import PasswordInput from '../../components/ui/PasswordInput'
import Loading from '../../components/ui/Loading'
import Checkbox from '../../components/ui/Checkbox'
import { usuarioService } from '../../services/usuarioService'
import { PERMISSOES_PADRAO } from '../../utils/moduloPermissoes'
import { SENHA_MIN_LENGTH, validarComprimentoMinimoSenha } from '../../utils/senhaPolicy'

const emptyForm = {
  email: '',
  first_name: '',
  last_name: '',
  password: '',
  password_confirm: '',
  is_staff: false,
  is_active: true,
}

/** none | view | full — alinhado às flags do perfil */
function nivelModulo(visualizar, elevado) {
  if (!visualizar) return 'none'
  return elevado ? 'full' : 'view'
}

function PermissaoSegmentRow({ icon: Icon, titulo, descricao, value, options, onChange }) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 border-b border-secondary-100/90 last:border-0 last:pb-0 first:pt-0">
      <div className="flex items-start gap-3 min-w-0">
        <div
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-secondary-100 text-secondary-500"
          aria-hidden
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 pt-0.5">
          <p className="text-sm font-medium text-secondary-900">{titulo}</p>
          {descricao ? (
            <p className="text-xs text-secondary-500 mt-0.5 leading-relaxed">{descricao}</p>
          ) : null}
        </div>
      </div>
      <div
        className="flex w-full sm:w-auto rounded-2xl bg-secondary-100/80 p-1 self-stretch sm:self-auto sm:shrink-0"
        role="group"
        aria-label={titulo}
      >
        {options.map((opt) => {
          const active = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={[
                'flex-1 sm:flex-initial min-w-0 sm:min-w-[4.25rem] px-2.5 sm:px-3 py-2 text-xs font-medium rounded-xl transition-all duration-200',
                active
                  ? 'bg-white text-secondary-900 shadow-sm ring-1 ring-secondary-900/5'
                  : 'text-secondary-500 hover:text-secondary-800',
              ].join(' ')}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const UsuarioForm = () => {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  /** idle | checking | valid | invalid — regras Django após blur (e antes do submit) */
  const [passwordRules, setPasswordRules] = useState({ status: 'idle', messages: [] })
  const [permissoes, setPermissoes] = useState(() => ({ ...PERMISSOES_PADRAO }))

  const validarSenhaNoServidor = useCallback(
    async (password) => {
      const body = { password }
      if (isEdit && id) body.usuario_id = Number(id)
      return usuarioService.validarSenha(body)
    },
    [isEdit, id]
  )

  const setNivelModulo = (modulo, nivel) => {
    setPermissoes((prev) => {
      const next = { ...prev }
      if (modulo === 'clientes') {
        if (nivel === 'none') {
          next.clientes_pode_visualizar = false
          next.clientes_pode_cadastrar = false
        } else if (nivel === 'view') {
          next.clientes_pode_visualizar = true
          next.clientes_pode_cadastrar = false
        } else {
          next.clientes_pode_visualizar = true
          next.clientes_pode_cadastrar = true
        }
      }
      if (modulo === 'orcamentos') {
        if (nivel === 'none') {
          next.orcamentos_pode_visualizar = false
          next.orcamentos_pode_cadastrar = false
        } else if (nivel === 'view') {
          next.orcamentos_pode_visualizar = true
          next.orcamentos_pode_cadastrar = false
        } else {
          next.orcamentos_pode_visualizar = true
          next.orcamentos_pode_cadastrar = true
        }
      }
      if (modulo === 'configuracoes') {
        if (nivel === 'none') {
          next.configuracoes_pode_visualizar = false
          next.configuracoes_pode_configurar = false
        } else if (nivel === 'view') {
          next.configuracoes_pode_visualizar = true
          next.configuracoes_pode_configurar = false
        } else {
          next.configuracoes_pode_visualizar = true
          next.configuracoes_pode_configurar = true
        }
      }
      return next
    })
  }

  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    ;(async () => {
      try {
        const u = await usuarioService.get(id)
        if (cancelled) return
        setForm({
          email: u.email || '',
          first_name: u.first_name || '',
          last_name: u.last_name || '',
          password: '',
          password_confirm: '',
          is_staff: !!u.is_staff,
          is_active: u.is_active !== false,
        })
        setPermissoes({ ...PERMISSOES_PADRAO, ...(u.permissoes || {}) })
        setPasswordRules({ status: 'idle', messages: [] })
      } catch {
        navigate('/usuarios')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, isEdit, navigate])

  /** Confirmação: borda verde se igual, vermelha se diferente (em tempo real quando há texto). */
  const confirmSenhaFeedback = useMemo(() => {
    const c = form.password_confirm ?? ''
    const p = form.password ?? ''
    if (!c.trim()) {
      return { error: undefined, successText: undefined }
    }
    if (!p) {
      return {
        error: 'Preencha o campo Senha acima antes de confirmar.',
        successText: undefined,
      }
    }
    if (p === c) {
      return { error: undefined, successText: 'As senhas coincidem.' }
    }
    return { error: 'As senhas não coincidem.', successText: undefined }
  }, [form.password, form.password_confirm])

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
    if (field === 'password') {
      setPasswordRules({ status: 'idle', messages: [] })
    }
  }

  const handlePasswordBlur = async () => {
    const raw = form.password ?? ''
    if (!raw.trim()) {
      setPasswordRules({ status: 'idle', messages: [] })
      return
    }
    // Feedback imediato (mesma regra de tamanho do Django), sem depender da API
    const local = validarComprimentoMinimoSenha(raw)
    if (!local.ok) {
      setPasswordRules({ status: 'invalid', messages: [local.mensagem] })
      return
    }
    setPasswordRules({ status: 'checking', messages: [] })
    try {
      const r = await validarSenhaNoServidor(raw)
      if (r && r.valido === true) {
        setPasswordRules({ status: 'valid', messages: [] })
      } else if (r && r.valido === false) {
        setPasswordRules({ status: 'invalid', messages: r.erros?.length ? r.erros : ['Senha não atende às regras.'] })
      } else {
        setPasswordRules({ status: 'idle', messages: [] })
      }
    } catch {
      // API indisponível: já validamos tamanho no cliente; mantém válido local
      setPasswordRules({ status: 'valid', messages: [] })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const body = {
        email: form.email.trim().toLowerCase(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        is_staff: form.is_staff,
        is_active: form.is_active,
      }
      if (!isEdit) {
        if (!form.password) {
          setError('Informe uma senha para o novo usuário.')
          setSaving(false)
          return
        }
        if (!form.password_confirm) {
          setError('Confirme a senha.')
          setSaving(false)
          return
        }
        if (form.password !== form.password_confirm) {
          setError('A senha e a confirmação não coincidem.')
          setSaving(false)
          return
        }
        body.password = form.password
      } else {
        if (form.password_confirm && !form.password) {
          setError('Informe a nova senha ou esvazie o campo de confirmação.')
          setSaving(false)
          return
        }
        if (form.password) {
          if (!form.password_confirm) {
            setError('Confirme a nova senha.')
            setSaving(false)
            return
          }
          if (form.password !== form.password_confirm) {
            setError('A senha e a confirmação não coincidem.')
            setSaving(false)
            return
          }
          body.password = form.password
        }
      }

      if (body.password) {
        try {
          const check = await validarSenhaNoServidor(body.password)
          if (!check.valido) {
            setPasswordRules({ status: 'invalid', messages: check.erros || [] })
            setError((check.erros || []).join(' · ') || 'Senha não atende às regras.')
            setSaving(false)
            return
          }
          setPasswordRules({ status: 'valid', messages: [] })
        } catch {
          /* rede: o backend valida ao salvar */
        }
      }

      if (!form.is_staff) {
        body.permissoes = {
          clientes_pode_visualizar: !!permissoes.clientes_pode_visualizar,
          clientes_pode_cadastrar: !!permissoes.clientes_pode_cadastrar,
          orcamentos_pode_visualizar: !!permissoes.orcamentos_pode_visualizar,
          orcamentos_pode_cadastrar: !!permissoes.orcamentos_pode_cadastrar,
          configuracoes_pode_visualizar: !!permissoes.configuracoes_pode_visualizar,
          configuracoes_pode_configurar: !!permissoes.configuracoes_pode_configurar,
        }
      }

      if (isEdit) {
        await usuarioService.patch(id, body)
      } else {
        await usuarioService.create(body)
      }
      navigate('/usuarios')
    } catch (err) {
      const d = err.response?.data
      if (typeof d === 'object' && d !== null) {
        const pwdRaw = d.password
        let pwdMsgs = null
        if (pwdRaw != null) {
          pwdMsgs = Array.isArray(pwdRaw) ? pwdRaw.map((x) => String(x)) : [String(pwdRaw)]
          setPasswordRules({ status: 'invalid', messages: pwdMsgs })
        }
        const formatApiField = (v) => {
          if (Array.isArray(v)) return v.map((x) => String(x)).join(' ')
          return String(v)
        }
        const keys = Object.keys(d)
        const onlyPasswordErr = keys.length === 1 && keys[0] === 'password' && pwdMsgs
        if (onlyPasswordErr) {
          setError(pwdMsgs.join(' · '))
        } else {
          const parts = Object.entries(d).map(([k, v]) => `${k}: ${formatApiField(v)}`)
          setError(parts.join(' · ') || 'Erro ao salvar.')
        }
      } else {
        setError('Erro ao salvar usuário.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Loading fullScreen />
  }

  return (
    <div className="space-y-6 w-full max-w-full lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl">
      <div className="flex items-start gap-4">
        <Link to="/usuarios">
          <button type="button" className="p-2 rounded-lg hover:bg-secondary-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-secondary-600" />
          </button>
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-secondary-900">
            {isEdit ? 'Editar usuário' : 'Novo usuário'}
          </h1>
          <p className="text-secondary-600 mt-1 max-w-2xl">
            Login no sistema é feito com e-mail e senha.
          </p>
        </div>
      </div>

      <Card>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 md:gap-y-5"
        >
          {error && (
            <div className="md:col-span-2 p-3 rounded-lg bg-danger-50 text-danger-800 text-sm">
              {error}
            </div>
          )}
          <div className="md:col-span-2">
            <Input
              label="E-mail *"
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
              disabled={isEdit}
              helperText={isEdit ? 'O e-mail não pode ser alterado.' : ''}
            />
          </div>
          <div className="min-w-0">
            <Input
              label="Nome"
              value={form.first_name}
              onChange={(e) => handleChange('first_name', e.target.value)}
              autoComplete="given-name"
            />
          </div>
          <div className="min-w-0">
            <Input
              label="Sobrenome"
              value={form.last_name}
              onChange={(e) => handleChange('last_name', e.target.value)}
              autoComplete="family-name"
            />
          </div>
          <div className="min-w-0">
            <PasswordInput
              label={isEdit ? 'Nova senha (opcional)' : 'Senha *'}
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              onBlur={handlePasswordBlur}
              autoComplete="new-password"
              required={!isEdit}
              error={
                passwordRules.status === 'invalid' && passwordRules.messages.length
                  ? passwordRules.messages.join(' ')
                  : undefined
              }
              successText={
                passwordRules.status === 'valid' && (form.password || '').trim()
                  ? 'Senha ok — pode confirmar abaixo.'
                  : undefined
              }
              validating={passwordRules.status === 'checking'}
              helperText={
                passwordRules.status === 'idle'
                  ? isEdit
                    ? 'Para alterar, preencha senha e confirmação. Ao sair daqui, verificamos se a nova senha é válida.'
                    : `Mínimo ${SENHA_MIN_LENGTH} caracteres. Letras, números e símbolos são permitidos — não precisa usar os três. Ao sair do campo, indicamos se está ok.`
                  : undefined
              }
            />
          </div>
          <div className="min-w-0">
            <PasswordInput
              label={isEdit ? 'Confirmar nova senha' : 'Confirmar senha *'}
              value={form.password_confirm}
              onChange={(e) => handleChange('password_confirm', e.target.value)}
              autoComplete="new-password"
              required={!isEdit}
              error={confirmSenhaFeedback.error}
              successText={confirmSenhaFeedback.successText}
              helperText={
                !confirmSenhaFeedback.error && !confirmSenhaFeedback.successText
                  ? isEdit
                    ? 'Só precisa preencher se estiver definindo uma nova senha. Deve ser igual ao campo anterior.'
                    : 'Digite de novo a mesma senha do campo acima.'
                  : undefined
              }
            />
          </div>
          <div className="md:col-span-2 flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:gap-x-8 sm:gap-y-3 pt-1">
            <Checkbox
              label="Administrador (staff)"
              checked={form.is_staff}
              onChange={(e) => handleChange('is_staff', e.target.checked)}
            />
            {isEdit && (
              <Checkbox
                label="Usuário ativo"
                checked={form.is_active}
                onChange={(e) => handleChange('is_active', e.target.checked)}
              />
            )}
          </div>

          {/* Sempre visível: explica o papel de administrador antes e depois de marcar */}
          <div
            className={[
              'md:col-span-2 flex gap-3.5 rounded-2xl pl-1 pr-4 py-3.5 sm:pl-1.5 sm:pr-5 transition-colors duration-200',
              form.is_staff
                ? 'bg-primary-50/50 ring-1 ring-primary-200/40'
                : 'bg-secondary-50/50 ring-1 ring-secondary-200/30',
            ].join(' ')}
          >
            <div
              className={[
                'w-1 shrink-0 rounded-full self-stretch min-h-[2.75rem]',
                form.is_staff ? 'bg-primary-500/70' : 'bg-secondary-300/80',
              ].join(' ')}
              aria-hidden
            />
            <div className="flex gap-3 min-w-0 pt-0.5">
              <Shield
                className={[
                  'w-4 h-4 shrink-0 mt-0.5',
                  form.is_staff ? 'text-primary-600/90' : 'text-secondary-400',
                ].join(' ')}
                strokeWidth={1.75}
                aria-hidden
              />
              <div className="min-w-0 space-y-1">
                <p
                  className={[
                    'text-sm font-medium tracking-tight',
                    form.is_staff ? 'text-primary-950' : 'text-secondary-900',
                  ].join(' ')}
                >
                  {form.is_staff ? 'Administrador ativo' : 'Perfil administrador'}
                </p>
                <p className="text-xs sm:text-sm text-secondary-600 leading-relaxed max-w-prose">
                  {form.is_staff ? (
                    <>
                      Acesso total ao sistema; permissões por módulo{' '}
                      <span className="text-secondary-800 font-medium">não se aplicam</span> a este
                      usuário.
                    </>
                  ) : (
                    <>
                      Inclui gestão de usuários e áreas restritas. Ao marcar, o acesso passa a ser
                      irrestrito e as permissões por módulo abaixo{' '}
                      <span className="text-secondary-700">deixam de valer</span>.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {!form.is_staff && (
            <div className="md:col-span-2">
              <div className="mb-1">
                <h3 className="text-sm font-medium text-secondary-900 tracking-tight">
                  Acesso por módulo
                </h3>
                <p className="text-xs text-secondary-500 mt-1 max-w-xl">
                  Três níveis por área. &quot;Editar&quot; ou &quot;Configurar&quot; inclui visualização.
                </p>
              </div>
              <div className="mt-2 rounded-2xl border border-secondary-100 px-4 sm:px-5 bg-white">
                <PermissaoSegmentRow
                  icon={Users}
                  titulo="Clientes"
                  descricao="Lista e detalhes; em Editar, inclusão e alterações."
                  value={nivelModulo(
                    permissoes.clientes_pode_visualizar,
                    permissoes.clientes_pode_cadastrar
                  )}
                  options={[
                    { value: 'none', label: 'Nenhum' },
                    { value: 'view', label: 'Ver' },
                    { value: 'full', label: 'Editar' },
                  ]}
                  onChange={(nivel) => setNivelModulo('clientes', nivel)}
                />
                <PermissaoSegmentRow
                  icon={FileText}
                  titulo="Orçamentos"
                  descricao="Consulta e PDF; em Editar, criar, alterar status e itens."
                  value={nivelModulo(
                    permissoes.orcamentos_pode_visualizar,
                    permissoes.orcamentos_pode_cadastrar
                  )}
                  options={[
                    { value: 'none', label: 'Nenhum' },
                    { value: 'view', label: 'Ver' },
                    { value: 'full', label: 'Editar' },
                  ]}
                  onChange={(nivel) => setNivelModulo('orcamentos', nivel)}
                />
                <PermissaoSegmentRow
                  icon={Building2}
                  titulo="Empresas"
                  descricao="Dados da empresa e menu; em Configurar, cadastro e exclusão."
                  value={nivelModulo(
                    permissoes.configuracoes_pode_visualizar,
                    permissoes.configuracoes_pode_configurar
                  )}
                  options={[
                    { value: 'none', label: 'Nenhum' },
                    { value: 'view', label: 'Ver' },
                    { value: 'full', label: 'Configurar' },
                  ]}
                  onChange={(nivel) => setNivelModulo('configuracoes', nivel)}
                />
              </div>
            </div>
          )}

          <div className="md:col-span-2 flex flex-wrap gap-3 pt-2 border-t border-secondary-100 mt-2">
            <Button type="submit" variant="primary" isLoading={saving}>
              Salvar
            </Button>
            <Link to="/usuarios">
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default UsuarioForm
