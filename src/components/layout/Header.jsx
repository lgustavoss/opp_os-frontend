import { useState, useRef, useEffect, useMemo } from 'react'
import { Menu, X, LogOut, User, Building2, ChevronDown } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getEmpresaMenuLabel } from '../../utils/empresaDisplay'
import { getNavbarUserDisplayName, getNavbarUserInitials } from '../../utils/userDisplay'
import { useNavigate } from 'react-router-dom'
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

  const userBarName = useMemo(() => getNavbarUserDisplayName(user), [user])
  const userInitials = useMemo(() => getNavbarUserInitials(user), [user])
  const empresaLabel = useMemo(
    () => (empresaAtual ? getEmpresaMenuLabel(empresaAtual) : ''),
    [empresaAtual]
  )

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
        <div className="flex items-center h-16 gap-2 sm:gap-3 min-w-0">
          {/* Esquerda: marca + menu */}
          <div className="flex items-center gap-2 shrink-0">
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

          {/* Centro: empresa — ocupa o espaço disponível; nomes longos truncam com tooltip */}
          <div className="flex-1 min-w-0 flex items-center justify-center px-1 sm:px-3">
            {(empresas?.length > 0 || empresaAtual) && (
              <div className="flex items-center gap-2 min-w-0 max-w-full w-full justify-center sm:justify-center">
                <Building2 className="w-4 h-4 text-secondary-500 shrink-0 hidden sm:block" />
                {empresas?.length > 1 ? (
                  <div className="min-w-0 w-full max-w-[min(100%,14rem)] sm:max-w-[min(100%,22rem)] md:max-w-[min(100%,32rem)] lg:max-w-[min(100%,40rem)] mx-auto">
                    <Select
                      value={empresaAtual?.id ?? ''}
                      onChange={handleEmpresaChange}
                      options={empresas.map((emp) => ({
                        value: emp.id,
                        label: getEmpresaMenuLabel(emp),
                      }))}
                      placeholder="Empresa"
                      className="py-2 text-sm"
                      title={empresaLabel || 'Trocar empresa'}
                    />
                  </div>
                ) : (
                  <span
                    className="text-sm text-secondary-700 font-medium truncate text-center sm:text-left block min-w-0 max-w-full"
                    title={empresaLabel || undefined}
                  >
                    {empresaAtual ? (
                      <span className="inline-block max-w-[min(100%,12rem)] sm:max-w-[min(100%,20rem)] md:max-w-[min(100%,28rem)] lg:max-w-[min(100%,36rem)] truncate align-bottom">
                        {empresaLabel}
                      </span>
                    ) : (
                      'Sem empresa'
                    )}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Direita: usuário */}
          <div className="flex items-center shrink-0">
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary-100 transition-colors text-left min-w-0 max-w-[11rem] sm:max-w-[14rem]"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
                title={user?.email || undefined}
              >
                <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-medium shrink-0">
                  {userInitials}
                </div>
                <span className="text-sm font-medium text-secondary-700 truncate min-w-0">
                  {userBarName}
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
                        {userInitials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium truncate" title={userBarName}>
                          {userBarName}
                        </p>
                        {user?.email && (
                          <p className="text-primary-100 text-xs truncate" title={user.email}>
                            {user.email}
                          </p>
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

