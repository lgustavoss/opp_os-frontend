import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

const Layout = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Salva preferência no localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    if (saved !== null) {
      setIsSidebarCollapsed(JSON.parse(saved))
    }
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed
    setIsSidebarCollapsed(newState)
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState))
  }

  return (
    <div className="h-screen bg-secondary-50 flex flex-col overflow-hidden">
      <Header
        onMenuClick={toggleMenu}
        isMenuOpen={isMenuOpen}
        onSidebarToggle={toggleSidebar}
        isSidebarCollapsed={isSidebarCollapsed}
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar
          isOpen={isMenuOpen}
          onClose={closeMenu}
          isCollapsed={isSidebarCollapsed}
        />
        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="container-app py-6">{children}</div>
        </main>
      </div>
    </div>
  )
}

export default Layout

