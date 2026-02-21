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
      await api.post(API_ENDPOINTS.auth.login, {
        username,
        password,
      })
      // Recarrega dados do usuário (inclui empresa_atual e empresas) via GET /auth/user/
      await checkAuth()
      return { success: true }
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

  /** Altera a empresa atual do usuário (multi-empresa). Recarrega os dados do usuário. */
  const setEmpresaAtual = async (empresaId) => {
    try {
      await api.patch(API_ENDPOINTS.auth.setEmpresaAtual, { empresa_atual: empresaId })
      await checkAuth()
    } catch (error) {
      console.error('Erro ao trocar empresa:', error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
    setEmpresaAtual,
    empresaAtual: user?.empresa_atual ?? null,
    empresas: user?.empresas ?? [],
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

