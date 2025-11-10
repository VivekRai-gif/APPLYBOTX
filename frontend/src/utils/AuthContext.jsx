import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [connectedAccounts, setConnectedAccounts] = useState([])

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (token) {
        const response = await authAPI.getProfile()
        setUser(response.data)
        await fetchConnectedAccounts()
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('access_token')
    } finally {
      setLoading(false)
    }
  }

  const fetchConnectedAccounts = async () => {
    try {
      const response = await authAPI.getConnectedAccounts()
      setConnectedAccounts(response.data)
    } catch (error) {
      console.error('Failed to fetch connected accounts:', error)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password)
      const { access_token } = response.data
      localStorage.setItem('access_token', access_token)
      
      const profileResponse = await authAPI.getProfile()
      setUser(profileResponse.data)
      await fetchConnectedAccounts()
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      }
    }
  }

  const register = async (userData) => {
    try {
      await authAPI.register(userData)
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Registration failed' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    setUser(null)
    setConnectedAccounts([])
  }

  const disconnectAccount = async (accountId) => {
    try {
      await authAPI.disconnectAccount(accountId)
      await fetchConnectedAccounts()
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to disconnect account' 
      }
    }
  }

  const value = {
    user,
    loading,
    connectedAccounts,
    login,
    register,
    logout,
    disconnectAccount,
    refreshConnectedAccounts: fetchConnectedAccounts,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}