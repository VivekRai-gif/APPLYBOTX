import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../utils/AuthContext'
import { filesAPI, aiAPI, emailAPI } from '../services/api'
import { 
  UploadIcon, 
  FileTextIcon, 
  SendIcon, 
  TrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon
} from 'lucide-react'
import { useQuery } from 'react-query'

const Dashboard = () => {
  const { user, connectedAccounts } = useAuth()
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalDrafts: 0,
    totalSent: 0,
    recentActivity: []
  })

  // Fetch recent files
  const { data: recentFiles } = useQuery('recentFiles', () => filesAPI.list(), {
    onSuccess: (data) => {
      setStats(prev => ({ ...prev, totalFiles: data.data.length }))
    }
  })

  // Fetch recent drafts
  const { data: recentDrafts } = useQuery('recentDrafts', () => aiAPI.listDrafts(5), {
    onSuccess: (data) => {
      setStats(prev => ({ ...prev, totalDrafts: data.data.length }))
    }
  })

  // Fetch recent sent emails
  const { data: recentSent } = useQuery('recentSent', () => emailAPI.listSent(5), {
    onSuccess: (data) => {
      setStats(prev => ({ ...prev, totalSent: data.data.length }))
    }
  })

  const quickActions = [
    {
      title: 'Upload Resume',
      description: 'Upload and parse your resume or portfolio',
      icon: UploadIcon,
      href: '/upload',
      color: 'bg-blue-500'
    },
    {
      title: 'Compose Email',
      description: 'Generate AI-powered job application emails',
      icon: FileTextIcon,
      href: '/compose',
      color: 'bg-green-500'
    },
    {
      title: 'Email Templates',
      description: 'Browse and customize email templates',
      icon: FileTextIcon,
      href: '/templates',
      color: 'bg-purple-500'
    },
    {
      title: 'View History',
      description: 'Check your email sending history',
      icon: ClockIcon,
      href: '/history',
      color: 'bg-orange-500'
    }
  ]

  const handleConnectEmail = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}/auth/oauth/google/start`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name || user?.email}!
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Here's what's happening with your job applications.
          </p>
        </div>

        {/* Connected Accounts Alert */}
        {connectedAccounts.length === 0 && (
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  No email account connected
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Connect your Gmail or Outlook account to send emails directly from ApplyBotX.
                  </p>
                </div>
                <div className="mt-4">
                  <div className="-mx-2 -my-1.5 flex">
                    <button
                      onClick={handleConnectEmail}
                      className="bg-yellow-50 px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100"
                    >
                      Connect Gmail
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileTextIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Files Uploaded
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalFiles}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileTextIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Drafts Created
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalDrafts}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <SendIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Emails Sent
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalSent}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUpIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Success Rate
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      85%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                to={action.href}
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 ${action.color} p-3 rounded-md`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-900">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Files */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Files
              </h3>
              {recentFiles?.data.length > 0 ? (
                <div className="space-y-3">
                  {recentFiles.data.slice(0, 5).map((file) => (
                    <div key={file.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {file.filename}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(file.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {file.status === 'completed' ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                        ) : file.status === 'error' ? (
                          <XCircleIcon className="h-4 w-4 text-red-500" />
                        ) : (
                          <ClockIcon className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <FileTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No files yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by uploading your resume.
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/upload"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                      Upload File
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Drafts */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Drafts
              </h3>
              {recentDrafts?.data.length > 0 ? (
                <div className="space-y-3">
                  {recentDrafts.data.map((draft) => (
                    <div key={draft.id} className="border-l-4 border-primary-400 pl-4">
                      <p className="text-sm font-medium text-gray-900">
                        {draft.subject}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(draft.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <FileTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No drafts yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Create your first AI-generated email.
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/compose"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                      Compose Email
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard