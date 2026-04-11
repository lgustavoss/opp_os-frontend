import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import './Login.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberAccess, setRememberAccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const savedEmail = window.localStorage.getItem('dxcontrol_saved_email')
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberAccess(true)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await login(email, password)
      if (result.success) {
        if (rememberAccess) {
          window.localStorage.setItem('dxcontrol_saved_email', email.trim())
        } else {
          window.localStorage.removeItem('dxcontrol_saved_email')
        }
        navigate('/')
      } else {
        setError(
          result.error?.message ||
            result.error?.non_field_errors?.[0] ||
            'Credenciais inválidas'
        )
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page">
      <img
        className="login-brand"
        src="/duplexsoft-logo.png"
        alt="DuplexSoft"
      />
      <div className="login-card">
        <div className="login-card-header">
          <h1 className="login-title">DX Control</h1>
          <p className="login-subtitle">Seja bem vindo de volta.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-alert">
              <p>{error}</p>
            </div>
          )}

          <div className="login-field">
            <label htmlFor="login-email">E-mail *</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Senha *</label>
            <div className="login-password-wrap">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="current-password"
                className="login-password-input"
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                disabled={isLoading}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                tabIndex={0}
              >
                {showPassword ? (
                  <EyeOff size={20} aria-hidden />
                ) : (
                  <Eye size={20} aria-hidden />
                )}
              </button>
            </div>
          </div>

          <label className="login-remember-row" htmlFor="login-remember">
            <input
              id="login-remember"
              type="checkbox"
              checked={rememberAccess}
              onChange={(e) => setRememberAccess(e.target.checked)}
              disabled={isLoading}
            />
            <span>Salvar dados de acesso</span>
          </label>

          <button type="submit" className="login-submit" disabled={isLoading}>
            {isLoading ? (
              <span className="login-submit-loading">Entrando…</span>
            ) : (
              'Entrar'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
