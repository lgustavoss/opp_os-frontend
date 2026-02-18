import { Menu, X, LogOut, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import Button from '../ui/Button'

const Header = ({ onMenuClick, isMenuOpen, onSidebarToggle, isSidebarCollapsed }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="bg-white shadow-sm border-b border-secondary-200 sticky top-0 z-40">
      <div className="container-app">
        <div className="flex items-center justify-between h-16">
          {/* Sistema OS fixo à esquerda + botão hambúrguer */}
          <div className="flex items-center gap-2">
            {/* Logo - sempre fixo à esquerda */}
            <h1 className="text-xl font-bold text-primary-600 shrink-0">
              Sistema OS
            </h1>

            {/* Menu Mobile - hambúrguer / X */}
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

            {/* Toggle Sidebar Desktop - ícone hambúrguer */}
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

          {/* User Info */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-secondary-600">
              <User className="w-4 h-4" />
              <span>{user?.username || 'Usuário'}</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

