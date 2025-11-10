import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './utils/AuthContext'
import Layout from './components/Layout'
import Home from './components/Home'
import Dashboard from './components/Dashboard'
import Upload from './components/Upload'
import EmailComposer from './components/EmailComposer'
import Templates from './components/Templates'
import EmailHistory from './components/EmailHistory'
import Settings from './components/Settings'
import Login from './components/Login'
import AuthCallback from './components/AuthCallback'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="auth/callback" element={<AuthCallback />} />
          
          {/* Protected Routes */}
          <Route path="dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="upload" element={
            <ProtectedRoute>
              <Upload />
            </ProtectedRoute>
          } />
          <Route path="compose" element={
            <ProtectedRoute>
              <EmailComposer />
            </ProtectedRoute>
          } />
          <Route path="templates" element={
            <ProtectedRoute>
              <Templates />
            </ProtectedRoute>
          } />
          <Route path="history" element={
            <ProtectedRoute>
              <EmailHistory />
            </ProtectedRoute>
          } />
          <Route path="settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App