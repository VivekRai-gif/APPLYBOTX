import React from 'react'
import { useAuth } from '../utils/AuthContext'

const Settings = () => {
  const { user, connectedAccounts, disconnectAccount } = useAuth()

  const handleDisconnectAccount = async (accountId) => {
    const result = await disconnectAccount(accountId)
    if (result.success) {
      // Account disconnected successfully
    }
  }

  const handleConnectEmail = (provider) => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}/auth/oauth/${provider}/start`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your account and connected email accounts.
        </p>
        
        {/* Profile Section */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-sm text-gray-900">{user?.name || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Connected Accounts Section */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900">Connected Email Accounts</h3>
            <p className="mt-1 text-sm text-gray-600">
              Connect your email accounts to send job applications directly.
            </p>
            
            <div className="mt-4 space-y-3">
              {connectedAccounts.length > 0 ? (
                connectedAccounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {account.provider === 'google' ? (
                          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">G</span>
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">M</span>
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{account.email}</p>
                        <p className="text-xs text-gray-500 capitalize">{account.provider}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDisconnectAccount(account.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Disconnect
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500">No email accounts connected</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => handleConnectEmail('google')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Connect Gmail
              </button>
              <button
                onClick={() => handleConnectEmail('microsoft')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Connect Outlook
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings