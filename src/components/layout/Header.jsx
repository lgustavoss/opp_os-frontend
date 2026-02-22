import { useState, useRef, useEffect } from 'react'
import { Menu, X, LogOut, User, Building2, ChevronDown } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import Button from '../ui/Button'
import Select from '../ui/Select'

const Header = ({ onMenuClick, isMenuOpen, onSidebarToggle, isSidebarCollapsed }) => {
  const { user, logout, empresaAtual, empresas, setEmpresaAtual } = useAuth()
  const navigate = useNavigate()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    if (userMenuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [userMenuOpen])

  const handleLogout = async () => {
    setUserMenuOpen(false)
    await logout()
    navigate('/login')
  }

  const getIniciais = (name) => {
    if (!name || !name.trim()) return 'U'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name.substring(0, 2).toUpperCase()
  }

  const handleEmpresaChange = async (e) => {
    const id = e.target.value ? Number(e.target.value) : null
    if (id == null) return
    try {
      await setEmpresaAtual(id)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-secondary-200 sticky top-0 z-40">
      <div className="container-app">
        <div className="flex items-center justify-between h-16">
          {/* Sistema OS fixo à esquerda + botão hambúrguer */}
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-primary-600 shrink-0">
              Sistema OS
            </h1>

            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg hover:bg-secondary-100 transition-colors"
              aria-label="Menu"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-secondary-700" />
              ) : (
                <Menu className="w-6 h-6 text-secondary-700" />
              )}
            </button>

            {onSidebarToggle && (
              <button
                onClick={onSidebarToggle}
                className="hidden lg:flex p-2 rounded-lg hover:bg-secondary-100 transition-colors"
                aria-label={isSidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
              >
                <Menu className="w-6 h-6 text-secondary-700" />
              </button>
            )}
          </div>

          {/* Empresa atual + seletor para trocar (sempre visível quando houver empresa) */}
          <div className="flex items-center gap-3 sm:gap-4">
            {(empresas?.length > 0 || empresaAtual) && (
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="w-4 h-4 text-secondary-500 flex-shrink-0" />
                {empresas?.length > 1 ? (
                  <div className="w-full min-w-[140px] max-w-[220px]">
                    <Select
                      value={empresaAtual?.id ?? ''}
                      onChange={handleEmpresaChange}
                      options={empresas.map((emp) => ({
                        value: emp.id,
                        label: emp.nome_fantasia || emp.razao_social,
                      }))}
                      placeholder="Empresa"
                      className="py-2 text-sm"
                      title="Trocar empresa"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-secondary-700 font-medium truncate max-w-[160px] sm:max-w-[220px]" title={empresaAtual?.razao_social}>
                    {empresaAtual ? (empresaAtual.nome_fantasia || empresaAtual.razao_social) : 'Sem empresa'}
                  </span>
                )}
              </div>
            )}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary-100 transition-colors text-left min-w-0"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-medium shrink-0">
                  {getIniciais(user?.username || 'Usuário')}
                </div>
                <span className="text-sm font-medium text-secondary-700 truncate max-w-[120px] sm:max-w-[160px]">
                  {user?.username || 'Usuário'}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-secondary-500 shrink-0 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-secondary-200 py-1 z-50">
                  <div className="px-4 py-3 bg-primary-600 rounded-t-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center text-sm font-semibold">
                        {getIniciais(user?.username || 'Usuário')}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">{user?.username || 'Usuário'}</p>
                        {user?.email && (
                          <p className="text-primary-100 text-xs truncate">{user.email}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false)
                      navigate('/perfil')
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors text-left"
                  >
                    <User className="w-4 h-4 text-secondary-500" />
                    Editar perfil
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors text-left border-t border-secondary-100"
                  >
                    <LogOut className="w-4 h-4 text-secondary-500" />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

