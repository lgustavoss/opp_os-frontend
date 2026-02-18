import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  X,
} from 'lucide-react'

const menuItems = [
  {
    path: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    path: '/clientes',
    label: 'Clientes',
    icon: Users,
  },
  {
    path: '/orcamentos',
    label: 'Orçamentos',
    icon: FileText,
  },
  {
    path: '/configuracoes',
    label: 'Configurações',
    icon: Settings,
  },
]

const Sidebar = ({ isOpen, onClose, isCollapsed = false }) => {
  return (
    <>
      {/* Overlay Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - ocupa toda a lateral esquerda */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 bottom-0 z-50
          h-full min-h-screen lg:min-h-0 lg:h-full lg:self-stretch
          bg-white border-r border-secondary-200
          transform transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-20' : 'w-full lg:w-64'}
          flex flex-col shrink-0
        `}
      >
        {/* Header Mobile */}
        <div className="flex items-center justify-between p-4 border-b border-secondary-200 lg:hidden">
          <h2 className="text-lg font-semibold text-secondary-900">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary-100 transition-colors"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5 text-secondary-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `
                        flex items-center gap-3 px-4 py-3 rounded-lg
                        transition-colors duration-200
                        ${isCollapsed ? 'justify-center' : ''}
                        ${
                          isActive
                            ? 'bg-primary-50 text-primary-700 font-medium'
                            : 'text-secondary-700 hover:bg-secondary-50'
                        }
                      `
                    }
                    title={isCollapsed ? item.label : ''}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>
    </>
  )
}

export default Sidebar

