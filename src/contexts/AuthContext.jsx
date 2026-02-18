import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/axios'
import { API_ENDPOINTS } from '../config/api'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Verificar autenticação ao carregar
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.auth.user)
      setUser(response.data)
      setIsAuthenticated(true)
    } catch (error) {
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const login = async (username, password) => {
    try {
      const response = await api.post(API_ENDPOINTS.auth.login, {
        username,
        password,
      })
      setUser(response.data.usuario)
      setIsAuthenticated(true)
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Erro ao fazer login' },
      }
    }
  }

  const logout = async () => {
    try {
      await api.post(API_ENDPOINTS.auth.logout)
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    } finally {
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

