import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FileText,
  Building2,
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
]

function isConfigSectionPath(pathname) {
  return pathname === '/empresas' || pathname.startsWith('/empresas/')
}

const Sidebar = ({ isOpen, onClose, isCollapsed = false }) => {
  const location = useLocation()
  const [configMenuOpen, setConfigMenuOpen] = useState(() =>
    isConfigSectionPath(location.pathname)
  )

  useEffect(() => {
    if (isConfigSectionPath(location.pathname)) {
      setConfigMenuOpen(true)
    }
  }, [location.pathname])

  const configSectionActive = isConfigSectionPath(location.pathname)

  const linkClass = ({ isActive }, extra = '') =>
    `
      flex items-center gap-3 px-4 py-3 rounded-lg
      transition-colors duration-200
      ${isCollapsed ? 'justify-center' : ''}
      ${
        isActive
          ? 'bg-primary-50 text-primary-700 font-medium'
          : 'text-secondary-700 hover:bg-secondary-50'
      }
      ${extra}
    `

  const subLinkClass = ({ isActive }) =>
    `
      flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm
      transition-colors duration-200
      ${
        isActive
          ? 'bg-primary-50 text-primary-700 font-medium'
          : 'text-secondary-600 hover:bg-secondary-50'
      }
    `

  return (
    <>
      {/* Overlay Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

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

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    onClick={onClose}
                    className={linkClass}
                    title={isCollapsed ? item.label : ''}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </NavLink>
                </li>
              )
            })}

            {/* Configurações + submenu Empresas */}
            {isCollapsed ? (
              <li>
                <NavLink
                  to="/empresas"
                  onClick={onClose}
                  className={linkClass}
                  title="Empresas"
                >
                  <Settings className="w-5 h-5 flex-shrink-0" />
                </NavLink>
              </li>
            ) : (
              <li>
                <button
                  type="button"
                  onClick={() => setConfigMenuOpen((v) => !v)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left
                    transition-colors duration-200
                    ${
                      configSectionActive
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-secondary-700 hover:bg-secondary-50'
                    }
                  `}
                  aria-expanded={configMenuOpen}
                  aria-controls="sidebar-config-submenu"
                  title={configMenuOpen ? 'Recolher menu Empresas' : 'Expandir menu Empresas'}
                >
                  <Settings className="w-5 h-5 flex-shrink-0" />
                  <span>Configurações</span>
                </button>
                {configMenuOpen && (
                  <ul
                    id="sidebar-config-submenu"
                    className="mt-1 mb-2 ml-3 pl-4 border-l-2 border-primary-200 space-y-0.5"
                  >
                    <li>
                      <NavLink
                        to="/empresas"
                        onClick={onClose}
                        className={subLinkClass}
                      >
                        <Building2 className="w-4 h-4 flex-shrink-0 opacity-80" />
                        <span>Empresas</span>
                      </NavLink>
                    </li>
                  </ul>
                )}
              </li>
            )}
          </ul>
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
