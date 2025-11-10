import React, { useState, useEffect } from 'react'
import { EyeIcon, ArrowPathIcon, ClockIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { api } from '../services/api'

const EmailHistory = () => {
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    loadEmailHistory()
  }, [])

  const loadEmailHistory = async () => {
    try {
      const response = await api.getEmailHistory()
      setEmails(response.data || [])
    } catch (error) {
      console.error('Error loading email history:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResendEmail = async (email) => {
    setIsResending(true)
    try {
      await api.sendEmail({
        to: email.to,
        subject: email.subject,
        content: email.content
      })
      alert('Email resent successfully!')
      loadEmailHistory() // Refresh the list
    } catch (error) {
      console.error('Error resending email:', error)
      alert('Failed to resend email. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'failed':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'sent':
        return 'Delivered'
      case 'failed':
        return 'Failed'
      case 'pending':
        return 'Pending'
      default:
        return 'Unknown'
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Mock data for demonstration
  const mockEmails = [
    {
      id: 1,
      to: 'hiring@techcorp.com',
      subject: 'Application for Senior Software Engineer Position',
      content: `Dear Hiring Manager,

I am writing to express my strong interest in the Senior Software Engineer position at TechCorp. With my background in React, Node.js, and Python, I believe I would be a valuable addition to your development team.

In my previous experience, I have:
• Developed scalable web applications serving 100k+ users
• Led a team of 5 developers in an agile environment
• Implemented CI/CD pipelines reducing deployment time by 60%

I am particularly excited about TechCorp's mission to revolutionize healthcare through technology. I would welcome the opportunity to discuss how my skills can contribute to your team's success.

Please find my resume attached for your review. I look forward to hearing from you.

Best regards,
John Doe`,
      status: 'sent',
      sentAt: '2024-01-15T10:30:00Z',
      jobPosition: 'Senior Software Engineer',
      jobCompany: 'TechCorp'
    },
    {
      id: 2,
      to: 'careers@startup.io',
      subject: 'Application for Full Stack Developer Role',
      content: `Hello Startup Team,

I am excited to apply for the Full Stack Developer position at Startup.io. Your innovative approach to fintech solutions aligns perfectly with my passion for building user-centric applications.

My relevant experience includes:
• Full-stack development with React, Express, and MongoDB
• Building RESTful APIs and microservices architecture
• Implementing payment systems and financial data processing

I am impressed by Startup.io's recent Series A funding and growth trajectory. I would love to contribute to your continued success.

Thank you for your consideration.

Sincerely,
John Doe`,
      status: 'failed',
      sentAt: '2024-01-14T14:45:00Z',
      jobPosition: 'Full Stack Developer',
      jobCompany: 'Startup.io',
      errorMessage: 'Email address not found'
    },
    {
      id: 3,
      to: 'jobs@bigtech.com',
      subject: 'Application for Frontend Engineer Position',
      content: `Dear BigTech Hiring Team,

I am writing to apply for the Frontend Engineer position at BigTech. With 5+ years of experience in modern web development, I am excited about the opportunity to work on products used by millions of users worldwide.

Key highlights of my experience:
• Expert-level proficiency in React, TypeScript, and modern CSS
• Experience with performance optimization and accessibility standards
• Contributed to open-source projects with 10k+ GitHub stars

BigTech's commitment to innovation and user experience resonates with my professional values. I would be thrilled to bring my expertise to your frontend team.

I look forward to discussing this opportunity further.

Best regards,
John Doe`,
      status: 'pending',
      sentAt: '2024-01-13T09:15:00Z',
      jobPosition: 'Frontend Engineer',
      jobCompany: 'BigTech'
    }
  ]

  const displayEmails = emails.length > 0 ? emails : mockEmails

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Email History</h1>
          <p className="mt-2 text-gray-600">
            View your sent emails and their delivery status
          </p>
        </div>

        {displayEmails.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No emails sent yet.</p>
            <p className="text-sm text-gray-400 mt-2">
              Your sent job application emails will appear here.
            </p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Sent Emails ({displayEmails.length})</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {displayEmails.map((email) => (
                <div key={email.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(email.status)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {email.subject}
                          </p>
                          <p className="text-sm text-gray-500">
                            To: {email.to} • {email.jobPosition} at {email.jobCompany}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <span>Status:</span>
                          <span className={`font-medium ${
                            email.status === 'sent' ? 'text-green-600' : 
                            email.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                            {getStatusText(email.status)}
                          </span>
                        </span>
                        <span>Sent: {formatDate(email.sentAt)}</span>
                        {email.errorMessage && (
                          <span className="text-red-500">Error: {email.errorMessage}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => setSelectedEmail(email)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                        title="View email"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                      {email.status === 'failed' && (
                        <button
                          onClick={() => handleResendEmail(email)}
                          disabled={isResending}
                          className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-md disabled:opacity-50"
                          title="Resend email"
                        >
                          <ArrowPathIcon className={`h-4 w-4 ${isResending ? 'animate-spin' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Email Preview Modal */}
        {selectedEmail && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Email Preview</h3>
                    <div className="mt-2 flex items-center space-x-2">
                      {getStatusIcon(selectedEmail.status)}
                      <span className="text-sm text-gray-600">
                        {getStatusText(selectedEmail.status)} • {formatDate(selectedEmail.sentAt)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedEmail(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">To</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedEmail.to}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subject</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedEmail.subject}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Content</label>
                    <div className="mt-1 p-4 bg-gray-50 rounded-lg">
                      <pre className="text-sm text-gray-900 whitespace-pre-wrap font-sans">
                        {selectedEmail.content}
                      </pre>
                    </div>
                  </div>

                  {selectedEmail.errorMessage && (
                    <div className="p-4 bg-red-50 rounded-lg">
                      <div className="flex">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-red-800">Delivery Failed</h4>
                          <p className="mt-1 text-sm text-red-700">{selectedEmail.errorMessage}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  {selectedEmail.status === 'failed' && (
                    <button
                      onClick={() => {
                        handleResendEmail(selectedEmail)
                        setSelectedEmail(null)
                      }}
                      disabled={isResending}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 flex items-center"
                    >
                      <ArrowPathIcon className={`h-4 w-4 mr-2 ${isResending ? 'animate-spin' : ''}`} />
                      Resend Email
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedEmail(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EmailHistory